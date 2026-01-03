import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth';

// NOTE: After changing Prisma schema, run `npx prisma generate`.
// Casting to any here avoids type errors until the client is regenerated.
const db = prisma as any;

const postSchema = z.object({
  text: z.string().min(1).max(5000),
  images: z.array(z.string().url()).optional().default([]),
});

function serializePost(post: any) {
  return {
    id: Number(post.id),
    party_id: Number(post.partyId),
    user_id: Number(post.userId),
    text: post.text,
    images: post.images || [],
    user: {
      id: Number(post.user.id),
      name: post.user.name,
      avatar: post.user.avatar,
    },
    created_at: post.createdAt.toISOString(),
    updated_at: post.updatedAt.toISOString(),
  };
}

export class PostController {
  static async index(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const partyId = parseInt(req.params.partyId, 10);
      if (isNaN(partyId)) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      // Verify user is owner or member of the party
      const party = await db.party.findUnique({
        where: { id: BigInt(partyId) },
      });

      if (!party) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      const isOwner = party.ownerId === BigInt(req.user.id);
      const isMember = !!await db.partyMember.findUnique({
        where: {
          partyId_userId: {
            partyId: BigInt(partyId),
            userId: BigInt(req.user.id),
          },
        },
      });

      if (!isOwner && !isMember) {
        res.status(403).json({ message: 'You do not have access to this party.' });
        return;
      }

      const posts = await db.post.findMany({
        where: { partyId: BigInt(partyId) },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const serialized = posts.map((post: any) => serializePost(post));
      res.json(serialized);
    } catch (error) {
      console.error('Index posts error:', error instanceof Error ? error.message : String(error));
      console.error('Stack:', error instanceof Error ? error.stack : '');
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  static async store(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const partyId = parseInt(req.params.partyId, 10);
      if (isNaN(partyId)) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      // Verify user is owner or member of the party
      const party = await db.party.findUnique({
        where: { id: BigInt(partyId) },
      });

      if (!party) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      const isOwner = party.ownerId === BigInt(req.user.id);
      const isMember = !!await db.partyMember.findUnique({
        where: {
          partyId_userId: {
            partyId: BigInt(partyId),
            userId: BigInt(req.user.id),
          },
        },
      });

      if (!isOwner && !isMember) {
        res.status(403).json({ message: 'You do not have access to this party.' });
        return;
      }

      const validation = postSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(422).json({
          message: 'The given data was invalid.',
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const { text, images } = validation.data;

      const post = await db.post.create({
        data: {
          partyId: BigInt(partyId),
          userId: BigInt(req.user.id),
          text,
          images: images || [],
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });

      res.status(201).json(serializePost(post));
    } catch (error) {
      console.error('Store post error:', error instanceof Error ? error.message : String(error));
      console.error('Stack:', error instanceof Error ? error.stack : '');
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  static async destroy(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const postId = parseInt(req.params.id, 10);
      if (isNaN(postId)) {
        res.status(404).json({ message: 'Post not found.' });
        return;
      }

      const post = await db.post.findUnique({
        where: { id: BigInt(postId) },
      });

      if (!post) {
        res.status(404).json({ message: 'Post not found.' });
        return;
      }

      // Only allow deletion by post author
      if (post.userId !== BigInt(req.user.id)) {
        res.status(403).json({ message: 'You cannot delete this post.' });
        return;
      }

      await db.post.delete({ where: { id: BigInt(postId) } });

      res.json({ message: 'Post deleted.' });
    } catch (error) {
      console.error('Destroy post error:', error instanceof Error ? error.message : String(error));
      console.error('Stack:', error instanceof Error ? error.stack : '');
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
