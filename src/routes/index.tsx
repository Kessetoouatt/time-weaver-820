import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  LayoutGrid,
  Moon,
  ShieldCheck,
  Sun,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EDT Genius — Générateur d'emplois du temps scolaires" },
      {
        name: "description",
        content:
          "Générez en un clic des emplois du temps complets pour toutes vos classes : zéro chevauchement enseignant, classe ou salle. Édition en glisser-déposer et export PDF.",
      },
      { property: "og:title", content: "EDT Genius — Emplois du temps scolaires sans conflit" },
      {
        property: "og:description",
        content:
          "Le générateur d'emplois du temps pour écoles, collèges, lycées et universités. Contraintes respectées, conflits impossibles.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Zap,
    title: "Génération en un clic",
    text: "Un moteur de contraintes place chaque heure de cours en respectant les volumes horaires exacts de chaque classe.",
  },
  {
    icon: ShieldCheck,
    title: "Zéro chevauchement",
    text: "Un enseignant, une classe ou une salle ne peuvent jamais être sur deux cours simultanés — la règle est appliquée jusque dans la base de données.",
  },
  {
    icon: Users,
    title: "Enseignants multi-classes",
    text: "Indisponibilités, heures maximum et préférences horaires sont pris en compte, même pour les professeurs partagés entre plusieurs niveaux.",
  },
  {
    icon: LayoutGrid,
    title: "Vues par classe, prof et salle",
    text: "Grilles lisibles colorées par matière, avec légende, mode sombre et affichage tablette.",
  },
  {
    icon: CalendarClock,
    title: "Ajustement glisser-déposer",
    text: "Déplacez un cours : les conflits sont détectés immédiatement et le déplacement est refusé avec une explication claire.",
  },
  {
    icon: Download,
    title: "Export et partage",
    text: "Export PDF et CSV par classe ou par enseignant, plus un lien public en lecture seule pour les élèves et les parents.",
  },
];

const plans = [
  {
    name: "Gratuit",
    price: "0 €",
    desc: "Pour tester sur un petit établissement.",
    items: ["1 établissement", "Jusqu'à 5 classes", "Génération illimitée", "Export CSV"],
  },
  {
    name: "Pro",
    price: "29 €",
    desc: "Pour un collège ou un lycée complet.",
    items: ["Classes illimitées", "Gestion des salles", "Export PDF & lien public", "Historique des versions"],
    highlight: true,
  },
  {
    name: "Établissement",
    price: "Sur devis",
    desc: "Plusieurs sites, plusieurs équipes.",
    items: ["Multi-établissements", "Rôles et permissions", "Accompagnement dédié", "Support prioritaire"],
  },
];

function Landing() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <CalendarClock className="size-4" />
            </span>
            EDT Genius
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#fonctionnalites" className="hover:text-foreground">
              Fonctionnalités
            </a>
            <a href="#methode" className="hover:text-foreground">
              Comment ça marche
            </a>
            <a href="#tarifs" className="hover:text-foreground">
              Tarifs
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Changer de thème">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button asChild>
              <Link to={user ? "/tableau-de-bord" : "/auth"}>
                {user ? "Mon espace" : "Commencer"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-accent)_0%,transparent_70%)] opacity-60" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
            <Badge variant="secondary" className="mb-5">
              École · Collège · Lycée · Université
            </Badge>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              L'emploi du temps de tout l'établissement, généré en un clic
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Saisissez vos enseignants, vos classes et leurs volumes horaires. EDT Genius construit
              une grille complète, sans le moindre chevauchement, et vous laisse l'ajuster à la souris.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Créer mon espace établissement</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#methode">Voir la méthode</a>
              </Button>
            </div>
            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                "Contraintes dures garanties",
                "Conflits expliqués en clair",
                "Export PDF & lien public",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <CheckCircle2 className="size-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold">Tout ce qu'un service de scolarité attend</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            La valeur du produit n'est pas le calendrier : c'est le moteur qui rend le chevauchement
            impossible.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader>
                  <feature.icon className="size-5 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{feature.text}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="methode" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-3xl font-bold">De la saisie à la grille en 5 étapes</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-5">
              {[
                ["Configurer", "Jours de cours, plage horaire, durée des créneaux, pause."],
                ["Enseignants", "Matières, heures max, indisponibilités."],
                ["Classes", "Matières enseignées, heures/semaine, prof assigné."],
                ["Générer", "Le moteur place tous les cours sans conflit."],
                ["Publier", "Ajustez, exportez en PDF, partagez le lien."],
              ].map(([title, text], index) => (
                <li key={title} className="rounded-xl border border-border bg-card p-5">
                  <span className="font-display text-sm text-primary">Étape {index + 1}</span>
                  <h3 className="mt-1 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="tarifs" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold">Tarifs simples</h2>
          <p className="mt-2 text-muted-foreground">Commencez gratuitement, changez de formule quand vos besoins grandissent.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlight ? "border-primary shadow-lg ring-1 ring-primary/30" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {plan.name}
                    {plan.highlight ? <Badge>Populaire</Badge> : null}
                  </CardTitle>
                  <p className="font-display text-3xl font-bold">
                    {plan.price}
                    {plan.price.includes("€") && plan.price !== "0 €" ? (
                      <span className="text-sm font-normal text-muted-foreground"> /mois</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">{plan.desc}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-6 w-full" variant={plan.highlight ? "default" : "outline"}>
                    <Link to="/auth">Commencer</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        EDT Genius — génération d'emplois du temps scolaires sans conflit.
      </footer>
    </div>
  );
}
