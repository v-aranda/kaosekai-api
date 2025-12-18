import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { generateToken, hashToken, generateRandomToken } from '../utils/token';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  name: z.string().max(255),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const validation = registerSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(422).json({
          message: 'The given data was invalid.',
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const { name, email, password } = validation.data;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(422).json({
          message: 'The given data was invalid.',
          errors: {
            email: ['The email has already been taken.'],
          },
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Generate token
      const rawToken = generateRandomToken();
      const tokenHash = hashToken(rawToken);
      
      await prisma.token.create({
        data: {
          userId: user.id,
          token: tokenHash,
          name: 'api_token',
        },
      });

      const jwtToken = generateToken(Number(user.id), tokenHash);

      res.status(201).json({
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
        },
        access_token: jwtToken,
        token_type: 'Bearer',
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const validation = loginSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(422).json({
          message: 'The given data was invalid.',
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const { email, password } = validation.data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          message: 'The provided credentials are incorrect.',
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          message: 'The provided credentials are incorrect.',
        });
        return;
      }

      // Generate token
      const rawToken = generateRandomToken();
      const tokenHash = hashToken(rawToken);
      
      await prisma.token.create({
        data: {
          userId: user.id,
          token: tokenHash,
          name: 'api_token',
        },
      });

      const jwtToken = generateToken(Number(user.id), tokenHash);

      res.json({
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
        },
        access_token: jwtToken,
        token_type: 'Bearer',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tokenHash) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      // Delete the current token
      await prisma.token.deleteMany({
        where: {
          token: req.tokenHash,
        },
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      res.json(req.user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
