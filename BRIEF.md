# EDT Genius — Brief complet de reprise (pour Claude Code)

> Document de passation. Il décrit **ce qui existe déjà**, **comment c'est construit**,
> **les règles à ne pas casser** et **ce qui reste à faire**.

---

## 1. Le produit

SaaS multi-établissement (français) de **génération automatique d'emplois du temps**
scolaires/universitaires, garantissant **zéro chevauchement** enseignant / classe / salle.

Utilisateurs : administrateurs et gestionnaires pédagogiques d'un établissement ; les
enseignants consultent leur propre planning. Toute l'UI est en français.

Parcours principal :
inscription → création de l'établissement → configuration (jours, horaires, créneaux,
pauses) → saisie Enseignants / Matières / Classes / Salles → affectation
(classe × matière × enseignant × volume horaire hebdo) → **génération** → grille,
édition glisser-déposer, export PDF, lien public en lecture seule.

---

## 2. Stack technique

| Élément | Choix |
| --- | --- |
| Framework | **TanStack Start v1** (React 19, SSR, Vite 7) — **pas** Next.js, **pas** react-router-dom |
| Routing | fichiers dans `src/routes`, `routeTree.gen.ts` **auto-généré (ne pas éditer)** |
| Données | **Supabase** (Lovable Cloud) — Postgres + Auth + Storage |
| Backend logique | **`createServerFn`** de `@tanstack/react-start` (pas d'Edge Function Deno) |
| État serveur | TanStack Query v5 |
| UI | Tailwind CSS v4 (via `src/styles.css`, pas de `tailwind.config.js`) + shadcn/ui + lucide-react |
| Notifications | `sonner` (`<Toaster />` monté dans `__root.tsx`) |
| Validation | zod |

Commandes : `bun dev` (port 8080), `bun run build`, `bun run lint`.

Variables d'env : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID` côté client ; `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` côté serveur uniquement
(à lire **dans** le handler, jamais au niveau module).

---

## 3. Arborescence utile

```
src/
  routes/
    __root.tsx                  shell HTML, head/SEO, QueryClientProvider, AuthProvider, Toaster
    index.tsx                   landing marketing (public)
    auth.tsx                    connexion / inscription (email + Google)
    _authenticated/
      route.tsx                 garde d'auth (ssr:false, redirect /auth) + <AppShell>
      tableau-de-bord.tsx       complétude des données + pré-contrôle de faisabilité
      enseignants.tsx           CRUD + matières enseignées + indisponibilités
      matieres.tsx              CRUD + préremplissage 12 matières + couleur auto
      classes.tsx               CRUD + programme (matière/enseignant/heures) + génération immédiate + aperçu grille
      salles.tsx                CRUD salles (type, capacité)
      parametres.tsx            établissement : jours, horaires, créneaux, pauses multiples, logo, références
      emploi-du-temps.tsx       grille par classe / enseignant, drag & drop, conflits, export PDF
  components/app/AppShell.tsx   sidebar + header + thème clair/sombre
  components/app/CrudHelpers.tsx composants partagés de formulaires/tables
  components/ui/*               shadcn
  hooks/
    useAuth.tsx                 session Supabase (contexte)
    useSchoolData.ts            tous les hooks de lecture (profil, école, listes, entries)
    useSchoolLogo.ts            URL signée du logo (bucket privé)
    useTheme.tsx                thème clair/sombre
  lib/
    scheduler.ts                MOTEUR (pur, testable, sans I/O)
    timetable.ts                créneaux, pauses, temps, palette de couleurs
    timetable.functions.ts      server functions : génération, déplacement, lien public
  integrations/supabase/*       AUTO-GÉNÉRÉ — ne jamais éditer
supabase/migrations/*.sql       historique du schéma
```

---

## 4. Modèle de données (schéma `public`)

- `schools` — nom, type, `days_of_week text[]`, `day_start_time`, `day_end_time`,
  `slot_duration_minutes`, `lunch_enabled/lunch_start_time/lunch_end_time`,
  + identité : `logo_url`, `address`, `phone`, `email`, `website`, `reference_code`, `head_name`.
- `school_breaks` — pauses **multiples** (récréations, déjeuner) : `label`, `start_time`, `end_time`.
- `profiles` — `id` = `auth.users.id`, `school_id`, `full_name`, `email`.
- `user_roles` — enum `app_role` = `admin | gestionnaire | enseignant`. **Les rôles ne sont
  jamais stockés sur `profiles`** (anti-élévation de privilèges).
- `teachers` — `full_name`, `email`, `max_hours_week`, `latest_end_time`, `user_id?`.
- `teacher_subjects` — matières enseignables par un enseignant.
- `teacher_unavailabilities` — `day_of_week`, `start_time`, `end_time`, `reason`.
- `subjects` — `name`, `color`, `color_index`, `requires_special_room`, `required_room_type`.
- `classes` — `name`, `level`, `headcount`.
- `class_subjects` — **le programme** : `class_id` × `subject_id` × `teacher_id?` × `hours_per_week`.
- `rooms` — `name`, `capacity`, `room_type`.
- `timetable_versions` — `label`, `status` (brouillon/validée/archivée), `is_public`,
  `public_token uuid`, `generated_at`, `success`, `unplaced_count`.
- `timetable_entries` — `timetable_version_id`, `class_id`, `subject_id`, `teacher_id?`,
  `room_id?`, `day_of_week`, `start_time`, `end_time`.

### Sécurité (à respecter absolument)
- RLS activé partout, scopé par `school_id = current_school_id()` (fonction SECURITY DEFINER).
- Écriture conditionnée par `can_manage()` (admin ou gestionnaire).
- **Aucun accès `anon`** sur les tables métier. Le partage public passe **uniquement** par la
  server function `getPublicTimetableFn` (service role côté serveur, colonnes non sensibles).
- Création d'établissement **uniquement** via la fonction `create_school_and_join(...)`
  (transactionnelle : école + profil + rôle admin + `seed_default_subjects`). `INSERT` direct
  sur `schools` est révoqué.
- Toute nouvelle table `public` doit inclure, dans **la même migration** :
  `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY`.
- Contraintes `EXCLUDE` (btree_gist) empêchent les chevauchements en base pour
  `teacher_id`, `class_id`, `room_id` au sein d'une même version.

---

## 5. Le moteur de génération (`src/lib/scheduler.ts`)

Pur TypeScript, sans I/O — c'est le cœur du produit.

**Entrées** (`GenInput`) : configuration école, jours, enseignants, matières, classes, salles,
`class_subjects`, indisponibilités.

**Étapes**
1. `buildSlots(school)` (dans `timetable.ts`) construit les créneaux du jour à partir de
   `day_start_time`, `day_end_time`, `slot_duration_minutes`, en **retirant toutes les pauses**
   (`effectiveBreaks` = pause déjeuner historique + `school_breaks`).
2. `slotsNeeded(hoursPerWeek, slotHours)` = `Math.max(1, Math.round(h / slotHours))`.
   ⚠️ **Ne jamais remettre `Math.ceil`** : c'était le bug « une heure en trop »
   (8h de philo devenaient 9h quand la durée de créneau ≠ 60 min).
3. Découpage en **blocs** : priorité aux blocs de **2 créneaux consécutifs**, puis un bloc de 1
   pour le reste impair. Ex. 5h → 2h + 2h + 1h ; 4h → 2h + 2h.
4. Placement glouton **multi-essais (200 tentatives)**, heuristique MRV (enseignants/matières
   les plus contraints d'abord), choix aléatoire parmi les créneaux valides ; on conserve la
   meilleure solution (moins de cours non placés).
5. Contraintes **dures** garanties par construction : jamais deux cours simultanés pour un même
   enseignant / une même classe / une même salle ; indisponibilités respectées ; un bloc de 2h
   n'est placé que sur des créneaux réellement contigus (`slots[s+k-1].end === slots[s+k].start`,
   donc jamais à cheval sur une pause).
6. Préférences **souples** (scoring) : éviter deux fois la même matière le même jour pour une
   classe, étaler les blocs sur la semaine, limiter les trous.
7. `max_hours_week` est traité comme **avertissement**, pas comme blocage.

**Sorties** (`GenResult`) : `entries[]`, `unplaced[]` (classe, matière, enseignant, heures),
`success`, `unplaced_count`.

`checkFeasibility(input)` fait le **pré-contrôle** avant génération et renvoie des messages
explicites (« Mathématiques en Terminale S1 n'a pas d'enseignant assigné », « Terminale D
demande 34h pour 30 créneaux disponibles », etc.). Il est réutilisé par le tableau de bord —
garder les deux calculs synchronisés.

---

## 6. Server functions (`src/lib/timetable.functions.ts`)

- `generateTimetableFn({ label? })` — lit toutes les données de l'établissement, appelle
  `generateTimetable`, crée une nouvelle `timetable_versions` + insère les `timetable_entries`,
  renvoie les non placés.
- `moveEntryFn({...})` — déplacement d'un cours (drag & drop) avec revalidation des conflits.
- `getPublicTimetableFn({ token })` — lecture publique d'une version partagée.

Règles : ces fichiers sont des **wrappers fins** (imports, types, déclarations exportées
uniquement) ; toute logique vit dans `scheduler.ts` / modules importés. Les fonctions protégées
utilisent `requireSupabaseAuth` ; le bearer est attaché côté client par le `functionMiddleware`
enregistré dans `src/start.ts`. **Ne jamais appeler une server function protégée depuis le
loader d'une route publique** (le prérendu n'a pas de session → 401 au build).

---

## 7. Design

Thème sombre par défaut (classe `dark` sur `<html>`), esprit **tableau d'affichage de gare /
aéroport** : accent **ambre**, police monospace (JetBrains Mono) pour les horaires,
Sora (titres) + Manrope (texte). Une couleur distincte par matière (palette
`SUBJECT_PALETTE` dans `timetable.ts`, attribuée automatiquement via `color_index`).
Grilles denses mais lisibles, responsive jusqu'à la tablette, styles d'impression (`no-print`).

**Règle** : uniquement des tokens sémantiques Tailwind/shadcn (`bg-background`, `text-foreground`,
`bg-primary`…). Pas de `text-white`, `bg-black`, ni de couleurs en dur dans les composants.

---

## 8. État actuel — fait ✅

- Auth email/mot de passe + Google, confirmation par email **activée** (le compte reste inactif
  tant que le lien n'est pas cliqué).
- Onboarding établissement transactionnel + 12 matières préenregistrées avec couleurs
  (maths, physique-chimie, anglais, français, philosophie, histoire-géo, EPS, espagnol,
  allemand, musique, arts plastiques, SVT).
- CRUD complet : enseignants (+ matières + indisponibilités), matières, classes (+ programme),
  salles.
- Paramètres : jours, horaires, durée de créneau, **pauses multiples**, logo (bucket privé
  `school-logos` + URL signée) et références de l'établissement.
- Moteur de génération par blocs de 2h, volume horaire exact, 200 tentatives.
- Génération **immédiate** depuis la page Classes (bouton + régénération auto à chaque
  modification du programme) avec aperçu de grille.
- Vues grille par classe et par enseignant, drag & drop avec détection de conflit en rouge,
  export PDF, lien public en lecture seule.
- Versioning des emplois du temps (brouillon / validée / archivée).
- Audit sécurité passé : lecture profils limitée au propriétaire, suppression des politiques
  publiques et des privilèges `anon`, `search_path` fixé sur les fonctions SECURITY DEFINER,
  révocation de l'`INSERT` direct sur `schools`.

## 9. Ce qui reste à faire 🔜

1. **Page d'inscription** : afficher « Vérifiez votre boîte mail » au lieu de rediriger vers le
   tableau de bord (la confirmation email est active).
2. **Domaine d'envoi** des emails à configurer (délivrabilité, emails brandés).
3. Rôle **enseignant** : vue restreinte à son seul planning (routes + policies à finaliser).
4. **Tests** du moteur (vitest) : non-chevauchement, volume horaire exact, blocs de 2h,
   respect des pauses et des indisponibilités. Aucun test automatisé n'existe aujourd'hui.
5. Salles : l'affectation automatique reste basique (types de salle requis peu exploités).
6. Export CSV/Excel et impression optimisée par enseignant.
7. Optimisation soft-constraints (trous, équilibrage matin/après-midi) : le scoring est simple.
8. Page tarifaire présente en landing mais **sans paiement** en ligne.

## 10. Pièges connus (à ne pas réintroduire)

- `Math.ceil` sur le nombre de créneaux → heure fantôme.
- Éditer `src/routeTree.gen.ts` ou `src/integrations/supabase/*` (auto-générés).
- Créer une Supabase Edge Function : dans cette stack, tout passe par `createServerFn`
  (ou une route `src/routes/api/public/*` pour les webhooks externes).
- Garde d'auth sur une route SSR de premier niveau → boucle de redirection ; les pages
  protégées vont sous `_authenticated/`.
- Oublier les `GRANT` dans une migration créant une table → erreur de permission à l'exécution.
- Lire `process.env` au niveau module d'un fichier partagé.

---

## 11. Démarrage rapide pour Claude Code

```bash
bun install
bun dev            # http://localhost:8080
```
Lire dans cet ordre : `src/lib/scheduler.ts` → `src/lib/timetable.ts` →
`src/lib/timetable.functions.ts` → `src/hooks/useSchoolData.ts` →
`src/routes/_authenticated/emploi-du-temps.tsx`.
L'historique complet du schéma est dans `supabase/migrations/`.
