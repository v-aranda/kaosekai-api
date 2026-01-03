import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth';

// NOTE: After changing Prisma schema, run `npx prisma generate`.
// Casting to any here avoids type errors until the client is regenerated.
const db = prisma as any;

const partySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  banner: z.string().url().trim().optional().nullable(),
  type: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

const partyUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  banner: z.string().url().trim().nullable().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

function serializeParty(party: any, membersCount: number) {
  return {
    id: Number(party.id),
    owner_id: Number(party.ownerId),
    name: party.name,
    description: party.description,
    banner: party.banner ?? null,
    type: party.type,
    members_count: membersCount,
    created_at: party.createdAt.toISOString(),
    updated_at: party.updatedAt.toISOString(),
  };
}

export class PartyController {
  static async index(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const parties = await db.party.findMany({
        where: { ownerId: BigInt(req.user.id) },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { members: true } } },
      });

      const serialized = parties.map((party: any) =>
        serializeParty(party, party._count?.members ?? 0)
      );

      res.json(serialized);
    } catch (error) {
      console.error('Index parties error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async store(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const validation = partySchema.safeParse(req.body);
      if (!validation.success) {
        res.status(422).json({
          message: 'The given data was invalid.',
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const { name, description, banner, type } = validation.data;

      const party = await db.party.create({
        data: {
          ownerId: BigInt(req.user.id),
          name,
          description,
          banner: banner ?? null,
          type: type ?? 'PUBLIC',
        },
      });

      res.status(201).json(serializeParty(party, 0));
    } catch (error) {
      console.error('Store party error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async show(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const partyId = parseInt(req.params.id, 10);
      if (isNaN(partyId)) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      const party = await db.party.findFirst({
        where: { id: BigInt(partyId), ownerId: BigInt(req.user.id) },
        include: { _count: { select: { members: true } } },
      });

      if (!party) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      res.json(serializeParty(party, party._count?.members ?? 0));
    } catch (error) {
      console.error('Show party error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const partyId = parseInt(req.params.id, 10);
      if (isNaN(partyId)) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      const validation = partyUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(422).json({
          message: 'The given data was invalid.',
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const existing = await db.party.findFirst({
        where: { id: BigInt(partyId), ownerId: BigInt(req.user.id) },
      });

      if (!existing) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      const { name, description, banner, type } = validation.data;

      await db.party.update({
        where: { id: BigInt(partyId) },
        data: {
          name: name ?? existing.name,
          description: description ?? existing.description,
          banner: banner !== undefined ? banner : existing.banner,
          type: type ?? existing.type,
        },
      });

      const party = await db.party.findFirst({
        where: { id: BigInt(partyId), ownerId: BigInt(req.user.id) },
        include: { _count: { select: { members: true } } },
      });

      if (!party) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      res.json(serializeParty(party, party._count?.members ?? 0));
    } catch (error) {
      console.error('Update party error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async destroy(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const partyId = parseInt(req.params.id, 10);
      if (isNaN(partyId)) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      const existing = await db.party.findFirst({
        where: { id: BigInt(partyId), ownerId: BigInt(req.user.id) },
      });

      if (!existing) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      await db.party.delete({ where: { id: BigInt(partyId) } });

      res.json({ message: 'Party deleted.' });
    } catch (error) {
      console.error('Destroy party error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
