import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCrud } from "@/components/app/CrudHelpers";
import {
  useClassSubjects,
  useClasses,
  useEntries,
  useProfile,
  useSchool,
  useSubjects,
  useTeachers,
  useVersions,
} from "@/hooks/useSchoolData";
import { buildSlots, shortTime } from "@/lib/timetable";
import { generateTimetableFn } from "@/lib/timetable.functions";

export const Route = createFileRoute("/_authenticated/classes")({
  head: () => ({
    meta: [
      { title: "Classes — EDT Genius" },
      { name: "description", content: "Créez vos classes et affectez matières, enseignants et volumes horaires hebdomadaires." },
      { property: "og:title", content: "Classes — EDT Genius" },
      { property: "og:description", content: "Classes, matières et volumes horaires." },
    ],
  }),
  component: ClassesPage,
});

function ClassesPage() {
  const { data: profile } = useProfile();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();
  const { data: classSubjects = [] } = useClassSubjects();
  const classCrud = useCrud("classes");
  const csCrud = useCrud("class_subjects");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", level: "", headcount: 30 });
  const [selected, setSelected] = useState<string | null>(null);
  const [assign, setAssign] = useState({ subject_id: "", teacher_id: "", hours_per_week: 2 });

  const activeClass = classes.find((c) => c.id === selected) ?? classes[0] ?? null;

  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { data: versions = [] } = useVersions();
  const latestVersion = [...versions].sort((a, b) => b.generated_at.localeCompare(a.generated_at))[0] ?? null;
  const { data: entries = [] } = useEntries(latestVersion?.id ?? null);
  const generate = useServerFn(generateTimetableFn);
  const [generating, setGenerating] = useState(false);

  const slots = school ? buildSlots(school) : [];
  const days = school?.days_of_week ?? [];
  const classEntries = entries.filter((e) => e.class_id === activeClass?.id);

  /** Régénère immédiatement l'emploi du temps dès qu'un programme de classe change. */
  const regenerate = async (silent = false) => {
    setGenerating(true);
    try {
      const result = await generate({ data: { label: `Auto ${new Date().toLocaleString("fr-FR")}` } });
      if (result.ok) {
        if (!silent) toast.success("Emploi du temps régénéré.");
      } else if (result.versionId) {
        toast.warning(`Emploi du temps partiel : ${result.unplaced.length} cours non placés.`);
      } else if (!silent) {
        toast.error(result.errors[0] ?? "Génération impossible pour l'instant.");
      }
      await queryClient.invalidateQueries();
    } catch (error) {
      if (!silent) toast.error(error instanceof Error ? error.message : "Génération impossible.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-sm text-muted-foreground">Effectifs et programme hebdomadaire.</p>
        </div>
        <div className="flex items-center gap-2">
        <Button variant="outline" disabled={generating || classes.length === 0} onClick={() => regenerate()}>
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Générer maintenant
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle classe</DialogTitle></DialogHeader>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const ok = await classCrud.create({
                  name: form.name,
                  level: form.level || null,
                  headcount: Number(form.headcount),
                  school_id: profile!.school_id,
                });
                if (ok) { setOpen(false); setForm({ name: "", level: "", headcount: 30 }); }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="cname">Nom</Label>
                <Input id="cname" required placeholder="2nde A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clevel">Niveau</Label>
                  <Input id="clevel" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chead">Effectif</Label>
                  <Input id="chead" type="number" min={1} value={form.headcount} onChange={(e) => setForm({ ...form, headcount: Number(e.target.value) })} />
                </div>
              </div>
              <Button type="submit" className="w-full">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Vos classes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {classes.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelected(cls.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${activeClass?.id === cls.id ? "border-primary bg-secondary" : "border-border"}`}
              >
                <span>
                  <span className="font-medium">{cls.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{cls.headcount} élèves</span>
                </span>
                <Trash2
                  className="size-4 text-destructive"
                  onClick={(event) => { event.stopPropagation(); classCrud.remove(cls.id); }}
                />
              </button>
            ))}
            {classes.length === 0 ? <p className="text-sm text-muted-foreground">Aucune classe.</p> : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Programme {activeClass ? `— ${activeClass.name}` : ""}</CardTitle>
            <CardDescription>Matière, enseignant et nombre d'heures par semaine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeClass ? (
              <>
                <form
                  className="grid gap-3 sm:grid-cols-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!assign.subject_id) return;
                    const ok = await csCrud.create({
                      school_id: profile!.school_id,
                      class_id: activeClass.id,
                      subject_id: assign.subject_id,
                      teacher_id: assign.teacher_id || null,
                      hours_per_week: Number(assign.hours_per_week),
                    });
                    if (ok) {
                      setAssign({ subject_id: "", teacher_id: "", hours_per_week: 2 });
                      void regenerate();
                    }
                  }}
                >
                  <Select value={assign.subject_id} onValueChange={(v) => setAssign({ ...assign, subject_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={assign.teacher_id} onValueChange={(v) => setAssign({ ...assign, teacher_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Enseignant" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={assign.hours_per_week}
                    onChange={(e) => setAssign({ ...assign, hours_per_week: Number(e.target.value) })}
                    aria-label="Heures par semaine"
                  />
                  <Button type="submit">Affecter</Button>
                </form>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matière</TableHead>
                      <TableHead>Enseignant</TableHead>
                      <TableHead>h/sem.</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classSubjects.filter((cs) => cs.class_id === activeClass.id).map((cs) => (
                      <TableRow key={cs.id}>
                        <TableCell>{subjects.find((s) => s.id === cs.subject_id)?.name ?? "—"}</TableCell>
                        <TableCell className={cs.teacher_id ? "" : "text-destructive"}>
                          {teachers.find((t) => t.id === cs.teacher_id)?.full_name ?? "Non assigné"}
                        </TableCell>
                        <TableCell>{cs.hours_per_week}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => csCrud.remove(cs.id)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Créez une classe pour définir son programme.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
