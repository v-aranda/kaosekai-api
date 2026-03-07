import { PrismaClient, Role, PartyType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password
  const password = await bcrypt.hash('password', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kaosekai.com' },
    update: {},
    create: {
      email: 'admin@kaosekai.com',
      name: 'Admin User',
      password,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create Player User
  const player = await prisma.user.upsert({
    where: { email: 'player@kaosekai.com' },
    update: {},
    create: {
      email: 'player@kaosekai.com',
      name: 'Player User',
      password,
      role: Role.PLAYER,
    },
  });
  console.log(`✅ Player user created: ${player.email}`);

  // Create a Public Party (Campaign)
  const party = await prisma.party.upsert({
    where: { code: 'PUBLIC01' },
    update: {},
    create: {
      name: 'Aventureiros de Kaosekai',
      description: 'Uma campanha pública para iniciantes no mundo de Kaosekai.',
      ownerId: admin.id,
      code: 'PUBLIC01',
      type: PartyType.PUBLIC,
    },
  });
  console.log(`✅ Party created: ${party.name}`);

  // Create a Character for the Player
  // Check if character exists to avoid duplicates on run-loop if not using upsert with unique constraint on non-unique fields
  const existingChar = await prisma.character.findFirst({
    where: {
      userId: player.id,
      name: 'Heroi Iniciante',
    },
  });

  if (!existingChar) {
    const character = await prisma.character.create({
      data: {
        userId: player.id,
        name: 'Heroi Iniciante',
        data: {
          class: 'Guerreiro',
          level: 1,
          stats: { str: 10, dex: 10, int: 10 },
        },
      },
    });
    console.log(`✅ Character created: ${character.name}`);
  } else {
    console.log(`ℹ️ Character 'Heroi Iniciante' already exists.`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
