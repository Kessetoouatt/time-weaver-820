import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSchool } from "@/hooks/useSchoolData";
import { ALL_DAYS, buildSlots, shortTime } from "@/lib/timetable";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({
    meta: [
      { title: "Configuration de l'établissement — EDT Genius" },
      {
        name: "description",
        content: "Définissez les jours de cours, la plage horaire, la durée des créneaux et la pause de votre établissement.",
      },
      { property: "og:title", content: "Configuration de l'établissement — EDT Genius" },
      { property: "og:description", content: "Paramétrez la semaine type de votre établissement." },
    ],
  }),
  component: SettingsPage,
});

const SCHOOL_TYPES = [
  { value: "ecole", label: "École" },
  { value: "college", label: "Collège" },
  { value: "lycee", label: "Lycée" },
  { value: "universite", label: "Université" },
];

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: school } = useSchool();
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("lycee");
  const [days, setDays] = useState<string[]>(["lundi", "mardi", "mercredi", "jeudi", "vendredi"]);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("17:00");
  const [slot, setSlot] = useState(60);
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [hasBreak, setHasBreak] = useState(true);

  useEffect(() => {
    if (!school) return;
    setName(school.name);
    setType(school.type);
    setDays(school.days_of_week);
    setStart(shortTime(school.day_start_time));
    setEnd(shortTime(school.day_end_time));
    setSlot(school.slot_duration_minutes);
    setHasBreak(!!school.break_start_time);
    if (school.break_start_time) setBreakStart(shortTime(school.break_start_time));
    if (school.break_end_time) setBreakEnd(shortTime(school.break_end_time));
  }, [school]);

  const slots = buildSlots({
    days_of_week: days,
    day_start_time: `${start}:00`,
    day_end_time: `${end}:00`,
    slot_duration_minutes: slot,
    break_start_time: hasBreak ? `${breakStart}:00` : null,
    break_end_time: hasBreak ? `${breakEnd}:00` : null,
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (days.length === 0) {
      toast.error("Sélectionnez au moins un jour de cours.");
      return;
    }
    if (slots.length === 0) {
      toast.error("Cette configuration ne produit aucun créneau. Vérifiez les horaires.");
      return;
    }
    setBusy(true);
    if (school) {
      const { error } = await supabase
        .from("schools")
        .update({
          name,
          type,
          days_of_week: days,
          day_start_time: `${start}:00`,
          day_end_time: `${end}:00`,
          slot_duration_minutes: slot,
          break_start_time: hasBreak ? `${breakStart}:00` : null,
          break_end_time: hasBreak ? `${breakEnd}:00` : null,
        })
        .eq("id", school.id);
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Configuration enregistrée.");
    } else {
      const { error } = await supabase.rpc("create_school_and_join", {
        _name: name,
        _type: type,
        _days: days,
        _start: `${start}:00`,
        _end: `${end}:00`,
        _slot: slot,
        _break_start: hasBreak ? `${breakStart}:00` : undefined,
        _break_end: hasBreak ? `${breakEnd}:00` : undefined,
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Établissement créé. Vous en êtes l'administrateur.");
    }
    await queryClient.invalidateQueries();
  };

  if (profileLoading) {
    return <Loader2 className="mx-auto mt-20 size-6 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Établissement</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.school_id
            ? "Ces réglages définissent la semaine type utilisée par le moteur de génération."
            : "Créez l'espace de votre établissement pour commencer."}
        </p>
      </div>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations et semaine type</CardTitle>
            <CardDescription>Jours de cours, plage horaire et durée des créneaux.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="school-name">Nom de l'établissement</Label>
                <Input
                  id="school-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lycée Victor Hugo"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jours de cours</Label>
              <div className="flex flex-wrap gap-3">
                {ALL_DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm capitalize">
                    <Checkbox
                      checked={days.includes(day)}
                      onCheckedChange={(checked) =>
                        setDays((current) =>
                          checked
                            ? ALL_DAYS.filter((d) => current.includes(d) || d === day)
                            : current.filter((d) => d !== day),
                        )
                      }
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="start">Début des cours</Label>
                <Input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Fin des cours</Label>
                <Input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Durée d'un créneau</Label>
                <Select value={String(slot)} onValueChange={(v) => setSlot(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 55, 60, 90, 120].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={hasBreak} onCheckedChange={(c) => setHasBreak(!!c)} />
                Pause fixe (aucun cours placé)
              </label>
              {hasBreak ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bstart">Début</Label>
                    <Input id="bstart" type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bend">Fin</Label>
                    <Input id="bend" type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} />
                  </div>
                </div>
              ) : null}
            </div>

            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : school ? "Enregistrer" : "Créer l'établissement"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aperçu des créneaux</CardTitle>
            <CardDescription>
              {slots.length} créneaux par jour · {slots.length * days.length} par semaine
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 space-y-1 overflow-auto text-sm">
            {slots.map((s) => (
              <div key={s.start} className="rounded-md bg-secondary px-3 py-1.5">
                {shortTime(s.start)} – {shortTime(s.end)}
              </div>
            ))}
            {slots.length === 0 ? (
              <p className="text-sm text-destructive">
                Aucun créneau : la plage horaire est trop courte pour la durée choisie.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
