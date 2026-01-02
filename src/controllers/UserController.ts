import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../prisma';

const roleEnum = z.enum(['ADMIN', 'GM', 'PLAYER']);

const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(6),
  role: roleEnum.optional().default('PLAYER'),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: roleEnum.optional(),
});

const serializeUser = (user: any) => ({
  id: Number(user.id),
  name: user.name,
  email: user.email,
  role: user.role,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
});

export class UserController {
  static async index(_req: Request, res: Response): Promise<void> {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users.map(serializeUser));
  }

  static async store(req: Request, res: Response): Promise<void> {
    const validation = createUserSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(422).json({
        message: 'The given data was invalid.',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password, role } = validation.data;

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role },
      });

      res.status(201).json(serializeUser(user));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        res.status(422).json({
          message: 'The given data was invalid.',
          errors: {
            email: ['The email has already been taken.'],
          },
        });
        return;
      }

      console.error('Create user error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    const validation = updateUserSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(422).json({
        message: 'The given data was invalid.',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const userId = Number(req.params.id);

    try {
      const data: any = { ...validation.data };

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 12);
      }

      const user = await prisma.user.update({
        where: { id: BigInt(userId) },
        data,
      });

      res.json(serializeUser(user));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          res.status(422).json({
            message: 'The given data was invalid.',
            errors: {
              email: ['The email has already been taken.'],
            },
          });
          return;
        }

        if (err.code === 'P2025') {
          res.status(404).json({ message: 'User not found.' });
          return;
        }
      }

      console.error('Update user error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async destroy(req: Request, res: Response): Promise<void> {
    const userId = Number(req.params.id);

    try {
      await prisma.user.update({
        where: { id: BigInt(userId) },
        data: { deletedAt: new Date() },
      });

      res.json({ message: 'User deleted.' });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        res.status(404).json({ message: 'User not found.' });
        return;
      }

      console.error('Delete user error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
