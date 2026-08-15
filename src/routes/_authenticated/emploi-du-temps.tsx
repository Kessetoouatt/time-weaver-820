import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [classId, setClassId] = useState<string | null>(null);
  const activeClass = classes.find((c) => c.id === classId) ?? classes[0] ?? null;
  const [busy, setBusy] = useState(false);

  const generate = useServerFn(generateTimetableFn);
  const move = useServerFn(moveEntryFn);

  const slots = school ? buildSlots(school) : [];
  const days = school?.days_of_week ?? [];

  const run = async () => {
    setBusy(true);
    try {
      const result = await generate({ data: { label: `Génération ${new Date().toLocaleString("fr-FR")}` } });
      if (result.success) {
        toast.success(`Emploi du temps généré : ${result.placed} cours placés.`);
        setVersionId(result.versionId ?? null);
      } else {
        toast.error(result.message ?? "Génération impossible avec les contraintes actuelles.");
      }
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur pendant la génération.");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = async (entryId: string, day: string, start: string, end: string) => {
    try {
      const result = await move({ data: { entryId, dayOfWeek: day, startTime: start, endTime: end } });
      if (!result.success) toast.error(result.message ?? "Conflit détecté : déplacement refusé.");
      else toast.success("Cours déplacé.");
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Déplacement impossible.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Emploi du temps</h1>
          <p className="text-sm text-muted-foreground">Glissez un cours vers un créneau libre pour l'ajuster.</p>
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
          {classes.length > 0 ? (
            <Select value={activeClass?.id ?? ""} onValueChange={setClassId}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Classe" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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

      <Card>
        <CardContent className="overflow-auto pt-6">
          {slots.length === 0 || !activeClass ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Configurez votre établissement et créez au moins une classe pour afficher la grille.
            </p>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-24 border border-border bg-secondary p-2 text-xs font-medium">Horaire</th>
                  {days.map((day) => (
                    <th key={day} className="border border-border bg-secondary p-2 text-xs font-medium capitalize">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.start}>
                    <td className="border border-border p-2 text-center text-xs text-muted-foreground">
                      {shortTime(slot.start)}<br />{shortTime(slot.end)}
                    </td>
                    {days.map((day) => {
                      const entry = entries.find(
                        (e) => e.class_id === activeClass.id && e.day_of_week === day && e.start_time.startsWith(shortTime(slot.start)),
                      );
                      const subject = subjects.find((s) => s.id === entry?.subject_id);
                      return (
                        <td
                          key={day}
                          className="h-16 border border-border p-1 align-top"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            const id = event.dataTransfer.getData("text/plain");
                            if (id) void onDrop(id, day, slot.start, slot.end);
                          }}
                        >
                          {entry ? (
                            <div
                              draggable
                              onDragStart={(event) => event.dataTransfer.setData("text/plain", entry.id)}
                              className="h-full cursor-grab rounded-md p-2 text-xs text-white"
                              style={{ backgroundColor: subject?.color ?? "#2563eb" }}
                            >
                              <p className="font-semibold">{subject?.name}</p>
                              <p className="opacity-90">{teachers.find((t) => t.id === entry.teacher_id)?.full_name ?? ""}</p>
                              <p className="opacity-75">{rooms.find((r) => r.id === entry.room_id)?.name ?? ""}</p>
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
