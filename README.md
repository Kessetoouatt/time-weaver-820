# Schedule Perfect

Je veux que tu me construises une application SaaS complète appelée **"EDT Genius"** (tu peux proposer un meilleur nom), dont le but est de générer automatiquement des emplois du temps pour des établissements scolaires (école, collège, lycée, université), sans aucun chevauchement horaire pour les enseignants qui interviennent dans plusieurs classes, niveaux ou filières.

 

### 1. Objectif principal

Permettre à un administrateur (directeur d'établissement, responsable pédagogique, ou service de scolarité) de :

1. Saisir facilement les enseignants, leurs matières et leurs disponibilités.

2. Saisir les classes/niveaux/filières et les matières qui y sont enseignées avec leur volume horaire hebdomadaire.

3. Générer en un clic un emploi du temps complet et optimisé, sans conflit, pour toutes les classes et tous les enseignants.

4. Visualiser, modifier manuellement (glisser-déposer) et exporter l'emploi du temps généré.

 

### 2. Modules fonctionnels à développer

 

**A. Gestion des données de base**

- CRUD Enseignants : nom, prénom, matière(s) enseignée(s), volume horaire max/semaine, jours/créneaux d'indisponibilité (congés, autres engagements), établissement rattaché.

- CRUD Matières : nom, coefficient/volume horaire hebdomadaire par niveau, nécessite ou non une salle spécifique (labo, salle info, gymnase).

- CRUD Classes/Niveaux/Filières : nom (ex. Terminale D, L2 Informatique), effectif, liste des matières avec heures/semaine dédiées, enseignant(s) assigné(s) par matière.

- CRUD Salles (optionnel mais recommandé) : capacité, type (salle normale, labo, amphi), disponibilité.

- Configuration de l'établissement : jours de cours (ex. lundi–vendredi ou lundi–samedi), plages horaires (ex. 8h–17h), durée des créneaux (30 min, 1h), pauses fixes.

 

**B. Moteur de génération automatique**

- Algorithme de génération d'emploi du temps qui respecte les contraintes suivantes (contraintes dures, non négociables) :

  - Un même enseignant ne peut jamais être programmé sur deux créneaux qui se chevauchent, même dans deux classes ou niveaux différents.

  - Une même classe ne peut avoir deux matières en même temps.

  - Une même salle ne peut accueillir deux cours en même temps.

  - Respect du volume horaire hebdomadaire exact défini pour chaque matière/classe.

  - Respect des indisponibilités déclarées par les enseignants.

- Contraintes souples (à optimiser si possible, non bloquantes) :

  - Éviter les trous dans l'emploi du temps des enseignants et des classes.

  - Répartir équitablement les matières sur la semaine (éviter 2 fois la même matière le même jour si possible).

  - Respecter les préférences horaires si renseignées (ex. pas de cours après 16h).

- Utilise un algorithme de type **contrainte de satisfaction (CSP)** ou **coloration de graphe / backtracking avec heuristiques**, ou une approche par scoring et recuit simulé si le nombre de contraintes est trop élevé. Implémente cette logique côté backend (Supabase Edge Functions ou service dédié), pas uniquement côté client.

- Si aucune solution complète n'est trouvée (contraintes trop rigides), afficher clairement à l'utilisateur les conflits bloquants (ex. "Le professeur X est sollicité sur 35h alors qu'il est disponible seulement 25h") avec suggestions de correction.

 

**C. Interface de visualisation et d'édition**

- Vue "Emploi du temps par classe" (grille jours x créneaux horaires).

- Vue "Emploi du temps par enseignant" (pour vérifier sa charge et ses trajets entre classes).

- Vue "Emploi du temps par salle".

- Édition manuelle en glisser-déposer (drag & drop) avec détection en temps réel des conflits (surbrillance rouge si chevauchement).

- Historique des versions générées, possibilité de revenir en arrière.

 

**D. Export et partage**

- Export PDF par classe et par enseignant.

- Export Excel/CSV.

- Lien de partage public en lecture seule (ex. page consultable par les élèves/parents sans compte).

- Impression optimisée.

 

**E. Gestion multi-établissement (architecture SaaS)**

- Authentification (email/mot de passe + option Google).

- Chaque établissement a son propre espace (multi-tenant), avec rôles : Admin, Gestionnaire pédagogique, Enseignant (consultation uniquement de son propre planning).

- Page d'accueil marketing claire expliquant la valeur du produit, avec un tableau de tarification (ex. Gratuit limité / Pro / Établissement).

 

### 3. Exigences techniques

- Utilise Supabase comme backend (base de données, authentification, Edge Functions pour le moteur de génération).

- Design moderne, épuré, professionnel, inspiré des outils de gestion scolaire (type Pronote/EDT mais plus intuitif), avec un thème clair et un mode sombre.

- Interface responsive (utilisable sur tablette pour les administrateurs qui ajustent les emplois du temps en réunion).

- Les grilles d'emploi du temps doivent être lisibles, colorées par matière ou par enseignant, avec légende.

- Prévois des messages d'erreur clairs et pédagogiques en cas de données incomplètes (ex. "La classe Terminale S1 n'a pas d'enseignant assigné en Mathématiques").

 

### 4. Parcours utilisateur à prévoir dès la première version (MVP)

1. Inscription / création de l'espace établissement.

2. Configuration initiale (jours, horaires, créneaux).

3. Ajout des enseignants.

4. Ajout des classes et matières avec volumes horaires.

5. Bouton "Générer l'emploi du temps".

6. Visualisation + ajustement manuel.

7. Export PDF.

 

### 5. Ce que je veux que tu évites

- Ne construis pas un simple calendrier statique sans logique de détection de conflit : la génération automatique sans chevauchement est le cœur de la valeur du produit.

- N'utilise pas de données factices figées dans le design : tout doit être piloté par les données saisies par l'utilisateur.

- Ne néglige pas les cas limites : enseignant partagé entre 2 établissements, matière nécessitant une salle spécifique non disponible, classe avec plus d'heures demandées que de créneaux disponibles dans la semaine.

 

Commence par me proposer une structure de base de données (tables et relations) pour ce projet, puis construis d'abord le module de gestion des enseignants/classes/matières, avant de développer le moteur de génération.

 

---

 

Construis-moi un SaaS appelé "EDT Genius" qui génère automatiquement des emplois du temps scolaires sans conflit.

 

Fonctionnalités MVP :

1. CRUD Enseignants (nom, matière(s), heures max/semaine, indisponibilités).

2. CRUD Classes (nom, matières enseignées avec heures/semaine, enseignant assigné par matière).

3. Configuration établissement : jours de cours, horaires, durée des créneaux.

4. Bouton "Générer l'emploi du temps" qui produit automatiquement une grille par classe, en respectant deux règles strictes : un enseignant ne peut jamais être sur deux créneaux qui se chevauchent, et une classe ne peut avoir deux matières en même temps.

5. Vue grille (jours x créneaux) par classe et par enseignant.

6. Édition manuelle par glisser-déposer avec alerte visuelle en cas de conflit.

7. Export PDF.

 

Utilise Supabase pour la base de données et l'authentification. Implémente la logique de génération (détection de conflits, attribution des créneaux) côté backend via une Edge Function, pas seulement côté client. Si un enseignant est en surcharge horaire ou si une classe n'a pas assez de créneaux disponibles, affiche un message d'erreur clair indiquant le blocage précis.

 

Commence par la structure de base de données, puis le CRUD Enseignants/Classes, puis le moteur de génération.

 

---

 

## 2. Schéma de base de données détaillé

 

Pense multi-tenant dès le départ (colonne `school_id` sur presque toutes les tables) pour supporter plusieurs établissements sur le même SaaS.

 

### Table `schools`

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| name | text | Nom de l'établissement |

| type | text | école / collège / lycée / université |

| days_of_week | text[] | ex. ['lundi','mardi',...,'samedi'] |

| day_start_time | time | ex. 08:00 |

| day_end_time | time | ex. 17:00 |

| slot_duration_minutes | int | ex. 60 |

| created_at | timestamptz | |

 

### Table `users`

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | lié à auth Supabase |

| school_id | uuid (FK → schools) | |

| role | text | admin / gestionnaire / enseignant |

| full_name | text | |

| email | text | |

 

### Table `teachers`

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| school_id | uuid (FK) | |

| full_name | text | |

| max_hours_week | int | volume horaire max |

| user_id | uuid (FK → users, nullable) | si l'enseignant a un compte |

 

### Table `teacher_unavailabilities`

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| teacher_id | uuid (FK → teachers) | |

| day_of_week | text | |

| start_time | time | |

| end_time | time | |

 

### Table `subjects`

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| school_id | uuid (FK) | |

| name | text | ex. Mathématiques |

| requires_special_room | boolean | ex. labo, salle info |

 

### Table `teacher_subjects` (relation N-N)

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| teacher_id | uuid (FK) | |

| subject_id | uuid (FK) | |

 

### Table `classes` (ou `class_groups`)

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| school_id | uuid (FK) | |

| name | text | ex. Terminale D, L2 Info |

| level | text | niveau/filière |

| headcount | int | effectif |

 

### Table `class_subjects` (matières + volume horaire + enseignant assigné par classe)

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| class_id | uuid (FK → classes) | |

| subject_id | uuid (FK → subjects) | |

| teacher_id | uuid (FK → teachers) | |

| hours_per_week | int | volume horaire hebdo pour cette classe |

 

### Table `rooms`

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| school_id | uuid (FK) | |

| name | text | |

| capacity | int | |

| room_type | text | normale / labo / info / gymnase |

 

### Table `timetable_versions`

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| school_id | uuid (FK) | |

| generated_at | timestamptz | |

| status | text | brouillon / validé / archivé |

| label | text | ex. "Semestre 1 - v3" |

 

### Table `timetable_entries` (le cœur : chaque créneau posé)

| Champ | Type | Description |

|---|---|---|

| id | uuid (PK) | |

| timetable_version_id | uuid (FK) | |

| class_id | uuid (FK) | |

| subject_id | uuid (FK) | |

| teacher_id | uuid (FK) | |

| room_id | uuid (FK, nullable) | |

| day_of_week | text | |

| start_time | time | |

| end_time | time | |

 

**Contraintes d'intégrité à poser en base (en plus de la logique applicative) :**

- Contrainte unique/exclusion sur `(teacher_id, day_of_week, start_time, end_time)` au sein d'une même `timetable_version_id` → empêche un enseignant d'avoir deux créneaux qui se chevauchent.

- Idem sur `(class_id, day_of_week, start_time, end_time)`.

- Idem sur `(room_id, day_of_week, start_time, end_time)` si les salles sont gérées.

 

En PostgreSQL, cela peut se faire avec une contrainte `EXCLUDE` utilisant `tstzrange` sur les horaires plutôt qu'une simple `UNIQUE`, ce qui permet de détecter tout chevauchement partiel (pas seulement une égalité stricte de créneau).

 

### Relations résumées

```

schools 1---N teachers

schools 1---N classes

schools 1---N subjects

schools 1---N rooms

teachers N---N subjects (via teacher_subjects)

classes 1---N class_subjects N---1 subjects

class_subjects N---1 teachers

timetable_versions 1---N timetable_entries

timetable_entries N---1 classes / subjects / teachers / rooms

```

 

---

 

*"Utilise exactement ce schéma de base de données pour démarrer le projet."*

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://time-weaver-820.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5d189407-bc4c-4311-9d2e-b25bfbe741f2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
