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

export type SchoolConfig = {
  days_of_week: string[];
  day_start_time: string;
  day_end_time: string;
  slot_duration_minutes: number;
  lunch_enabled?: boolean | null;
  lunch_start_time?: string | null;
  lunch_end_time?: string | null;
};

/** Builds the ordered list of teachable slots for a school configuration. */
export function buildSlots(school: SchoolConfig): Slot[] {
  const start = toMinutes(school.day_start_time);
  const end = toMinutes(school.day_end_time);
  const duration = Math.max(15, school.slot_duration_minutes);
  const lunchOn = school.lunch_enabled !== false;
  const breakStart = lunchOn && school.lunch_start_time ? toMinutes(school.lunch_start_time) : null;
  const breakEnd = lunchOn && school.lunch_end_time ? toMinutes(school.lunch_end_time) : null;

  const slots: Slot[] = [];
  for (let t = start; t + duration <= end; t += duration) {
    const overlapsBreak =
      breakStart !== null && breakEnd !== null && t < breakEnd && t + duration > breakStart;
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
