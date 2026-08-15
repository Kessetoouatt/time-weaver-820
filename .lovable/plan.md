# EDT Genius — SaaS de génération d'emplois du temps

Objectif : un espace par établissement, saisie des enseignants/classes/matières, puis génération automatique d'une grille hebdomadaire sans aucun chevauchement (enseignant, classe, salle).

## Livraison en 3 étapes

### Étape 1 — Fondations et données de base
- Activation de Lovable Cloud (base de données + authentification email/mot de passe, Google en option ensuite).
- Création du schéma complet (voir section technique) avec sécurité par établissement : chaque utilisateur ne voit que les données de son établissement.
- Inscription → création de l'espace établissement → configuration initiale (jours de cours, heure de début/fin, durée des créneaux, pauses).
- CRUD Enseignants (nom, matières, heures max/semaine, indisponibilités par jour et plage horaire).
- CRUD Matières, Classes, Salles.
- Affectation par classe : matière + enseignant + heures/semaine.
- Tableau de bord listant l'état de complétude des données (matières sans enseignant, heures manquantes).

### Étape 2 — Moteur de génération
- Bouton « Générer l'emploi du temps » qui exécute la génération **côté serveur**.
- Pré-contrôle de faisabilité avant génération, avec messages précis :
  - « M. Diallo est sollicité 35h alors qu'il est disponible 25h »
  - « Terminale D demande 34h pour 30 créneaux disponibles »
  - « Mathématiques en Terminale S1 n'a pas d'enseignant assigné »
  - « Physique nécessite un labo : aucune salle de ce type disponible »
- Algorithme : backtracking CSP avec heuristiques (variable la plus contrainte d'abord, créneau le moins contraignant), plus une passe d'amélioration par scoring pour les contraintes souples (moins de trous, répartition des matières sur la semaine, préférences horaires).
- Contraintes dures garanties : jamais deux cours simultanés pour un même enseignant, une même classe ou une même salle ; volume horaire hebdomadaire exact respecté ; indisponibilités respectées.
- Chaque génération crée une nouvelle version conservée dans l'historique (brouillon / validée / archivée) avec retour arrière possible.

### Étape 3 — Visualisation, édition, export
- Grilles jours × créneaux : vue par classe, par enseignant, par salle, colorées par matière avec légende.
- Édition manuelle en glisser-déposer, détection de conflit en temps réel (case en rouge + explication du conflit), annulation possible.
- Export PDF par classe et par enseignant, export CSV/Excel, impression optimisée.
- Lien public en lecture seule pour élèves et parents.
- Rôles : Admin, Gestionnaire pédagogique, Enseignant (consultation de son seul planning).
- Page d'accueil marketing avec proposition de valeur et grille tarifaire (Gratuit / Pro / Établissement) — présentation seule, sans paiement en ligne à ce stade.

## Design
Thème clair et sombre, style outil de gestion scolaire moderne : dense mais lisible, typographie sobre, accent bleu profond, grilles à forte lisibilité, entièrement responsive et utilisable sur tablette.

## Détails techniques
- Tables : `schools`, `profiles`, `user_roles`, `teachers`, `teacher_unavailabilities`, `subjects`, `teacher_subjects`, `classes`, `class_subjects`, `rooms`, `timetable_versions`, `timetable_entries` — conformes au schéma fourni. `school_id` sur toutes les tables métier.
- Les rôles sont stockés dans une table `user_roles` séparée (jamais sur le profil) pour éviter toute élévation de privilèges.
- Contraintes d'intégrité en base : contraintes `EXCLUDE` avec `btree_gist` sur les plages horaires (`daterange`/`timerange` par jour) pour `teacher_id`, `class_id` et `room_id` au sein d'une même version — tout chevauchement partiel est rejeté par la base, pas seulement par l'application.
- Politiques RLS scopées à l'établissement de l'utilisateur via une fonction `security definer`, plus une politique de lecture anonyme restreinte aux versions publiées par lien public.
- Le moteur tourne dans une fonction serveur (TanStack server function, exécutée côté serveur — équivalent d'une Edge Function dans cette stack), pas dans le navigateur.
- Aucune donnée fictive figée : tout provient des saisies utilisateur.
