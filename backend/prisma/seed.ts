import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { DayOfWeek, PrismaClient, Role } from '@prisma/client';

// Données de démonstration du salon fictif « Maison Awa » (Abidjan) : comptes publics
// affichés dans le README. Relançable sans doublons (upsert sur l'e-mail).
const DEMO_PASSWORD = 'Demo2026!';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

interface StylistSeed {
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  days: DayOfWeek[];
  hours: [string, string];
  services: { name: string; description: string; durationMin: number; price: number }[];
}

const TUESDAY_TO_SATURDAY: DayOfWeek[] = ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const STYLISTS: StylistSeed[] = [
  {
    email: 'pro@demo.app',
    firstName: 'Awa',
    lastName: 'Koné',
    bio: 'Fondatrice du salon. Spécialiste des tresses, nattes collées et coiffures protectrices.',
    days: TUESDAY_TO_SATURDAY,
    hours: ['09:00', '19:00'],
    services: [
      { name: 'Nattes collées', description: 'Nattes simples ou en motifs, mèches comprises.', durationMin: 120, price: 10000 },
      { name: 'Tresses box braids', description: 'Box braids longueur épaules ou dos, mèches comprises.', durationMin: 240, price: 25000 },
      { name: 'Knotless braids', description: 'Tresses sans nœud, plus légères sur le cuir chevelu.', durationMin: 300, price: 35000 },
    ],
  },
  {
    email: 'fatou@demo.app',
    firstName: 'Fatou',
    lastName: 'Diallo',
    bio: 'Coupe, couleur et soins des cheveux naturels et défrisés.',
    days: TUESDAY_TO_SATURDAY,
    hours: ['09:00', '18:00'],
    services: [
      { name: 'Shampoing et brushing', description: 'Lavage, soin démêlant et brushing.', durationMin: 60, price: 6000 },
      { name: 'Coupe femme', description: 'Coupe sur cheveux naturels ou lissés, avec brushing.', durationMin: 60, price: 8000 },
      { name: 'Soin hydratant profond', description: 'Bain d’huile et masque sous vapeur pour cheveux secs.', durationMin: 45, price: 7000 },
    ],
  },
  {
    email: 'yann@demo.app',
    firstName: 'Yann',
    lastName: 'Aka',
    bio: 'Barbier : dégradés, contours nets et taille de barbe.',
    days: ['MONDAY', ...TUESDAY_TO_SATURDAY],
    hours: ['10:00', '20:00'],
    services: [
      { name: 'Coupe homme dégradé', description: 'Dégradé à la tondeuse et finitions au rasoir.', durationMin: 45, price: 4000 },
      { name: 'Taille de barbe', description: 'Taille, contours et serviette chaude.', durationMin: 30, price: 2500 },
    ],
  },
];

async function upsertUser(email: string, firstName: string, lastName: string, role: Role) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, role, firstName, lastName },
    create: { email, passwordHash, firstName, lastName, role },
  });
}

async function seedStylist(stylist: StylistSeed): Promise<void> {
  const user = await upsertUser(stylist.email, stylist.firstName, stylist.lastName, Role.PROVIDER);
  const provider = await prisma.provider.upsert({
    where: { userId: user.id },
    update: { bio: stylist.bio, category: 'BEAUTY', locationAddress: 'Riviera 2, Cocody, Abidjan' },
    create: {
      userId: user.id,
      category: 'BEAUTY',
      bio: stylist.bio,
      locationAddress: 'Riviera 2, Cocody, Abidjan',
    },
  });

  // Services recréés seulement s'il n'y a pas encore de réservation (clé étrangère)
  const hasBookings = await prisma.booking.count({ where: { providerId: provider.id } });
  if (hasBookings === 0) {
    await prisma.service.deleteMany({ where: { providerId: provider.id } });
    await prisma.service.createMany({
      data: stylist.services.map((s) => ({ ...s, providerId: provider.id, currency: 'XOF' })),
    });
  }

  await prisma.availability.deleteMany({ where: { providerId: provider.id } });
  await prisma.availability.createMany({
    data: stylist.days.map((dayOfWeek) => ({
      providerId: provider.id,
      dayOfWeek,
      startTime: stylist.hours[0],
      endTime: stylist.hours[1],
    })),
  });
}

async function main(): Promise<void> {
  await upsertUser('admin@demo.app', 'Admin', 'Maison Awa', Role.ADMIN);
  await upsertUser('client@demo.app', 'Koffi', 'Kouassi', Role.CLIENT);
  for (const stylist of STYLISTS) await seedStylist(stylist);

  console.log(`Seed terminé : admin@demo.app, client@demo.app, ${STYLISTS.map((s) => s.email).join(', ')}`);
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
