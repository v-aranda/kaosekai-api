import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Storage para imagens gerais (avatar, notas, etc)
const storage = multer.diskStorage({
  destination: async (_req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

export const imageUpload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB para imagens
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas arquivos de imagem são permitidos'));
    }
    cb(null, true);
  }
});

export class UploadController {
  static async uploadImage(req: Request, res: Response) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ message: 'Arquivo de imagem é obrigatório' });
      }

      const relativePath = `/uploads/images/${file.filename}`;

      return res.status(201).json({
        url: relativePath,
        path: relativePath,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });
    } catch (error) {
      console.error('Erro ao fazer upload de imagem:', error);
      return res.status(500).json({ message: 'Erro ao fazer upload da imagem' });
    }
  }
}
