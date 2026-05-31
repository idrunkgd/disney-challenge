# 🏰 Dasolabs Disney Challenge

Application web **mobile-first / PWA** pour le Team Building Dasolabs à Disneyland Paris.
Familles, missions photo, quiz, blind test, votes, classement temps réel, Disney Awards et livre souvenir.

**Stack** : Next.js 15 (App Router) · React · TypeScript · Tailwind CSS · Supabase (Postgres + Storage + Realtime) · déploiement Vercel.

---

## ✨ Fonctionnalités

- Connexion **sans mot de passe** par QR code (auth anonyme par famille).
- **Missions** photo / attraction / exploration avec upload et validation admin.
- **Quiz Disney** : 50 questions, tirage de 20, timer, scoring automatique.
- **Blind Test** : extraits audio uploadés par l'admin.
- **Missions secrètes** (bonus +50), visibles seulement par la famille concernée.
- **Défi créativité** : invente ton attraction (nom / description / slogan).
- **Votes anonymes** : photo la plus drôle, meilleure attraction, esprit d'équipe.
- **Classement temps réel** (Supabase Realtime) avec podium 🥇🥈🥉.
- **Disney Awards** : écran cérémonie animé, révélation pilotée par l'admin.
- **Galerie souvenir** filtrable + téléchargement.
- **Gamification** : badges et progression.
- **Export souvenir** PDF (classement + photos + stats + palmarès).
- **Interface admin** complète (validation, familles, QR, missions, quiz, blind test, awards, export).

---

## 🚀 1. Installation locale

### Prérequis
- Node.js 18.18+ (recommandé 20+)
- Un projet Supabase (gratuit) : https://supabase.com

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement
cp .env.local.example .env.local
# puis renseigner les valeurs (voir section Supabase ci-dessous)

# 3. Lancer en développement
npm run dev
# → http://localhost:3000
```

L'app participant est sur `/`, l'interface d'organisation sur `/admin`.

---

## 🗄️ 2. Configuration Supabase

1. Créez un projet sur https://supabase.com.
2. Dans **SQL Editor**, exécutez dans l'ordre :
   1. `supabase/schema.sql` (tables, vues, fonctions RPC, Realtime)
   2. `supabase/policies.sql` (RLS + création des buckets `photos` et `audio`)
   3. `supabase/seed.sql` (missions, badges, 50 questions, 2 familles de démo)
3. Dans **Project Settings → API**, récupérez :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secret, serveur uniquement)
4. Vérifiez dans **Storage** que les buckets `photos` et `audio` existent et sont **publics**
   (créés automatiquement par `policies.sql`).
5. Renseignez `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=choisissez_un_mot_de_passe
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Démo rapide** : connectez-vous avec le code `demo-mickey-token` ou `demo-stitch-token`.

---

## 📱 3. Déroulé le jour J

1. **Admin → Familles** : créez vos familles (nom, avatar, couleur).
2. **Admin → QR Codes** : imprimez les QR (un par famille) et distribuez-les.
3. Chaque participant ouvre l'app, **scanne son QR** → connecté à sa famille.
4. **Admin → Missions secrètes** : « Attribuer » lance le tirage au sort.
5. **Admin → Blind Test** : uploadez les extraits audio (mp3/m4a).
6. Pendant la journée : **Admin → Validation** pour accepter/refuser les photos en direct.
7. Le soir : **Admin → Awards** désignez les gagnants et « Révélez » sur l'écran `/awards`.
8. Fin : **Admin → Export** génère le **livre souvenir PDF**.

---

## ☁️ 4. Déploiement Vercel

1. Poussez le projet sur GitHub.
2. Sur https://vercel.com → **New Project** → importez le dépôt.
3. Dans **Settings → Environment Variables**, ajoutez :
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`,
   et `NEXT_PUBLIC_APP_URL` = l'URL de production (ex : `https://disney.dasolabs.com`).
4. **Deploy**. Vercel build automatiquement (`next build`).
5. Mettez à jour `NEXT_PUBLIC_APP_URL` avec l'URL finale, puis **redéployez**
   (pour que les QR codes pointent vers la bonne adresse).

### PWA
L'app est installable : sur mobile, « Ajouter à l'écran d'accueil ». Le service worker
(`public/sw.js`) gère un cache app-shell pour rester utilisable en réseau faible dans le parc.

---

## 🧩 5. Architecture

```
src/
├── app/                    # App Router (pages + API routes)
│   ├── page.tsx            # Accueil participant
│   ├── login/              # Connexion QR
│   ├── missions/           # Liste + détail/upload
│   ├── quiz/ blindtest/    # Jeux
│   ├── secret/ creativity/ # Missions secrètes & défi
│   ├── vote/ leaderboard/  # Votes & classement temps réel
│   ├── gallery/ awards/ badges/
│   ├── admin/              # Interface organisateur (protégée)
│   └── api/                # API routes (upload, admin/*)
├── components/             # AppShell, BottomNav, PhotoUpload, AdminGate…
├── hooks/                  # useSession, useLeaderboard
└── lib/                    # types, clients Supabase, session, admin-auth
supabase/                   # schema.sql · policies.sql · seed.sql
public/                     # manifest PWA, service worker, icônes
```

### Modèle de données (Supabase)
`families · users · missions · mission_submissions · photos · quiz_questions · quiz_answers ·
blind_tracks · blind_answers · secret_missions · creative_attractions · votes · awards ·
badges · family_badges` + vue `family_scores` (classement agrégé) et RPC
`login_with_token`, `review_submission`, `answer_quiz`, `answer_blind`.

### Sécurité
- Lecture publique (clé anon) sur le contenu de jeu, RLS activée partout.
- Écritures sensibles (validation, scoring, gestion) via **API routes** avec la clé
  `service_role` + cookie admin, ou via **RPC `security definer`**.
- Connexion participant anonyme : jeton de famille → utilisateur rattaché à l'appareil.

---

## 🛠️ Scripts

```bash
npm run dev        # développement
npm run build      # build production
npm run start      # serveur production
npm run typecheck  # vérification TypeScript
npm run lint       # ESLint
```

---

Fait avec ✨ pour **Dasolabs**.
