import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCrud } from "@/components/app/CrudHelpers";
import { useProfile, useRooms } from "@/hooks/useSchoolData";

export const Route = createFileRoute("/_authenticated/salles")({
  head: () => ({
    meta: [
      { title: "Salles — EDT Genius" },
      { name: "description", content: "Déclarez les salles disponibles, leur capacité et leur type." },
      { property: "og:title", content: "Salles — EDT Genius" },
      { property: "og:description", content: "Salles, capacités et types." },
    ],
  }),
  component: RoomsPage,
});

function RoomsPage() {
  const { data: profile } = useProfile();
  const { data: rooms = [] } = useRooms();
  const crud = useCrud("rooms");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", capacity: 30, room_type: "standard" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Salles</h1>
          <p className="text-sm text-muted-foreground">Capacité et type de salle.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle salle</DialogTitle></DialogHeader>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const ok = await crud.create({ ...form, capacity: Number(form.capacity), school_id: profile!.school_id });
                if (ok) { setOpen(false); setForm({ name: "", capacity: 30, room_type: "standard" }); }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="rname">Nom</Label>
                <Input id="rname" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rcap">Capacité</Label>
                  <Input id="rcap" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rtype">Type</Label>
                  <Input id="rtype" value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })} />
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
                <TableHead>Salle</TableHead>
                <TableHead>Capacité</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{room.room_type}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => crud.remove(room.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rooms.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">Aucune salle.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
