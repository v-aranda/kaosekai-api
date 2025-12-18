/**
 * Script para migrar dados do Laravel para Node.js API
 * 
 * Este script migra:
 * - Usuários (preservando IDs)
 * - Personagens (preservando IDs e relacionamentos)
 * 
 * USO:
 *   tsx scripts/migrate-from-laravel.ts
 * 
 * REQUISITOS:
 *   - Database Laravel configurado em LARAVEL_DATABASE_URL
 *   - Database Node.js configurado em DATABASE_URL (.env)
 */

import { PrismaClient as LaravelPrisma } from '@prisma/client';
import { PrismaClient as NodePrisma } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const laravelDb = new LaravelPrisma({
  datasources: {
    db: {
      url: process.env.LARAVEL_DATABASE_URL || '',
    },
  },
});

const nodeDb = new NodePrisma();

async function migrate() {
  try {
    console.log('🚀 Iniciando migração de dados...\n');

    // Migrate Users
    console.log('📋 Migrando usuários...');
    const laravelUsers = await laravelDb.user.findMany();
    
    for (const user of laravelUsers) {
      await nodeDb.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          emailVerifiedAt: user.emailVerifiedAt,
          rememberToken: user.rememberToken,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        update: {
          name: user.name,
          email: user.email,
          password: user.password,
          emailVerifiedAt: user.emailVerifiedAt,
          rememberToken: user.rememberToken,
          updatedAt: user.updatedAt,
        },
      });
    }
    console.log(`✅ ${laravelUsers.length} usuários migrados\n`);

    // Migrate Characters
    console.log('📋 Migrando personagens...');
    const laravelCharacters = await laravelDb.character.findMany();
    
    for (const character of laravelCharacters) {
      await nodeDb.character.upsert({
        where: { id: character.id },
        create: {
          id: character.id,
          userId: character.userId,
          name: character.name,
          data: character.data,
          createdAt: character.createdAt,
          updatedAt: character.updatedAt,
        },
        update: {
          userId: character.userId,
          name: character.name,
          data: character.data,
          updatedAt: character.updatedAt,
        },
      });
    }
    console.log(`✅ ${laravelCharacters.length} personagens migrados\n`);

    console.log('🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await laravelDb.$disconnect();
    await nodeDb.$disconnect();
  }
}

migrate();
