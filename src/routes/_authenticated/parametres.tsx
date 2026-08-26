import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

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
import { useProfile, useSchool, useSchoolBreaks } from "@/hooks/useSchoolData";
import { useSchoolLogo } from "@/hooks/useSchoolLogo";
import { ALL_DAYS, buildSlots, shortTime } from "@/lib/timetable";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({
    meta: [
      { title: "Configuration de l'établissement — EDT Genius" },
      {
        name: "description",
        content:
          "Logo, références, jours de cours, plage horaire, durée des créneaux et pauses multiples de votre établissement.",
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

type BreakRow = { id?: string; label: string; start: string; end: string };

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: school } = useSchool();
  const { data: savedBreaks = [] } = useSchoolBreaks();
  const logoUrl = useSchoolLogo();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("lycee");
  const [refs, setRefs] = useState({
    address: "",
    phone: "",
    email: "",
    website: "",
    reference_code: "",
    head_name: "",
  });
  const [days, setDays] = useState<string[]>(["lundi", "mardi", "mercredi", "jeudi", "vendredi"]);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("17:00");
  const [slot, setSlot] = useState(60);
  const [breaks, setBreaks] = useState<BreakRow[]>([
    { label: "Pause déjeuner", start: "12:00", end: "13:00" },
  ]);

  useEffect(() => {
    if (!school) return;
    setName(school.name);
    setType(school.type);
    setRefs({
      address: school.address ?? "",
      phone: school.phone ?? "",
      email: school.email ?? "",
      website: school.website ?? "",
      reference_code: school.reference_code ?? "",
      head_name: school.head_name ?? "",
    });
    setDays(school.days_of_week);
    setStart(shortTime(school.day_start_time));
    setEnd(shortTime(school.day_end_time));
    setSlot(school.slot_duration_minutes);
  }, [school]);

  useEffect(() => {
    if (!school) return;
    if (savedBreaks.length > 0) {
      setBreaks(
        savedBreaks.map((b) => ({
          id: b.id,
          label: b.label,
          start: shortTime(b.start_time),
          end: shortTime(b.end_time),
        })),
      );
    } else if (school.lunch_enabled && school.lunch_start_time && school.lunch_end_time) {
      setBreaks([
        {
          label: "Pause déjeuner",
          start: shortTime(school.lunch_start_time),
          end: shortTime(school.lunch_end_time),
        },
      ]);
    } else {
      setBreaks([]);
    }
  }, [school, savedBreaks]);

  const validBreaks = breaks.filter((b) => b.start && b.end && b.start < b.end);

  const slots = buildSlots({
    days_of_week: days,
    day_start_time: `${start}:00`,
    day_end_time: `${end}:00`,
    slot_duration_minutes: slot,
    lunch_enabled: false,
    breaks: validBreaks.map((b) => ({ start_time: `${b.start}:00`, end_time: `${b.end}:00` })),
  });

  const syncBreaks = async (schoolId: string) => {
    await supabase.from("school_breaks").delete().eq("school_id", schoolId);
    if (validBreaks.length === 0) return;
    await supabase.from("school_breaks").insert(
      validBreaks.map((b) => ({
        school_id: schoolId,
        label: b.label || "Pause",
        start_time: `${b.start}:00`,
        end_time: `${b.end}:00`,
      })),
    );
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (days.length === 0) {
      toast.error("Sélectionnez au moins un jour de cours.");
      return;
    }
    if (slots.length === 0) {
      toast.error("Cette configuration ne produit aucun créneau. Vérifiez les horaires et les pauses.");
      return;
    }
    setBusy(true);
    const first = validBreaks[0];
    if (school) {
      const { error } = await supabase
        .from("schools")
        .update({
          name,
          type,
          address: refs.address || null,
          phone: refs.phone || null,
          email: refs.email || null,
          website: refs.website || null,
          reference_code: refs.reference_code || null,
          head_name: refs.head_name || null,
          days_of_week: days,
          day_start_time: `${start}:00`,
          day_end_time: `${end}:00`,
          slot_duration_minutes: slot,
          lunch_enabled: !!first,
          lunch_start_time: first ? `${first.start}:00` : null,
          lunch_end_time: first ? `${first.end}:00` : null,
        })
        .eq("id", school.id);
      if (!error) await syncBreaks(school.id);
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Configuration enregistrée.");
    } else {
      const { data: newId, error } = await supabase.rpc("create_school_and_join", {
        _name: name,
        _type: type,
        _days: days,
        _start: `${start}:00`,
        _end: `${end}:00`,
        _slot: slot,
        ...(first ? { _break_start: `${first.start}:00`, _break_end: `${first.end}:00` } : {}),
      });
      if (!error && newId) await syncBreaks(newId as unknown as string);
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Établissement créé. Les matières standard sont préenregistrées.");
    }
    await queryClient.invalidateQueries();
  };

  const uploadLogo = async (file: File) => {
    if (!school) {
      toast.error("Créez d'abord l'établissement.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${school.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("school-logos").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { error: updateError } = await supabase
      .from("schools")
      .update({ logo_url: path })
      .eq("id", school.id);
    setUploading(false);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    toast.success("Logo mis à jour.");
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
            ? "Ces réglages définissent l'identité et la semaine type utilisées par le moteur de génération."
            : "Créez l'espace de votre établissement pour commencer."}
        </p>
      </div>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Identité et références</CardTitle>
            <CardDescription>Logo et coordonnées affichés sur les emplois du temps exportés.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
                {logoUrl ? (
                  <img src={logoUrl} alt={`Logo de ${name || "l'établissement"}`} className="size-full object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">Logo</span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadLogo(file);
                    e.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" disabled={uploading || !school} onClick={() => fileRef.current?.click()}>
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Téléverser un logo
                </Button>
                <p className="text-xs text-muted-foreground">PNG ou JPG, 2 Mo maximum.</p>
              </div>
            </div>

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
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" value={refs.address} onChange={(e) => setRefs({ ...refs, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" value={refs.phone} onChange={(e) => setRefs({ ...refs, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={refs.email} onChange={(e) => setRefs({ ...refs, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input id="website" value={refs.website} onChange={(e) => setRefs({ ...refs, website: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refcode">Code / référence officielle</Label>
                <Input id="refcode" value={refs.reference_code} onChange={(e) => setRefs({ ...refs, reference_code: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="head">Chef d'établissement</Label>
                <Input id="head" value={refs.head_name} onChange={(e) => setRefs({ ...refs, head_name: e.target.value })} />
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Créneaux de pause</p>
                  <p className="text-xs text-muted-foreground">
                    Récréations, pause déjeuner… aucun cours n'est placé sur ces plages.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBreaks((c) => [...c, { label: "Récréation", start: "10:00", end: "10:15" }])}
                >
                  <Plus className="size-4" /> Ajouter une pause
                </Button>
              </div>
              {breaks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune pause : la journée est continue.</p>
              ) : null}
              {breaks.map((b, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor={`bl-${index}`}>Libellé</Label>
                    <Input
                      id={`bl-${index}`}
                      value={b.label}
                      onChange={(e) =>
                        setBreaks((c) => c.map((x, i) => (i === index ? { ...x, label: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`bs-${index}`}>Début</Label>
                    <Input
                      id={`bs-${index}`}
                      type="time"
                      value={b.start}
                      onChange={(e) =>
                        setBreaks((c) => c.map((x, i) => (i === index ? { ...x, start: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`be-${index}`}>Fin</Label>
                    <Input
                      id={`be-${index}`}
                      type="time"
                      value={b.end}
                      onChange={(e) =>
                        setBreaks((c) => c.map((x, i) => (i === index ? { ...x, end: e.target.value } : x)))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Supprimer la pause"
                    onClick={() => setBreaks((c) => c.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
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
              <div key={s.start} className="board-time rounded-md bg-secondary px-3 py-1.5">
                {shortTime(s.start)} – {shortTime(s.end)}
              </div>
            ))}
            {slots.length === 0 ? (
              <p className="text-sm text-destructive">
                Aucun créneau : la plage horaire est trop courte ou les pauses couvrent la journée.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
