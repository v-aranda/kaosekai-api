import { Request, Response } from 'express';
import { prisma } from '../prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', file.fieldname === 'coverImage' ? 'covers' : 'pdfs');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'coverImage') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Capa deve ser uma imagem'));
      }
    } else if (file.fieldname === 'pdfFile') {
      if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Arquivo deve ser um PDF'));
      }
    }
    cb(null, true);
  }
});

export class DocumentController {
  private static parseId(id: string) {
    try {
      return BigInt(id);
    } catch (e) {
      return null;
    }
  }

  private static resolveFileDiskPath(relativePath: string) {
    const cleanPath = relativePath.replace(/^\/+/, '');
    return path.join(process.cwd(), cleanPath);
  }

  // Listagem pública: somente documentos finalizados
  static async publicIndex(req: Request, res: Response) {
    try {
      const documents = await prisma.document.findMany({
        where: { isWip: false },
        orderBy: { createdAt: 'desc' }
      });

      res.json(documents.map(doc => ({ ...doc, id: doc.id.toString() })));
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      res.status(500).json({ message: 'Erro ao listar documentos' });
    }
  }

  // Listagem admin: inclui WIP
  static async adminIndex(req: Request, res: Response) {
    try {
      const documents = await prisma.document.findMany({
        orderBy: { createdAt: 'desc' }
      });

      res.json(documents.map(doc => ({ ...doc, id: doc.id.toString() })));
    } catch (error) {
      console.error('Erro ao listar documentos (admin):', error);
      res.status(500).json({ message: 'Erro ao listar documentos' });
    }
  }

  // Visualização pública: bloqueia WIP
  static async publicShow(req: Request, res: Response) {
    try {
      const parsedId = DocumentController.parseId(req.params.id);
      if (parsedId === null) return res.status(404).json({ message: 'Documento não encontrado' });

      const document = await prisma.document.findUnique({
        where: { id: parsedId }
      });

      if (!document || document.isWip) {
        return res.status(404).json({ message: 'Documento não encontrado' });
      }

      return res.json({ ...document, id: document.id.toString() });
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      return res.status(500).json({ message: 'Erro ao buscar documento' });
    }
  }

  // Visualização admin
  static async adminShow(req: Request, res: Response) {
    try {
      const parsedId = DocumentController.parseId(req.params.id);
      if (parsedId === null) return res.status(404).json({ message: 'Documento não encontrado' });

      const document = await prisma.document.findUnique({
        where: { id: parsedId }
      });

      if (!document) {
        return res.status(404).json({ message: 'Documento não encontrado' });
      }

      return res.json({ ...document, id: document.id.toString() });
    } catch (error) {
      console.error('Erro ao buscar documento (admin):', error);
      return res.status(500).json({ message: 'Erro ao buscar documento' });
    }
  }

  // Criar novo documento (admin only)
  static async store(req: Request, res: Response) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files?.coverImage?.[0] || !files?.pdfFile?.[0]) {
        return res.status(400).json({ 
          message: 'Capa e arquivo PDF são obrigatórios' 
        });
      }

      const { name, version, isWip } = req.body;

      if (!name || !version) {
        return res.status(400).json({ 
          message: 'Nome e versão são obrigatórios' 
        });
      }

      const coverImage = `/uploads/covers/${files.coverImage[0].filename}`;
      const pdfFile = `/uploads/pdfs/${files.pdfFile[0].filename}`;

      const document = await prisma.document.create({
        data: {
          name,
          version,
          coverImage,
          pdfFile,
          isWip: isWip === 'true' || isWip === true
        }
      });

      return res.status(201).json({
        ...document,
        id: document.id.toString()
      });
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      return res.status(500).json({ message: 'Erro ao criar documento' });
    }
  }

  // Atualizar documento (admin only)
  static async update(req: Request, res: Response) {
    try {
      const parsedId = DocumentController.parseId(req.params.id);
      if (parsedId === null) return res.status(404).json({ message: 'Documento não encontrado' });
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { name, version, isWip } = req.body;

      const existingDoc = await prisma.document.findUnique({
        where: { id: parsedId }
      });

      if (!existingDoc) {
        return res.status(404).json({ message: 'Documento não encontrado' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (version) updateData.version = version;
      if (isWip !== undefined) updateData.isWip = isWip === 'true' || isWip === true;

      // Se enviou nova capa, atualiza e deleta a antiga
      if (files?.coverImage?.[0]) {
        updateData.coverImage = `/uploads/covers/${files.coverImage[0].filename}`;
        // Deleta arquivo antigo
        try {
          await fs.unlink(DocumentController.resolveFileDiskPath(existingDoc.coverImage));
        } catch (e) {
          console.error('Erro ao deletar capa antiga:', e);
        }
      }

      // Se enviou novo PDF, atualiza e deleta o antigo
      if (files?.pdfFile?.[0]) {
        updateData.pdfFile = `/uploads/pdfs/${files.pdfFile[0].filename}`;
        // Deleta arquivo antigo
        try {
          await fs.unlink(DocumentController.resolveFileDiskPath(existingDoc.pdfFile));
        } catch (e) {
          console.error('Erro ao deletar PDF antigo:', e);
        }
      }

      const document = await prisma.document.update({
        where: { id: parsedId },
        data: updateData
      });

      return res.json({
        ...document,
        id: document.id.toString()
      });
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      return res.status(500).json({ message: 'Erro ao atualizar documento' });
    }
  }

  // Deletar documento (admin only)
  static async destroy(req: Request, res: Response) {
    try {
      const parsedId = DocumentController.parseId(req.params.id);
      if (parsedId === null) return res.status(404).json({ message: 'Documento não encontrado' });

      const document = await prisma.document.findUnique({
        where: { id: parsedId }
      });

      if (!document) {
        return res.status(404).json({ message: 'Documento não encontrado' });
      }

      // Deleta arquivos físicos
      try {
        await fs.unlink(DocumentController.resolveFileDiskPath(document.coverImage));
        await fs.unlink(DocumentController.resolveFileDiskPath(document.pdfFile));
      } catch (e) {
        console.error('Erro ao deletar arquivos:', e);
      }

      await prisma.document.delete({
        where: { id: parsedId }
      });

      return res.json({ message: 'Documento deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      return res.status(500).json({ message: 'Erro ao deletar documento' });
    }
  }
}
