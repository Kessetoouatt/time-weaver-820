import { shortTime, toMinutes, type Slot } from "./timetable";

export type GenTeacher = {
  id: string;
  full_name: string;
  max_hours_week: number;
  latest_end_time: string | null;
};
export type GenSubject = {
  id: string;
  name: string;
  requires_special_room: boolean;
  required_room_type: string | null;
};
export type GenClass = { id: string; name: string; headcount: number };
export type GenRoom = { id: string; name: string; room_type: string; capacity: number };
export type GenUnavailability = {
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};
export type GenClassSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  hours_per_week: number;
};

export type GenInput = {
  days: string[];
  slots: Slot[];
  slotMinutes: number;
  classes: GenClass[];
  subjects: GenSubject[];
  teachers: GenTeacher[];
  rooms: GenRoom[];
  unavailabilities: GenUnavailability[];
  classSubjects: GenClassSubject[];
};

export type GenEntry = {
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  room_id: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

/** A lesson the engine could not place, reported verbatim to the user. */
export type GenUnplaced = {
  className: string;
  subjectName: string;
  teacherName: string;
  hours: number;
};

export type GenResult = {
  ok: boolean;
  entries: GenEntry[];
  unplaced: GenUnplaced[];
  errors: string[];
  warnings: string[];
};

type Lesson = {
  classId: string;
  subjectId: string;
  teacherId: string;
  needsRoomType: string | null;
  className: string;
  subjectName: string;
  teacherName: string;
};

const hoursLabel = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)}h`;

export function checkFeasibility(input: GenInput): string[] {
  const errors: string[] = [];
  const { days, slots, slotMinutes } = input;
  const slotHours = slotMinutes / 60;
  const totalCells = days.length * slots.length;

  if (totalCells === 0) {
    errors.push(
      "La configuration de l'établissement ne produit aucun créneau : vérifiez les jours de cours et les horaires.",
    );
    return errors;
  }

  const classById = new Map(input.classes.map((c) => [c.id, c]));
  const subjectById = new Map(input.subjects.map((s) => [s.id, s]));
  const teacherById = new Map(input.teachers.map((t) => [t.id, t]));

  if (input.classSubjects.length === 0) {
    errors.push(
      "Aucune matière n'est affectée à une classe : ajoutez au moins une matière avec un volume horaire.",
    );
  }

  for (const cs of input.classSubjects) {
    const className = classById.get(cs.class_id)?.name ?? "Classe inconnue";
    const subjectName = subjectById.get(cs.subject_id)?.name ?? "Matière inconnue";
    if (!cs.teacher_id) {
      errors.push(`La classe ${className} n'a pas d'enseignant assigné en ${subjectName}.`);
    }
    if (cs.hours_per_week <= 0) {
      errors.push(`${subjectName} en ${className} a un volume horaire de 0 : corrigez-le ou supprimez la ligne.`);
    }
  }

  const perClassSlots = new Map<string, number>();
  for (const cs of input.classSubjects) {
    const needed = Math.ceil(cs.hours_per_week / slotHours);
    perClassSlots.set(cs.class_id, (perClassSlots.get(cs.class_id) ?? 0) + needed);
  }
  for (const [classId, needed] of perClassSlots) {
    if (needed > totalCells) {
      const className = classById.get(classId)?.name ?? "Classe inconnue";
      errors.push(
        `La classe ${className} demande ${needed} créneaux alors que la semaine n'en compte que ${totalCells}. Réduisez les volumes horaires ou élargissez la plage horaire.`,
      );
    }
  }

  const perTeacherSlots = new Map<string, number>();
  for (const cs of input.classSubjects) {
    if (!cs.teacher_id) continue;
    const needed = Math.ceil(cs.hours_per_week / slotHours);
    perTeacherSlots.set(cs.teacher_id, (perTeacherSlots.get(cs.teacher_id) ?? 0) + needed);
  }
  for (const [teacherId, needed] of perTeacherSlots) {
    const teacher = teacherById.get(teacherId);
    if (!teacher) continue;
    const free = countFreeCells(input, teacherId);
    const neededHours = needed * slotHours;
    if (neededHours > teacher.max_hours_week) {
      errors.push(
        `${teacher.full_name} est sollicité·e sur ${hoursLabel(neededHours)} alors que son maximum hebdomadaire est de ${hoursLabel(teacher.max_hours_week)}.`,
      );
    }
    if (needed > free) {
      errors.push(
        `${teacher.full_name} est sollicité·e sur ${hoursLabel(neededHours)} alors qu'il·elle n'est disponible que ${hoursLabel(free * slotHours)} (indisponibilités et préférences horaires prises en compte).`,
      );
    }
  }

  const roomTypes = new Set(input.rooms.map((r) => r.room_type));
  for (const cs of input.classSubjects) {
    const subject = subjectById.get(cs.subject_id);
    if (!subject?.requires_special_room) continue;
    const type = subject.required_room_type;
    if (!type) continue;
    if (!roomTypes.has(type)) {
      const className = classById.get(cs.class_id)?.name ?? "Classe inconnue";
      errors.push(
        `${subject.name} (${className}) nécessite une salle de type « ${type} » : aucune salle de ce type n'existe.`,
      );
    }
  }

  return [...new Set(errors)];
}

function countFreeCells(input: GenInput, teacherId: string): number {
  const teacher = input.teachers.find((t) => t.id === teacherId);
  let count = 0;
  for (const day of input.days) {
    for (const slot of input.slots) {
      if (isTeacherAvailable(input, teacher, teacherId, day, slot)) count += 1;
    }
  }
  return count;
}

function isTeacherAvailable(
  input: GenInput,
  teacher: GenTeacher | undefined,
  teacherId: string,
  day: string,
  slot: Slot,
): boolean {
  if (teacher?.latest_end_time && toMinutes(slot.end) > toMinutes(teacher.latest_end_time)) {
    return false;
  }
  for (const u of input.unavailabilities) {
    if (u.teacher_id !== teacherId) continue;
    if (u.day_of_week !== day) continue;
    if (toMinutes(slot.start) < toMinutes(u.end_time) && toMinutes(u.start_time) < toMinutes(slot.end)) {
      return false;
    }
  }
  return true;
}

/** Deterministic-per-seed pseudo random generator, so a run is reproducible. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

const ATTEMPTS = 40;

/**
 * Greedy scheduler with multiple randomised attempts.
 *
 * Hard guarantee by construction: a teacher, a class and a room are each
 * written into a given cell at most once, since a lesson is only committed
 * when every corresponding busy flag is free.
 */
export function generateTimetable(input: GenInput): GenResult {
  const errors = checkFeasibility(input);
  if (errors.length > 0) {
    return { ok: false, entries: [], unplaced: [], errors, warnings: [] };
  }

  const { days, slots, slotMinutes } = input;
  const slotHours = slotMinutes / 60;
  const D = days.length;
  const S = slots.length;
  const cellCount = D * S;

  const subjectById = new Map(input.subjects.map((s) => [s.id, s]));
  const classById = new Map(input.classes.map((c) => [c.id, c]));
  const teacherById = new Map(input.teachers.map((t) => [t.id, t]));

  const lessons: Lesson[] = [];
  for (const cs of input.classSubjects) {
    const subject = subjectById.get(cs.subject_id);
    const count = Math.ceil(cs.hours_per_week / slotHours);
    for (let i = 0; i < count; i += 1) {
      lessons.push({
        classId: cs.class_id,
        subjectId: cs.subject_id,
        teacherId: cs.teacher_id as string,
        needsRoomType: subject?.requires_special_room ? (subject.required_room_type ?? null) : null,
        className: classById.get(cs.class_id)?.name ?? "?",
        subjectName: subject?.name ?? "?",
        teacherName: teacherById.get(cs.teacher_id ?? "")?.full_name ?? "Non assigné",
      });
    }
  }

  const teacherAvail = new Map<string, boolean[]>();
  for (const teacher of input.teachers) {
    const mask: boolean[] = new Array(cellCount).fill(true);
    for (let d = 0; d < D; d += 1) {
      for (let s = 0; s < S; s += 1) {
        mask[d * S + s] = isTeacherAvailable(input, teacher, teacher.id, days[d]!, slots[s]!);
      }
    }
    teacherAvail.set(teacher.id, mask);
  }

  const teacherLoad = new Map<string, number>();
  for (const l of lessons) teacherLoad.set(l.teacherId, (teacherLoad.get(l.teacherId) ?? 0) + 1);
  const difficulty = (l: Lesson) => {
    const avail = (teacherAvail.get(l.teacherId) ?? []).filter(Boolean).length || 1;
    return (teacherLoad.get(l.teacherId) ?? 0) / avail + (l.needsRoomType ? 0.5 : 0);
  };

  type Attempt = { entries: GenEntry[]; unplaced: Lesson[] };

  const runAttempt = (seed: number): Attempt => {
    const random = makeRandom(seed);
    // Hardest lessons first, ties broken randomly so each attempt explores differently.
    const ordered = shuffle(lessons, random).sort((a, b) => difficulty(b) - difficulty(a));

    const classBusy = new Map<string, (Lesson | null)[]>();
    for (const c of input.classes) classBusy.set(c.id, new Array(cellCount).fill(null));
    const teacherBusy = new Map<string, boolean[]>();
    for (const t of input.teachers) teacherBusy.set(t.id, new Array(cellCount).fill(false));
    const roomBusy = new Map<string, boolean[]>();
    for (const r of input.rooms) roomBusy.set(r.id, new Array(cellCount).fill(false));

    const pickRoom = (lesson: Lesson, cell: number): { room: GenRoom | null; ok: boolean } => {
      if (input.rooms.length === 0) return { room: null, ok: true };
      if (lesson.needsRoomType) {
        const candidates = input.rooms.filter(
          (r) => r.room_type === lesson.needsRoomType && !roomBusy.get(r.id)![cell],
        );
        if (candidates.length === 0) return { room: null, ok: false };
        return { room: candidates[0]!, ok: true };
      }
      const headcount = classById.get(lesson.classId)?.headcount ?? 0;
      const candidates = input.rooms
        .filter((r) => !roomBusy.get(r.id)![cell] && r.capacity >= headcount)
        .sort((a, b) => {
          const aNormal = a.room_type === "normale" ? 0 : 1;
          const bNormal = b.room_type === "normale" ? 0 : 1;
          if (aNormal !== bNormal) return aNormal - bNormal;
          return a.capacity - b.capacity;
        });
      return { room: candidates[0] ?? null, ok: true };
    };

    const scoreCell = (lesson: Lesson, cell: number): number => {
      const d = Math.floor(cell / S);
      const s = cell % S;
      let score = random() * 2;
      const cls = classBusy.get(lesson.classId)!;
      for (let i = 0; i < S; i += 1) {
        const other = cls[d * S + i];
        if (other && other.subjectId === lesson.subjectId) score += 40;
      }
      const near = (s > 0 && cls[d * S + s - 1]) || (s < S - 1 && cls[d * S + s + 1]) ? -6 : 0;
      score += near;
      const tb = teacherBusy.get(lesson.teacherId)!;
      const teacherNear = (s > 0 && tb[d * S + s - 1]) || (s < S - 1 && tb[d * S + s + 1]) ? -6 : 0;
      score += teacherNear;
      let dayLoad = 0;
      for (let i = 0; i < S; i += 1) if (cls[d * S + i]) dayLoad += 1;
      score += dayLoad * 1.5 + s * 0.4;
      return score;
    };

    const entries: GenEntry[] = [];
    const unplaced: Lesson[] = [];

    for (const lesson of ordered) {
      const cls = classBusy.get(lesson.classId);
      const tb = teacherBusy.get(lesson.teacherId);
      const avail = teacherAvail.get(lesson.teacherId);
      if (!cls || !tb || !avail) {
        unplaced.push(lesson);
        continue;
      }

      let best: { cell: number; score: number } | null = null;
      for (let cell = 0; cell < cellCount; cell += 1) {
        if (cls[cell] || tb[cell] || !avail[cell]) continue;
        if (lesson.needsRoomType && !pickRoom(lesson, cell).ok) continue;
        const score = scoreCell(lesson, cell);
        if (!best || score < best.score) best = { cell, score };
      }

      if (!best) {
        unplaced.push(lesson);
        continue;
      }

      const { room } = pickRoom(lesson, best.cell);
      cls[best.cell] = lesson;
      tb[best.cell] = true;
      if (room) roomBusy.get(room.id)![best.cell] = true;
      const d = Math.floor(best.cell / S);
      const s = best.cell % S;
      entries.push({
        class_id: lesson.classId,
        subject_id: lesson.subjectId,
        teacher_id: lesson.teacherId,
        room_id: room?.id ?? null,
        day_of_week: days[d]!,
        start_time: slots[s]!.start,
        end_time: slots[s]!.end,
      });
    }

    return { entries, unplaced };
  };

  let best: Attempt | null = null;
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const result = runAttempt(attempt * 7919 + 104729);
    if (!best || result.unplaced.length < best.unplaced.length) best = result;
    if (best.unplaced.length === 0) break;
  }

  const attempt = best ?? { entries: [], unplaced: [] };
  const entries = attempt.entries;

  const unplaced: GenUnplaced[] = [];
  for (const lesson of attempt.unplaced) {
    const existing = unplaced.find(
      (u) =>
        u.className === lesson.className &&
        u.subjectName === lesson.subjectName &&
        u.teacherName === lesson.teacherName,
    );
    if (existing) existing.hours += slotHours;
    else
      unplaced.push({
        className: lesson.className,
        subjectName: lesson.subjectName,
        teacherName: lesson.teacherName,
        hours: slotHours,
      });
  }

  const warnings: string[] = [];
  for (const teacher of input.teachers) {
    const gaps = countGaps(entries.filter((e) => e.teacher_id === teacher.id), days, slots);
    if (gaps > 0) warnings.push(`${teacher.full_name} a ${gaps} heure(s) de trou dans son emploi du temps.`);
  }
  for (const cls of input.classes) {
    const classEntries = entries.filter((e) => e.class_id === cls.id);
    const gaps = countGaps(classEntries, days, slots);
    if (gaps > 0) warnings.push(`La classe ${cls.name} a ${gaps} heure(s) de trou.`);
  }

  return {
    ok: unplaced.length === 0,
    entries,
    unplaced,
    errors: [],
    warnings: warnings.slice(0, 20),
  };
}

function countGaps(entries: GenEntry[], days: string[], slots: Slot[]): number {
  let gaps = 0;
  for (const day of days) {
    const indexes = entries
      .filter((e) => e.day_of_week === day)
      .map((e) => slots.findIndex((s) => shortTime(s.start) === shortTime(e.start_time)))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    if (indexes.length < 2) continue;
    for (let i = 1; i < indexes.length; i += 1) {
      gaps += indexes[i]! - indexes[i - 1]! - 1;
    }
  }
  return gaps;
}
