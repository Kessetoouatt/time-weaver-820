export const ALL_DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

export type Day = (typeof ALL_DAYS)[number];

export type Slot = { start: string; end: string };

export function toMinutes(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

export function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export function shortTime(time: string): string {
  return time.slice(0, 5);
}

export type BreakSlot = { start_time: string; end_time: string; label?: string };

export type SchoolConfig = {
  days_of_week: string[];
  day_start_time: string;
  day_end_time: string;
  slot_duration_minutes: number;
  lunch_enabled?: boolean | null;
  lunch_start_time?: string | null;
  lunch_end_time?: string | null;
  /** Créneaux de pause additionnels (récréations, pause déjeuner, etc.). */
  breaks?: BreakSlot[] | null;
};

/** Toutes les pauses effectives : la pause déjeuner historique + les pauses multiples. */
export function effectiveBreaks(school: SchoolConfig): BreakSlot[] {
  const list: BreakSlot[] = [];
  const lunchOn = school.lunch_enabled !== false;
  if (lunchOn && school.lunch_start_time && school.lunch_end_time) {
    list.push({
      label: "Pause déjeuner",
      start_time: school.lunch_start_time,
      end_time: school.lunch_end_time,
    });
  }
  for (const b of school.breaks ?? []) {
    if (!b?.start_time || !b?.end_time) continue;
    const dup = list.some((x) => x.start_time === b.start_time && x.end_time === b.end_time);
    if (!dup) list.push(b);
  }
  return list;
}

/** Builds the ordered list of teachable slots for a school configuration. */
export function buildSlots(school: SchoolConfig): Slot[] {
  const start = toMinutes(school.day_start_time);
  const end = toMinutes(school.day_end_time);
  const duration = Math.max(15, school.slot_duration_minutes);
  const breaks = effectiveBreaks(school).map((b) => ({
    start: toMinutes(b.start_time),
    end: toMinutes(b.end_time),
  }));

  const slots: Slot[] = [];
  for (let t = start; t + duration <= end; t += duration) {
    const overlapsBreak = breaks.some((b) => t < b.end && t + duration > b.start);
    if (overlapsBreak) continue;
    slots.push({ start: toTime(t), end: toTime(t + duration) });
  }
  return slots;
}


export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

export function slotHours(school: SchoolConfig): number {
  return school.slot_duration_minutes / 60;
}

export const SUBJECT_PALETTE = [
  "#2563eb",
  "#0ea5e9",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#ea580c",
];

export const DEFAULT_SUBJECTS = [
  "Mathématiques",
  "Physique-Chimie",
  "Anglais",
  "Français",
  "Philosophie",
  "Histoire-Géographie",
  "EPS",
  "Espagnol",
  "Allemand",
  "Musique",
  "Arts plastiques",
  "SVT",
];
