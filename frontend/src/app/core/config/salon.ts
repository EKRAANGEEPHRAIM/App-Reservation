/**
 * Informations vitrines du salon fictif de démonstration.
 * Les prestations, coiffeurs et horaires réservables viennent de l'API.
 */
export const SALON = {
  name: 'Maison Awa',
  tagline: 'Salon de coiffure · Cocody, Abidjan',
  address: 'Riviera 2, Cocody — Abidjan',
  phone: '+225 07 00 00 00 00',
  email: 'contact@maison-awa.demo',
  hours: [
    { days: 'Mardi – Samedi', time: '9h – 19h' },
    { days: 'Lundi', time: 'Barbier seulement, 10h – 20h' },
    { days: 'Dimanche', time: 'Fermé' },
  ],
} as const;

/** Photos Unsplash (licence libre), servies redimensionnées par leur CDN */
const unsplash = (id: string, width: number): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;

export const SALON_IMAGES = {
  hero: unsplash('1702236240794-58dc4c6895e5', 1400),
  interior: unsplash('1600948836101-f9ffda59d250', 1200),
  braids: unsplash('1527203561188-dae1bc1a417f', 800),
  locs: unsplash('1618803208984-d8ce17b9093d', 800),
} as const;

/** Prix en francs CFA : 25000 → « 25 000 FCFA » */
export function formatPrice(amount: number | string, currency = 'XOF'): string {
  const value = Number(amount);
  if (currency === 'XOF') {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} FCFA`;
  }
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value);
}

/** Durée en minutes : 90 → « 1 h 30 » */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}
