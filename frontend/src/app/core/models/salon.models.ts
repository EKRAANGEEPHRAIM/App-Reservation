/** Prestation d'un coiffeur, telle que renvoyée par GET /users/providers */
export interface Prestation {
  id: string;
  name: string;
  description?: string | null;
  durationMin: number;
  /** Decimal Prisma sérialisé en chaîne */
  price: number | string;
  currency: string;
}

/** Coiffeur ou coiffeuse = un prestataire de l'API */
export interface Stylist {
  id: string;
  bio?: string | null;
  category: string;
  user: { firstName: string; lastName: string; avatarUrl?: string | null };
  services: Prestation[];
}

export const stylistName = (s: Stylist): string => `${s.user.firstName} ${s.user.lastName}`;

export const initials = (s: Stylist): string =>
  `${s.user.firstName.charAt(0)}${s.user.lastName.charAt(0)}`.toUpperCase();
