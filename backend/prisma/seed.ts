import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { DayOfWeek, PrismaClient, Role } from '@prisma/client';

// Données de démonstration : comptes publics affichés dans le README.
// Relançable sans doublons (upsert sur l'e-mail).
const DEMO_PASSWORD = 'Demo2026!';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function upsertUser(email: string, firstName: string, lastName: string, role: Role) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, role },
    create: { email, passwordHash, firstName, lastName, role },
  });
}

async function main(): Promise<void> {
  await upsertUser('admin@demo.app', 'Admin', 'Démo', Role.ADMIN);
  await upsertUser('client@demo.app', 'Koffi', 'Client', Role.CLIENT);
  const providerUser = await upsertUser('pro@demo.app', 'Awa', 'Salon', Role.PROVIDER);

  const provider = await prisma.provider.upsert({
    where: { userId: providerUser.id },
    update: {},
    create: {
      userId: providerUser.id,
      category: 'BEAUTY',
      bio: 'Salon de coiffure et soins, sur rendez-vous.',
      locationAddress: 'Cocody, Abidjan',
    },
  });

  // Services et horaires recréés à chaque seed pour garder une démo propre
  const hasBookings = await prisma.booking.count({ where: { providerId: provider.id } });
  if (hasBookings === 0) {
    await prisma.service.deleteMany({ where: { providerId: provider.id } });
    await prisma.service.createMany({
      data: [
        { providerId: provider.id, name: 'Coupe et brushing', durationMin: 60, price: 25 },
        { providerId: provider.id, name: 'Tresses', durationMin: 180, price: 60 },
        { providerId: provider.id, name: 'Soin du visage', durationMin: 45, price: 30 },
      ],
    });
  }

  await prisma.availability.deleteMany({ where: { providerId: provider.id } });
  const workingDays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  await prisma.availability.createMany({
    data: workingDays.map((dayOfWeek) => ({
      providerId: provider.id,
      dayOfWeek,
      startTime: '09:00',
      endTime: '18:00',
    })),
  });

  console.log('Seed terminé : admin@demo.app, pro@demo.app, client@demo.app');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
