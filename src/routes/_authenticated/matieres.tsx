import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCrud } from "@/components/app/CrudHelpers";
import { useProfile, useSubjects } from "@/hooks/useSchoolData";

export const Route = createFileRoute("/_authenticated/matieres")({
  head: () => ({
    meta: [
      { title: "Matières — EDT Genius" },
      { name: "description", content: "Créez les matières enseignées, leur couleur et leurs besoins en salle spécialisée." },
      { property: "og:title", content: "Matières — EDT Genius" },
      { property: "og:description", content: "Matières, couleurs et salles spécialisées." },
    ],
  }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const { data: profile } = useProfile();
  const { data: subjects = [] } = useSubjects();
  const crud = useCrud("subjects");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#2563eb", requires_special_room: false, required_room_type: "" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Matières</h1>
          <p className="text-sm text-muted-foreground">Couleur d'affichage et contrainte de salle.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle matière</DialogTitle></DialogHeader>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const ok = await crud.create({
                  name: form.name,
                  color: form.color,
                  requires_special_room: form.requires_special_room,
                  required_room_type: form.requires_special_room ? form.required_room_type || null : null,
                  school_id: profile!.school_id,
                });
                if (ok) { setOpen(false); setForm({ name: "", color: "#2563eb", requires_special_room: false, required_room_type: "" }); }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="sname">Nom</Label>
                <Input id="sname" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scolor">Couleur</Label>
                <Input id="scolor" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.requires_special_room} onCheckedChange={(c) => setForm({ ...form, requires_special_room: !!c })} />
                Nécessite une salle spécialisée
              </label>
              {form.requires_special_room ? (
                <div className="space-y-2">
                  <Label htmlFor="srt">Type de salle requis</Label>
                  <Input id="srt" placeholder="laboratoire, informatique…" value={form.required_room_type} onChange={(e) => setForm({ ...form, required_room_type: e.target.value })} />
                </div>
              ) : null}
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
                <TableHead>Matière</TableHead>
                <TableHead>Salle requise</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <span className="size-3 rounded-full" style={{ backgroundColor: subject.color }} />
                    {subject.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {subject.requires_special_room ? subject.required_room_type ?? "Spécialisée" : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => crud.remove(subject.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">Aucune matière.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
