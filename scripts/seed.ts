/**
 * Script para popular o banco de dados com dados de teste
 * 
 * USO:
 *   tsx scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    // Criar usuário de teste
    console.log('👤 Criando usuário de teste...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'teste@kaosekai.com' },
      create: {
        name: 'Usuário Teste',
        email: 'teste@kaosekai.com',
        password: hashedPassword,
      },
      update: {},
    });
    console.log(`✅ Usuário criado: ${user.email}\n`);

    // Criar personagem de exemplo
    console.log('🎭 Criando personagem de exemplo...');
    const character = await prisma.character.create({
      data: {
        userId: user.id,
        name: 'Kael, o Aventureiro',
        data: {
          name: 'Kael, o Aventureiro',
          playerName: 'Jogador Teste',
          characterImage: null,
          stats: {
            body: 2,
            senses: 3,
            mind: 1,
            soul: 2,
          },
          hp: { current: 20, max: 20 },
          determination: { current: 5, max: 5 },
          rd: 0,
          block: 10,
          skills: [
            { name: 'Atletismo', value: 4 },
            { name: 'Percepção', value: 5 },
            { name: 'Investigação', value: 3 },
          ],
          conditions: [],
          attacks: [
            {
              name: 'Espada Longa',
              damage: '2d6+2',
              graze: '1d6+2',
              critical: '3d6+4',
            },
          ],
          abilities: [
            {
              name: 'Golpe Poderoso',
              type: 'Ação',
              cost: '1 Determinação',
              description: 'Realiza um ataque com +2d6 de dano adicional.',
            },
          ],
          feats: [],
          notes: 'Personagem de exemplo para testes',
          origin: 'Terra dos Ventos',
          investigationNotes: [],
          inventory: [
            {
              id: '1',
              name: 'Poção de Cura',
              description: 'Restaura 2d6 HP',
              icon: '🧪',
              size: 1,
              quantity: 3,
              type: 'CONSUMIVEL',
            },
            {
              id: '2',
              name: 'Espada Longa',
              description: 'Uma espada bem equilibrada',
              icon: '⚔️',
              size: 2,
              quantity: 1,
              type: 'EQUIPAMENTO',
              equipped: true,
            },
          ],
          credits: 100,
        },
      },
    });
    console.log(`✅ Personagem criado: ${character.name}\n`);

    console.log('🎉 Seed concluído com sucesso!');
    console.log('\n📝 Credenciais de teste:');
    console.log('   Email: teste@kaosekai.com');
    console.log('   Senha: password123');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
