import { Request, Response } from 'express';
import { prisma } from '../prisma';

export default class InvitationController {
  /**
   * Buscar usuários por query
   */
  static async searchUsers(req: Request, res: Response) {
    try {
      const { query = '' } = req.query;
      
      const users = await prisma.user.findMany({
        where: {
          AND: [
            { deletedAt: null }, // Apenas usuários não deletados
            {
              OR: [
                { name: { contains: String(query), mode: 'insensitive' } },
                { email: { contains: String(query), mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
        take: 20,
      });

      const serialized = users.map(user => ({
        id: Number(user.id),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }));

      res.json(serialized);
    } catch (error) {
      console.error('Search users error:', error instanceof Error ? error.message : String(error));
      console.error('Stack:', error instanceof Error ? error.stack : '');
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Convidar usuário para party
   */
  static async inviteUser(req: Request, res: Response) {
    try {
      const { partyId } = req.params;
      const { userId } = req.body;
      const authenticatedUser = (req as any).user;

      // Validar inputs
      if (!partyId || !userId) {
        return res.status(400).json({ message: 'Party ID and User ID are required' });
      }

      if (!authenticatedUser) {
        return res.status(401).json({ message: 'Unauthenticated' });
      }

      // Verificar se party existe
      const party = await prisma.party.findUnique({
        where: { id: BigInt(partyId) },
      });

      if (!party) {
        return res.status(404).json({ message: 'Party not found' });
      }

      // Verificar se é o owner da party
      if (party.ownerId !== BigInt(authenticatedUser.id)) {
        return res.status(403).json({ message: 'Only party owner can invite users' });
      }

      // Verificar se usuário existe
      const user = await prisma.user.findUnique({
        where: { id: BigInt(userId) },
      });

      if (!user || user.deletedAt) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verificar se já é membro da party
      const existingMember = await prisma.partyMember.findFirst({
        where: {
          partyId: BigInt(partyId),
          userId: BigInt(userId),
        },
      });

      if (existingMember) {
        return res.status(400).json({ message: 'User is already a member of this party' });
      }

      // Adicionar como membro
      const newMember = await prisma.partyMember.create({
        data: {
          partyId: BigInt(partyId),
          userId: BigInt(userId),
        },
      });

      res.status(201).json({
        message: 'User invited successfully',
        member: {
          id: Number(newMember.id),
          partyId: Number(newMember.partyId),
          userId: Number(newMember.userId),
          createdAt: newMember.createdAt,
        },
      });
    } catch (error) {
      console.error('Invite user error:', error instanceof Error ? error.message : String(error));
      console.error('Stack:', error instanceof Error ? error.stack : '');
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
