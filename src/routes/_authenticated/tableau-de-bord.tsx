import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Users, BookOpen, GraduationCap, DoorOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useClassSubjects,
  useClasses,
  useProfile,
  useRooms,
  useSchool,
  useSubjects,
  useTeachers,
} from "@/hooks/useSchoolData";
import { buildSlots } from "@/lib/timetable";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — EDT Genius" },
      { name: "description", content: "État de complétude de vos données et accès rapide à la génération." },
      { property: "og:title", content: "Tableau de bord — EDT Genius" },
      { property: "og:description", content: "Suivez la complétude de vos données avant génération." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: school } = useSchool();
  const { data: teachers = [] } = useTeachers();
  const { data: subjects = [] } = useSubjects();
  const { data: classes = [] } = useClasses();
  const { data: rooms = [] } = useRooms();
  const { data: classSubjects = [] } = useClassSubjects();

  if (!profile?.school_id) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Bienvenue sur EDT Genius</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Créez d'abord l'espace de votre établissement : jours de cours, horaires et durée des créneaux.</p>
          <Button asChild>
            <Link to="/parametres">Configurer mon établissement</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const slots = school ? buildSlots(school) : [];
  const weeklyCells = slots.length * (school?.days_of_week.length ?? 0);
  const slotHours = (school?.slot_duration_minutes ?? 60) / 60;

  const issues: string[] = [];
  for (const cs of classSubjects) {
    if (!cs.teacher_id) {
      const className = classes.find((c) => c.id === cs.class_id)?.name ?? "?";
      const subjectName = subjects.find((s) => s.id === cs.subject_id)?.name ?? "?";
      issues.push(`La classe ${className} n'a pas d'enseignant assigné en ${subjectName}.`);
    }
  }
  for (const cls of classes) {
    const needed = classSubjects
      .filter((cs) => cs.class_id === cls.id)
      .reduce((sum, cs) => sum + Math.ceil(cs.hours_per_week / slotHours), 0);
    if (needed === 0) issues.push(`La classe ${cls.name} n'a aucune matière affectée.`);
    else if (needed > weeklyCells)
      issues.push(`La classe ${cls.name} demande ${needed} créneaux pour ${weeklyCells} disponibles.`);
  }
  for (const teacher of teachers) {
    const load = classSubjects
      .filter((cs) => cs.teacher_id === teacher.id)
      .reduce((sum, cs) => sum + cs.hours_per_week, 0);
    if (load > teacher.max_hours_week)
      issues.push(
        `${teacher.full_name} est sollicité·e sur ${load}h alors que son maximum est de ${teacher.max_hours_week}h.`,
      );
  }

  const stats = [
    { label: "Enseignants", value: teachers.length, icon: Users, to: "/enseignants" as const },
    { label: "Matières", value: subjects.length, icon: BookOpen, to: "/matieres" as const },
    { label: "Classes", value: classes.length, icon: GraduationCap, to: "/classes" as const },
    { label: "Salles", value: rooms.length, icon: DoorOpen, to: "/salles" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            {weeklyCells} créneaux disponibles par semaine ({slots.length} par jour).
          </p>
        </div>
        <Button asChild>
          <Link to="/emploi-du-temps">Générer l'emploi du temps</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card className="transition-colors hover:border-primary">
              <CardContent className="flex items-center gap-4 pt-6">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary">
                  <stat.icon className="size-5 text-primary" />
                </span>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {issues.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>{issues.length} point(s) à corriger avant génération</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {issues.slice(0, 12).map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Vos données sont prêtes</AlertTitle>
          <AlertDescription>
            Aucun blocage détecté : vous pouvez lancer la génération de l'emploi du temps.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
