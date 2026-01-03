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

    // Criar usuário ADMIN
    console.log('👤 Criando usuário ADMIN...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@kaosekai.com' },
      create: {
        name: 'Admin Kaosekai',
        email: 'admin@kaosekai.com',
        password: adminPassword,
        role: 'ADMIN',
      },
      update: { role: 'ADMIN' },
    });
    console.log(`✅ Admin criado: ${admin.email} (role: ${admin.role})\n`);

    // Criar usuário de teste (PLAYER)
    console.log('👤 Criando usuário de teste...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'teste@kaosekai.com' },
      create: {
        name: 'Usuário Teste',
        email: 'teste@kaosekai.com',
        password: hashedPassword,
        role: 'PLAYER',
      },
      update: { role: 'PLAYER' },
    });
    console.log(`✅ Usuário criado: ${user.email} (role: ${user.role})\n`);

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

    // Criar parties
    console.log('🎭 Criando parties...');
    const party1 = await prisma.party.create({
      data: {
        ownerId: user.id,
        name: 'Aventureiros do Bosque',
        description: 'Uma grupo de aventureiros explorando as florestas misteriosas.',
        banner: null,
        type: 'PUBLIC',
      },
    });
    console.log(`✅ Party criada: ${party1.name}\n`);

    const party2 = await prisma.party.create({
      data: {
        ownerId: admin.id,
        name: 'Guardiões da Coroa',
        description: 'Defensores da realeza contra as trevas.',
        banner: null,
        type: 'PRIVATE',
      },
    });
    console.log(`✅ Party criada: ${party2.name}\n`);

    // Adicionar usuário como membro na party do admin
    await prisma.partyMember.create({
      data: {
        partyId: party2.id,
        userId: user.id,
      },
    });
    console.log(`✅ ${user.name} adicionado como membro de ${party2.name}\n`);

    console.log('🎉 Seed concluído com sucesso!');
    console.log('\n📝 Credenciais de teste:');
    console.log('   Email: teste@kaosekai.com');
    console.log('   Senha: password123');
    console.log('\n🎭 Parties criadas:');
    console.log(`   - ${party1.name} (Criada por ${user.name})`);
    console.log(`   - ${party2.name} (Criada por ${admin.name}, ${user.name} é membro)`);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
