ALTER TABLE public.schools RENAME COLUMN break_start_time TO lunch_start_time;
ALTER TABLE public.schools RENAME COLUMN break_end_time TO lunch_end_time;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS lunch_enabled boolean NOT NULL DEFAULT true;
UPDATE public.schools SET lunch_enabled = (lunch_start_time IS NOT NULL AND lunch_end_time IS NOT NULL);

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS color_index integer NOT NULL DEFAULT 0;

ALTER TABLE public.timetable_versions ADD COLUMN IF NOT EXISTS success boolean NOT NULL DEFAULT true;
ALTER TABLE public.timetable_versions ADD COLUMN IF NOT EXISTS unplaced_count integer NOT NULL DEFAULT 0;