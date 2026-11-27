# Maison Awa — Site et réservation en ligne pour salon de coiffure

**Pour :** salons de coiffure, barbiers et instituts qui prennent encore leurs rendez-vous par
téléphone ou WhatsApp.

Démonstration complète pour un salon fictif d'Abidjan : site vitrine (prestations et tarifs en
FCFA, équipe, infos pratiques) et prise de rendez-vous en 3 étapes sur les créneaux réellement
libres de chaque coiffeuse, avec paiement en ligne ou au salon. Les coiffeuses confirment leurs
rendez-vous depuis leur espace, et l'administrateur suit l'activité.

## Essayer la démo

**Application :** https://app-reservation-three.vercel.app

| Rôle | E-mail | Mot de passe | Ce qu'on peut tester |
| --- | --- | --- | --- |
| Client | `client@demo.app` | `Demo2026!` | Réserver, payer en ligne ou au salon, annuler |
| Coiffeuse (Awa) | `pro@demo.app` | `Demo2026!` | Confirmer ou refuser les demandes, gérer ses horaires |
| Administrateur | `admin@demo.app` | `Demo2026!` | Tableau de bord : réservations et utilisateurs |

Paiement en **mode test** : carte `4242 4242 4242 4242`, une date d'expiration future et
n'importe quel code. Aucun argent réel n'est débité.

> L'API est hébergée sur un plan gratuit : le premier chargement peut prendre environ 30 secondes.

## Ce que fait l'application

**Site vitrine**
- Accueil avec photos, carte des prestations et tarifs en FCFA, équipe, horaires et adresse
- Chaque prestation ou coiffeuse mène directement au parcours de réservation

**Côté client**
- Parcours en 3 étapes : prestation et coiffeuse, jour et heure, confirmation
- Seuls les créneaux libres sont proposés, calculés par l'API selon les horaires, la durée de
  la prestation et les rendez-vous déjà pris
- Choix et récapitulatif conservés dans l'URL : on peut se connecter en cours de route sans rien perdre
- Payer par carte (Stripe Checkout) ou au salon ; un paiement abandonné peut être relancé
- Annuler une réservation en attente, suivre le statut de ses réservations

**Côté coiffeuse**
- Voir ses rendez-vous : à confirmer, confirmés, historique, avec le contact du client
- Confirmer ou refuser une demande ; marquer un rendez-vous terminé ou le client absent
- Définir ses horaires de travail pour chaque jour de la semaine

**Côté administrateur**
- Tableau de bord avec les chiffres clés
- Liste de toutes les réservations et de tous les utilisateurs

**Prêt dans l'API, écrans à venir**
- Gestion des prestations et des exceptions d'horaires (congés, jours fériés)

## Captures

_À ajouter : choix du créneau, paiement, espace prestataire, tableau de bord admin._

## Technique

| Couche | Technologies |
| --- | --- |
| Frontend | Angular 22 (standalone, zoneless, signals), NgRx Signals, CSS sur mesure |
| Backend | NestJS 10 (Fastify), validation Zod, JWT + refresh token, Helmet |
| Base de données | PostgreSQL (Neon) avec Prisma 7 |
| Paiement | Stripe Checkout + webhooks |
| Hébergement | Vercel (frontend), Render (API) |

**Défi traité :** empêcher deux réservations sur le même créneau. Avant chaque réservation,
l'API vérifie qu'aucune réservation en attente ou confirmée ne chevauche le créneau demandé
chez ce prestataire.

**Paiement fiable :** la réservation n'est marquée payée et confirmée qu'à réception du
webhook signé de Stripe, pas sur simple retour du navigateur.

**Droits vérifiés côté serveur :** seul le prestataire concerné (ou l'admin) change le statut
d'un rendez-vous ; un client ne peut qu'annuler sa propre réservation.

## Lancer le projet en local

Prérequis : Node.js 22, une base PostgreSQL (Neon gratuit) et un compte Stripe en mode test.

```bash
# API
cd backend
cp .env.example .env        # puis remplir les valeurs
npm install
npx prisma migrate deploy
npm run seed                # crée les comptes de démo
npm run start:dev           # http://localhost:3000/api/v1

# Frontend (dans un autre terminal)
cd frontend
npm install
npm start                   # http://localhost:4200
```

## Déploiement

- **API (Render)** : le fichier [`render.yaml`](render.yaml) décrit le service. Renseigner
  `DATABASE_URL`, les clés Stripe et `FRONTEND_URL` dans le tableau de bord Render.
- **Frontend (Vercel)** : dossier racine `frontend`. [`frontend/vercel.json`](frontend/vercel.json)
  redirige `/api/v1/*` vers l'API Render, donc aucune configuration CORS n'est nécessaire.
- **Stripe** : déclarer le webhook `https://<api>/api/v1/payments/webhook` dans le
  tableau de bord Stripe (mode test).

## Contact

**Ange Ephraïm Ekra** — développeur full-stack Angular / NestJS.
Je construis des applications de réservation, de gestion et des back-offices pour les PME.

GitHub : [EKRAANGEEPHRAIM](https://github.com/EKRAANGEEPHRAIM) · LinkedIn : _à ajouter_ · E-mail : _à ajouter_
