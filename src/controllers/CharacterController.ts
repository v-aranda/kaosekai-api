import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Validation schema
const characterSchema = z.object({
  data: z.record(z.any()),
  name: z.string().optional(),
});

export class CharacterController {
  static async index(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const characters = await prisma.character.findMany({
        where: {
          userId: BigInt(req.user.id),
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Convert BigInt to number for JSON serialization
      const serializedCharacters = characters.map((char) => ({
        id: Number(char.id),
        user_id: Number(char.userId),
        name: char.name,
        data: char.data,
        created_at: char.createdAt.toISOString(),
        updated_at: char.updatedAt.toISOString(),
      }));

      res.json(serializedCharacters);
    } catch (error) {
      console.error('Index characters error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async store(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      // Validate request
      const validation = characterSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(422).json({
          message: 'The given data was invalid.',
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const { data, name } = validation.data;

      // Extract name from data if not provided
      const characterName = name || (data as any).name || 'Sem Nome';

      const character = await prisma.character.create({
        data: {
          userId: BigInt(req.user.id),
          name: characterName,
          data: data as any,
        },
      });

      res.status(201).json({
        id: Number(character.id),
        user_id: Number(character.userId),
        name: character.name,
        data: character.data,
        created_at: character.createdAt.toISOString(),
        updated_at: character.updatedAt.toISOString(),
      });
    } catch (error) {
      console.error('Store character error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async show(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const characterId = parseInt(req.params.id);

      if (isNaN(characterId)) {
        res.status(404).json({ message: 'Character not found.' });
        return;
      }

      const character = await prisma.character.findFirst({
        where: {
          id: BigInt(characterId),
          userId: BigInt(req.user.id),
        },
      });

      if (!character) {
        res.status(404).json({ message: 'Character not found.' });
        return;
      }

      res.json({
        id: Number(character.id),
        user_id: Number(character.userId),
        name: character.name,
        data: character.data,
        created_at: character.createdAt.toISOString(),
        updated_at: character.updatedAt.toISOString(),
      });
    } catch (error) {
      console.error('Show character error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const characterId = parseInt(req.params.id);

      if (isNaN(characterId)) {
        res.status(404).json({ message: 'Character not found.' });
        return;
      }

      // Validate request
      const validation = characterSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(422).json({
          message: 'The given data was invalid.',
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const { data, name } = validation.data;

      // Check if character exists and belongs to user
      const existingCharacter = await prisma.character.findFirst({
        where: {
          id: BigInt(characterId),
          userId: BigInt(req.user.id),
        },
      });

      if (!existingCharacter) {
        res.status(404).json({ message: 'Character not found.' });
        return;
      }

      // Extract name from data if not provided
      const characterName = name || (data as any).name || existingCharacter.name;

      const character = await prisma.character.update({
        where: {
          id: BigInt(characterId),
        },
        data: {
          name: characterName,
          data: data as any,
        },
      });

      res.json({
        id: Number(character.id),
        user_id: Number(character.userId),
        name: character.name,
        data: character.data,
        created_at: character.createdAt.toISOString(),
        updated_at: character.updatedAt.toISOString(),
      });
    } catch (error) {
      console.error('Update character error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async destroy(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const characterId = parseInt(req.params.id);

      if (isNaN(characterId)) {
        res.status(404).json({ message: 'Character not found.' });
        return;
      }

      // Check if character exists and belongs to user
      const character = await prisma.character.findFirst({
        where: {
          id: BigInt(characterId),
          userId: BigInt(req.user.id),
        },
      });

      if (!character) {
        res.status(404).json({ message: 'Character not found.' });
        return;
      }

      await prisma.character.delete({
        where: {
          id: BigInt(characterId),
        },
      });

      res.json({ message: 'Personagem deletado.' });
    } catch (error) {
      console.error('Destroy character error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
