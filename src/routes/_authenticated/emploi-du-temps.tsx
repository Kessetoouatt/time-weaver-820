import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useClasses,
  useEntries,
  useRooms,
  useSchool,
  useSubjects,
  useTeachers,
  useVersions,
} from "@/hooks/useSchoolData";
import { buildSlots, shortTime } from "@/lib/timetable";
import { generateTimetableFn, moveEntryFn } from "@/lib/timetable.functions";

type Unplaced = { className: string; subjectName: string; teacherName: string; hours: number };

export const Route = createFileRoute("/_authenticated/emploi-du-temps")({
  head: () => ({
    meta: [
      { title: "Emploi du temps — EDT Genius" },
      { name: "description", content: "Générez, visualisez et ajustez l'emploi du temps sans chevauchement." },
      { property: "og:title", content: "Emploi du temps — EDT Genius" },
      { property: "og:description", content: "Génération automatique et édition par glisser-déposer." },
    ],
  }),
  component: TimetablePage,
});

function TimetablePage() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { data: versions = [] } = useVersions();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: teachers = [] } = useTeachers();
  const { data: rooms = [] } = useRooms();

  const [versionId, setVersionId] = useState<string | null>(null);
  const activeVersion = versions.find((v) => v.id === versionId) ?? versions[0] ?? null;
  const { data: entries = [] } = useEntries(activeVersion?.id ?? null);

  const [mode, setMode] = useState<"classe" | "enseignant">("classe");
  const [classId, setClassId] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const activeClass = classes.find((c) => c.id === classId) ?? classes[0] ?? null;
  const activeTeacher = teachers.find((t) => t.id === teacherId) ?? teachers[0] ?? null;

  const [busy, setBusy] = useState(false);
  const [unplaced, setUnplaced] = useState<Unplaced[]>([]);
  const [dragged, setDragged] = useState<string | null>(null);

  const generate = useServerFn(generateTimetableFn);
  const move = useServerFn(moveEntryFn);

  const slots = school ? buildSlots(school) : [];
  const days = school?.days_of_week ?? [];

  const visibleEntries = useMemo(
    () =>
      mode === "classe"
        ? entries.filter((e) => e.class_id === activeClass?.id)
        : entries.filter((e) => e.teacher_id === activeTeacher?.id),
    [entries, mode, activeClass?.id, activeTeacher?.id],
  );

  const draggedEntry = entries.find((e) => e.id === dragged) ?? null;

  /** Immediate visual conflict check while dragging, before hitting the server. */
  const cellConflict = (day: string, start: string): string | null => {
    if (!draggedEntry) return null;
    const clash = entries.find(
      (e) =>
        e.id !== draggedEntry.id &&
        e.day_of_week === day &&
        shortTime(e.start_time) === shortTime(start) &&
        (e.class_id === draggedEntry.class_id ||
          (!!draggedEntry.teacher_id && e.teacher_id === draggedEntry.teacher_id) ||
          (!!draggedEntry.room_id && e.room_id === draggedEntry.room_id)),
    );
    if (!clash) return null;
    if (clash.class_id === draggedEntry.class_id) return "Classe déjà occupée";
    if (clash.teacher_id === draggedEntry.teacher_id) return "Enseignant déjà occupé";
    return "Salle déjà occupée";
  };

  const run = async () => {
    setBusy(true);
    try {
      const result = await generate({ data: { label: `Génération ${new Date().toLocaleString("fr-FR")}` } });
      setUnplaced(result.unplaced ?? []);
      if (result.ok) {
        toast.success("Emploi du temps généré : aucun chevauchement.");
        setVersionId(result.versionId);
      } else if (result.versionId) {
        toast.warning("Emploi du temps partiel : certains cours n'ont pas pu être placés.");
        setVersionId(result.versionId);
      } else {
        toast.error(result.errors[0] ?? "Génération impossible avec les contraintes actuelles.");
      }
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur pendant la génération.");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = async (entryId: string, day: string, start: string, end: string) => {
    setDragged(null);
    try {
      const result = await move({ data: { entryId, day_of_week: day, start_time: start, end_time: end } });
      if (!result.ok) toast.error(result.error);
      else toast.success("Cours déplacé.");
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Déplacement impossible.");
    }
  };

  const boardReady = slots.length > 0 && (mode === "classe" ? !!activeClass : !!activeTeacher);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Emploi du temps</h1>
          <p className="text-sm text-muted-foreground">
            Glissez un cours vers un créneau libre : les conflits s'affichent en rouge avant validation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {versions.length > 0 ? (
            <Select value={activeVersion?.id ?? ""} onValueChange={setVersionId}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Version" /></SelectTrigger>
              <SelectContent>
                {versions.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
          <Select value={mode} onValueChange={(value) => setMode(value as "classe" | "enseignant")}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="classe">Par classe</SelectItem>
              <SelectItem value="enseignant">Par enseignant</SelectItem>
            </SelectContent>
          </Select>
          {mode === "classe" && classes.length > 0 ? (
            <Select value={activeClass?.id ?? ""} onValueChange={setClassId}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Classe" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
          {mode === "enseignant" && teachers.length > 0 ? (
            <Select value={activeTeacher?.id ?? ""} onValueChange={setTeacherId}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Enseignant" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Exporter PDF
          </Button>
          <Button onClick={run} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Générer
          </Button>
        </div>
      </div>

      {unplaced.length > 0 ? (
        <Alert variant="destructive" className="print:hidden">
          <AlertTriangle className="size-4" />
          <AlertTitle>{unplaced.length} cours n'ont pas pu être placés</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {unplaced.map((u) => (
                <li key={`${u.className}-${u.subjectName}-${u.teacherName}`}>
                  {u.className} — {u.subjectName} ({u.teacherName}) : {u.hours}h restantes à placer.
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="overflow-auto pt-6">
          {!boardReady ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Configurez votre établissement et créez au moins une classe pour afficher la grille.
            </p>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-24 border border-border bg-secondary p-2 text-xs font-medium uppercase tracking-widest">
                    Horaire
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="border border-border bg-secondary p-2 text-xs font-medium uppercase tracking-widest"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.start}>
                    <td className="board-time border border-border p-2 text-center text-xs text-primary">
                      {shortTime(slot.start)}<br />{shortTime(slot.end)}
                    </td>
                    {days.map((day) => {
                      const entry = visibleEntries.find(
                        (e) => e.day_of_week === day && shortTime(e.start_time) === shortTime(slot.start),
                      );
                      const subject = subjects.find((s) => s.id === entry?.subject_id);
                      const conflict = cellConflict(day, slot.start);
                      return (
                        <td
                          key={day}
                          title={conflict ?? undefined}
                          className={`h-16 border p-1 align-top transition-colors ${
                            conflict
                              ? "border-destructive bg-destructive/20"
                              : dragged
                                ? "border-primary/40 bg-primary/5"
                                : "border-border"
                          }`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            const id = event.dataTransfer.getData("text/plain");
                            if (!id) return;
                            if (conflict) {
                              toast.error(`Déplacement refusé : ${conflict.toLowerCase()} sur ce créneau.`);
                              setDragged(null);
                              return;
                            }
                            void onDrop(id, day, slot.start, slot.end);
                          }}
                        >
                          {entry ? (
                            <div
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData("text/plain", entry.id);
                                setDragged(entry.id);
                              }}
                              onDragEnd={() => setDragged(null)}
                              className="h-full cursor-grab rounded-md border-l-4 bg-card p-2 text-xs"
                              style={{ borderLeftColor: subject?.color ?? "#f59e0b" }}
                            >
                              <p className="font-semibold" style={{ color: subject?.color ?? "#f59e0b" }}>
                                {subject?.name}
                              </p>
                              <p className="text-muted-foreground">
                                {mode === "classe"
                                  ? (teachers.find((t) => t.id === entry.teacher_id)?.full_name ?? "")
                                  : (classes.find((c) => c.id === entry.class_id)?.name ?? "")}
                              </p>
                              <p className="board-time text-[11px] text-muted-foreground">
                                {rooms.find((r) => r.id === entry.room_id)?.name ?? ""}
                              </p>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
