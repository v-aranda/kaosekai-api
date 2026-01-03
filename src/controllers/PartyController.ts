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

async function generateUniqueCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let exists = true;

  while (exists) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const existing = await db.party.findUnique({
      where: { code },
    });
    exists = !!existing;
  }

  return code!;
}

function serializeParty(party: any, membersCount: number) {
  return {
    id: Number(party.id),
    owner_id: Number(party.ownerId),
    name: party.name,
    description: party.description,
    banner: party.banner ?? null,
    code: party.code,
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

      // Get parties owned by the user
      const ownedParties = await db.party.findMany({
        where: { ownerId: BigInt(req.user.id) },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { members: true } } },
      });

      // Get parties where the user is a member
      const memberParties = await db.party.findMany({
        where: {
          members: {
            some: { userId: BigInt(req.user.id) }
          }
        },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { members: true } } },
      });

      // Merge and deduplicate parties
      const allPartiesMap = new Map();
      
      ownedParties.forEach((party: any) => {
        allPartiesMap.set(Number(party.id), { party, membersCount: party._count?.members ?? 0 });
      });

      memberParties.forEach((party: any) => {
        if (!allPartiesMap.has(Number(party.id))) {
          allPartiesMap.set(Number(party.id), { party, membersCount: party._count?.members ?? 0 });
        }
      });

      const serialized = Array.from(allPartiesMap.values()).map(({ party, membersCount }) =>
        serializeParty(party, membersCount)
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

      const code = await generateUniqueCode();

      const party = await db.party.create({
        data: {
          ownerId: BigInt(req.user.id),
          name,
          description,
          banner: banner ?? null,
          code,
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

  static async findByCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const code = req.params.code?.toUpperCase();
      if (!code || code.length !== 6) {
        res.status(422).json({ message: 'Invalid code format. Code must be 6 characters.' });
        return;
      }

      const party = await db.party.findUnique({
        where: { code },
        include: { _count: { select: { members: true } } },
      });

      if (!party) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      res.json(serializeParty(party, party._count?.members ?? 0));
    } catch (error) {
      console.error('Find party by code error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async joinParty(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthenticated.' });
        return;
      }

      const code = req.body.code?.toUpperCase();
      if (!code || code.length !== 6) {
        res.status(422).json({ message: 'Invalid code format. Code must be 6 characters.' });
        return;
      }

      const party = await db.party.findUnique({
        where: { code },
      });

      if (!party) {
        res.status(404).json({ message: 'Party not found.' });
        return;
      }

      // Check if user is already a member or owner
      if (Number(party.ownerId) === req.user.id) {
        res.status(400).json({ message: 'You are already the owner of this party.' });
        return;
      }

      const existingMembership = await db.partyMember.findFirst({
        where: {
          partyId: party.id,
          userId: BigInt(req.user.id),
        },
      });

      if (existingMembership) {
        res.status(400).json({ message: 'You are already a member of this party.' });
        return;
      }

      // Add user as member
      await db.partyMember.create({
        data: {
          partyId: party.id,
          userId: BigInt(req.user.id),
        },
      });

      const updatedParty = await db.party.findUnique({
        where: { code },
        include: { _count: { select: { members: true } } },
      });

      res.status(201).json(serializeParty(updatedParty, updatedParty._count?.members ?? 0));
    } catch (error) {
      console.error('Join party error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
