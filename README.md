# App-reservation — Prise de rendez-vous en ligne

**Pour :** salons de coiffure, coachs, cabinets, centres de soins… toute activité qui prend
encore ses rendez-vous par téléphone ou WhatsApp.

Vos clients choisissent un service et réservent en ligne, sans risque de double réservation.
Vous fixez vos horaires depuis votre espace, et l'administrateur suit l'activité.

## Essayer la démo

**Application :** _lien à ajouter après déploiement_

| Rôle | E-mail | Mot de passe | Ce qu'on peut tester |
| --- | --- | --- | --- |
| Client | `client@demo.app` | `Demo2026!` | Réserver une prestation, voir ses réservations |
| Prestataire | `pro@demo.app` | `Demo2026!` | Gérer ses horaires de travail |
| Administrateur | `admin@demo.app` | `Demo2026!` | Tableau de bord : réservations et utilisateurs |

> L'API est hébergée sur un plan gratuit : le premier chargement peut prendre environ 30 secondes.

## Ce que fait l'application

**Côté client**
- Choisir une catégorie (coiffure, coaching, médical), un prestataire et un service (durée, prix)
- Réserver une date et une heure : l'API refuse tout créneau déjà pris
- Retrouver ses réservations et leur statut

**Côté prestataire**
- Définir ses horaires de travail pour chaque jour de la semaine

**Côté administrateur**
- Tableau de bord avec les chiffres clés
- Liste de toutes les réservations et de tous les utilisateurs

**Prêt dans l'API, écrans en cours de réalisation**
- Paiement en ligne par carte (Stripe Checkout, confirmé par webhook)
- Vue des réservations du prestataire, avec confirmation et annulation
- Gestion des services et des exceptions d'horaires (congés, jours fériés)
- Choix parmi les créneaux libres calculés par l'API

## Captures

_À ajouter : choix du créneau, paiement, espace prestataire, tableau de bord admin._

## Technique

| Couche | Technologies |
| --- | --- |
| Frontend | Angular 21 (standalone, zoneless), NgRx Signals, Tailwind CSS 4 |
| Backend | NestJS 10 (Fastify), validation Zod, JWT + refresh token, Helmet |
| Base de données | PostgreSQL (Neon) avec Prisma 7 |
| Paiement | Stripe Checkout + webhooks |
| Hébergement | Vercel (frontend), Render (API) |

**Défi traité :** empêcher deux réservations sur le même créneau. Avant chaque réservation,
l'API vérifie qu'aucune réservation en attente ou confirmée ne chevauche le créneau demandé
chez ce prestataire.

**Paiement fiable (API) :** la réservation n'est marquée payée et confirmée qu'à réception du
webhook signé de Stripe, pas sur simple retour du navigateur.

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
