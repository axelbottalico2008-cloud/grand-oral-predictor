# Grand Oral Predictor 🎓

Outil communautaire d'estimation probabiliste pour le Grand Oral du Bac.  
Les élèves partagent anonymement leur profil (spécialités, commission, lycée, horaire)  
et reçoivent une estimation de la spécialité sur laquelle ils seront probablement interrogés.

> ⚠️ **Aucune valeur officielle.** Outil statistique indicatif uniquement.

---

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Supabase** (PostgreSQL + API auto-générée)
- **Déploiement** : Vercel

---

## Installation locale

```bash
# 1. Clone le projet
git clone https://github.com/ton-pseudo/grand-oral-predictor.git
cd grand-oral-predictor

# 2. Installe les dépendances
npm install

# 3. Configure les variables d'environnement
cp .env.example .env.local
# Édite .env.local avec tes clés Supabase

# 4. Lance le serveur de dev
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

---

## Configuration Supabase

### 1. Créer un projet Supabase
→ [https://supabase.com/dashboard](https://supabase.com/dashboard)

### 2. Créer la table `entries`
Dans **SQL Editor**, colle et exécute le contenu de :
```
supabase/migrations/001_create_entries.sql
```

### 3. Récupérer les clés
Dans **Project Settings → API** :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Colle-les dans `.env.local`.

---

## Déploiement Vercel

```bash
# Si Vercel CLI installé
vercel deploy

# Sinon : importe le repo GitHub depuis vercel.com
```

Ajoute les variables d'environnement dans **Vercel → Settings → Environment Variables** :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Algorithme de scoring

Pour chaque entrée existante, un score de similarité est calculé :

| Critère                    | Points |
|----------------------------|--------|
| Même commission            | +50    |
| Même heure de passage      | +25    |
| Même lycée                 | +20    |
| Spécialité commune         | +40    |

Les scores sont agrégés par spécialité et convertis en pourcentages.

→ Voir `lib/scoring.ts` pour l'implémentation complète.

---

## Structure du projet

```
grand-oral-predictor/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout + fonts
│   ├── globals.css           # Styles globaux + Tailwind
│   ├── not-found.tsx         # Page 404
│   ├── form/
│   │   └── page.tsx          # Formulaire de saisie
│   ├── result/[id]/
│   │   └── page.tsx          # Page résultat (SSR)
│   └── api/
│       ├── submit/
│       │   └── route.ts      # POST : enregistrement + calcul
│       └── result/[id]/
│           └── route.ts      # GET : résultat JSON
├── components/
│   └── ShareButton.tsx       # Bouton de partage
├── lib/
│   ├── supabase.ts           # Client Supabase
│   └── scoring.ts            # Algorithme de prédiction
├── supabase/
│   └── migrations/
│       └── 001_create_entries.sql
├── .env.example
└── README.md
```

---

## Confidentialité

- Aucun nom, prénom ou identifiant personnel collecté
- Aucun système de compte ou d'authentification
- Données anonymes uniquement
- Pas de cookies tiers
