import { createServerFn } from "@tanstack/react-start";

import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSlots } from "./timetable";
import { generateTimetable } from "./scheduler";

export const generateTimetableFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label?: string }) => z.object({ label: z.string().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", userId)
      .maybeSingle();
    const schoolId = profile?.school_id;
    if (!schoolId) {
      return {
        ok: false as const,
        errors: ["Aucun établissement rattaché à votre compte."],
        warnings: [],
        unplaced: [],
        versionId: null,
      };
    }

    const [school, classes, subjects, teachers, rooms, classSubjects, unavailabilities] =
      await Promise.all([
        supabase.from("schools").select("*").eq("id", schoolId).single(),
        supabase.from("classes").select("*").eq("school_id", schoolId),
        supabase.from("subjects").select("*").eq("school_id", schoolId),
        supabase.from("teachers").select("*").eq("school_id", schoolId),
        supabase.from("rooms").select("*").eq("school_id", schoolId),
        supabase.from("class_subjects").select("*").eq("school_id", schoolId),
        supabase.from("teacher_unavailabilities").select("*"),
      ]);

    if (school.error || !school.data) {
      return {
        ok: false as const,
        errors: ["Établissement introuvable."],
        warnings: [],
        unplaced: [],
        versionId: null,
      };
    }

    const slots = buildSlots(school.data);
    const result = generateTimetable({
      days: school.data.days_of_week,
      slots,
      slotMinutes: school.data.slot_duration_minutes,
      classes: classes.data ?? [],
      subjects: subjects.data ?? [],
      teachers: teachers.data ?? [],
      rooms: rooms.data ?? [],
      unavailabilities: unavailabilities.data ?? [],
      classSubjects: classSubjects.data ?? [],
    });

    if (result.errors.length > 0) {
      return {
        ok: false as const,
        errors: result.errors,
        warnings: result.warnings,
        unplaced: [],
        versionId: null,
      };
    }

    const { count } = await supabase
      .from("timetable_versions")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId);

    const { data: version, error: versionError } = await supabase
      .from("timetable_versions")
      .insert({
        school_id: schoolId,
        label: data.label?.trim() || `Génération v${(count ?? 0) + 1}`,
        status: "brouillon",
        success: result.ok,
        unplaced_count: result.unplaced.length,
      })
      .select()
      .single();

    if (versionError || !version) {
      return {
        ok: false as const,
        errors: [`Impossible d'enregistrer la version : ${versionError?.message ?? "erreur inconnue"}`],
        warnings: [],
        unplaced: [],
        versionId: null,
      };
    }

    const rows = result.entries.map((e) => ({
      ...e,
      school_id: schoolId,
      timetable_version_id: version.id,
    }));

    const { error: entriesError } = await supabase.from("timetable_entries").insert(rows);
    if (entriesError) {
      await supabase.from("timetable_versions").delete().eq("id", version.id);
      return {
        ok: false as const,
        errors: [`Conflit détecté à l'enregistrement : ${entriesError.message}`],
        warnings: [],
        unplaced: [],
        versionId: null,
      };
    }

    return {
      ok: result.ok,
      errors: [],
      warnings: result.warnings,
      unplaced: result.unplaced,
      versionId: version.id,
    };
  });

const moveSchema = z.object({
  entryId: z.string().uuid(),
  day_of_week: z.string(),
  start_time: z.string(),
  end_time: z.string(),
});

export const moveEntryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof moveSchema>) => moveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: entry } = await supabase
      .from("timetable_entries")
      .select("*")
      .eq("id", data.entryId)
      .maybeSingle();
    if (!entry) return { ok: false as const, error: "Créneau introuvable." };

    const { data: siblings } = await supabase
      .from("timetable_entries")
      .select("id, class_id, teacher_id, room_id, day_of_week, start_time")
      .eq("timetable_version_id", entry.timetable_version_id)
      .eq("day_of_week", data.day_of_week)
      .eq("start_time", data.start_time);

    for (const other of siblings ?? []) {
      if (other.id === entry.id) continue;
      if (other.class_id === entry.class_id) {
        return { ok: false as const, error: "Cette classe a déjà un cours sur ce créneau." };
      }
      if (entry.teacher_id && other.teacher_id === entry.teacher_id) {
        return { ok: false as const, error: "Cet enseignant a déjà un cours sur ce créneau (autre classe)." };
      }
      if (entry.room_id && other.room_id === entry.room_id) {
        return { ok: false as const, error: "Cette salle est déjà occupée sur ce créneau." };
      }
    }

    const { error } = await supabase
      .from("timetable_entries")
      .update({
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
      })
      .eq("id", data.entryId);

    if (error) return { ok: false as const, error: `Déplacement refusé : ${error.message}` };
    return { ok: true as const, error: null };
  });

export const getPublicTimetableFn = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    // Public share links are resolved server-side: anonymous users have no
    // direct table access, and only non-sensitive columns are returned.
    const { supabaseAdmin: client } = await import("@/integrations/supabase/client.server");

    const { data: version } = await client
      .from("timetable_versions")
      .select("id, label, school_id, is_public")
      .eq("public_token", data.token)
      .eq("is_public", true)
      .maybeSingle();


    if (!version) return null;

    const [school, entries, classes, subjects, teachers, rooms] = await Promise.all([
      client.from("schools").select("*").eq("id", version.school_id).maybeSingle(),
      client.from("timetable_entries").select("*").eq("timetable_version_id", version.id),
      client.from("classes").select("id, name, level, headcount").eq("school_id", version.school_id),
      client
        .from("subjects")
        .select("id, name, color, requires_special_room, required_room_type")
        .eq("school_id", version.school_id),
      client
        .from("teachers")
        .select("id, full_name, max_hours_week, latest_end_time")
        .eq("school_id", version.school_id),
      client.from("rooms").select("id, name, room_type, capacity").eq("school_id", version.school_id),
    ]);

    if (!school.data) return null;

    return {
      version: { id: version.id, label: version.label },
      school: school.data,
      entries: entries.data ?? [],
      classes: classes.data ?? [],
      subjects: subjects.data ?? [],
      teachers: teachers.data ?? [],
      rooms: rooms.data ?? [],
    };
  });
