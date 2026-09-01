import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useCrud } from "@/components/app/CrudHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useTeachers, useUnavailabilities, type Teacher } from "@/hooks/useSchoolData";
import { ALL_DAYS, shortTime } from "@/lib/timetable";

export const Route = createFileRoute("/_authenticated/enseignants")({
  head: () => ({
    meta: [
      { title: "Enseignants — EDT Genius" },
      { name: "description", content: "Gérez les enseignants, leur volume horaire maximum et leurs indisponibilités." },
      { property: "og:title", content: "Enseignants — EDT Genius" },
      { property: "og:description", content: "Enseignants, heures maximum et indisponibilités." },
    ],
  }),
  component: TeachersPage,
});

function TeachersPage() {
  const { data: profile } = useProfile();
  const { data: teachers = [] } = useTeachers();
  const { data: unavailabilities = [] } = useUnavailabilities();
  const queryClient = useQueryClient();
  const crud = useCrud("teachers");
  const unavCrud = useCrud("teacher_unavailabilities");
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", max_hours_week: 20, latest_end_time: "" });
  const [unavTeacher, setUnavTeacher] = useState<string>("");
  const [unavDays, setUnavDays] = useState<string[]>([]);
  const [unavRanges, setUnavRanges] = useState<{ start_time: string; end_time: string }[]>([
    { start_time: "08:00", end_time: "10:00" },
  ]);
  const [unavBusy, setUnavBusy] = useState(false);

  const resetUnav = () => {
    setUnavTeacher("");
    setUnavDays([]);
    setUnavRanges([{ start_time: "08:00", end_time: "10:00" }]);
  };

  const submitUnav = async (event: React.FormEvent) => {
    event.preventDefault();
    const valid = unavRanges.filter((r) => r.start_time && r.end_time && r.start_time < r.end_time);
    if (unavDays.length === 0 || valid.length === 0) {
      toast.error("Choisissez au moins un jour et un créneau valide.");
      return;
    }
    const rows = unavDays.flatMap((day) =>
      valid.map((r) => ({
        teacher_id: unavTeacher,
        day_of_week: day,
        start_time: `${r.start_time}:00`,
        end_time: `${r.end_time}:00`,
      })),
    );
    setUnavBusy(true);
    const { error } = await supabase.from("teacher_unavailabilities").insert(rows);
    setUnavBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${rows.length} indisponibilité(s) enregistrée(s).`);
    resetUnav();
    await queryClient.invalidateQueries();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      full_name: form.full_name,
      email: form.email || null,
      max_hours_week: Number(form.max_hours_week),
      latest_end_time: form.latest_end_time ? `${form.latest_end_time}:00` : null,
      school_id: profile!.school_id,
    };
    const ok = editing ? await crud.update(editing.id, payload) : await crud.create(payload);
    if (ok) {
      setOpen(false);
      setEditing(null);
      setForm({ full_name: "", email: "", max_hours_week: 20, latest_end_time: "" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Enseignants</h1>
          <p className="text-sm text-muted-foreground">Volume horaire maximum et indisponibilités.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier l'enseignant" : "Nouvel enseignant"}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="tname">Nom complet</Label>
                <Input id="tname" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temail">Email (optionnel)</Label>
                <Input id="temail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tmax">Heures max / semaine</Label>
                  <Input id="tmax" type="number" min={1} required value={form.max_hours_week} onChange={(e) => setForm({ ...form, max_hours_week: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tlate">Pas de cours après</Label>
                  <Input id="tlate" type="time" value={form.latest_end_time} onChange={(e) => setForm({ ...form, latest_end_time: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Heures max</TableHead>
                <TableHead>Indisponibilités</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">
                    {teacher.full_name}
                    {teacher.latest_end_time ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (fin max {shortTime(teacher.latest_end_time)})
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{teacher.max_hours_week}h</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {unavailabilities
                        .filter((u) => u.teacher_id === teacher.id)
                        .map((u) => (
                          <Badge key={u.id} variant="secondary" className="gap-1">
                            {u.day_of_week} {shortTime(u.start_time)}–{shortTime(u.end_time)}
                            <button type="button" onClick={() => unavCrud.remove(u.id)} aria-label="Retirer">
                              <X className="size-3" />
                            </button>
                          </Badge>
                        ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUnav({ ...unav, teacher_id: teacher.id })}
                      >
                        <Plus className="size-3" /> Indispo
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(teacher);
                        setForm({
                          full_name: teacher.full_name,
                          email: teacher.email ?? "",
                          max_hours_week: teacher.max_hours_week,
                          latest_end_time: teacher.latest_end_time ? shortTime(teacher.latest_end_time) : "",
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => crud.remove(teacher.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun enseignant pour le moment.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!unav.teacher_id} onOpenChange={(v) => !v && setUnav({ ...unav, teacher_id: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une indisponibilité</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await unavCrud.create({
                teacher_id: unav.teacher_id,
                day_of_week: unav.day_of_week,
                start_time: `${unav.start_time}:00`,
                end_time: `${unav.end_time}:00`,
              });
              if (ok) setUnav({ ...unav, teacher_id: "" });
            }}
          >
            <div className="space-y-2">
              <Label>Jour</Label>
              <Select value={unav.day_of_week} onValueChange={(v) => setUnav({ ...unav, day_of_week: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_DAYS.map((day) => (
                    <SelectItem key={day} value={day} className="capitalize">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="us">De</Label>
                <Input id="us" type="time" value={unav.start_time} onChange={(e) => setUnav({ ...unav, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ue">À</Label>
                <Input id="ue" type="time" value={unav.end_time} onChange={(e) => setUnav({ ...unav, end_time: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full">Ajouter</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
