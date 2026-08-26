import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });
}

export function useSchool() {
  const { data: profile } = useProfile();
  const schoolId = profile?.school_id ?? null;
  return useQuery({
    queryKey: ["school", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase.from("schools").select("*").eq("id", schoolId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function listHook<T>(table: string, select: string, order?: string) {
  return function useList() {
    const { data: profile } = useProfile();
    const schoolId = profile?.school_id ?? null;
    return useQuery({
      queryKey: [table, schoolId],
      enabled: !!schoolId,
      queryFn: async () => {
        let query = supabase.from(table as never).select(select).eq("school_id", schoolId!);
        if (order) query = query.order(order);
        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []) as T[];
      },
    });
  };
}

export type Teacher = {
  id: string;
  school_id: string;
  full_name: string;
  email: string | null;
  max_hours_week: number;
  latest_end_time: string | null;
};
export type Subject = {
  id: string;
  school_id: string;
  name: string;
  color: string;
  requires_special_room: boolean;
  required_room_type: string | null;
};
export type ClassGroup = {
  id: string;
  school_id: string;
  name: string;
  level: string | null;
  headcount: number;
};
export type Room = {
  id: string;
  school_id: string;
  name: string;
  capacity: number;
  room_type: string;
};
export type ClassSubject = {
  id: string;
  school_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  hours_per_week: number;
};
export type Unavailability = {
  id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};
export type TimetableVersion = {
  id: string;
  school_id: string;
  label: string;
  status: string;
  is_public: boolean;
  public_token: string;
  generated_at: string;
};
export type TimetableEntry = {
  id: string;
  timetable_version_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  room_id: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

export type SchoolBreak = {
  id: string;
  school_id: string;
  label: string;
  start_time: string;
  end_time: string;
};

export const useTeachers = listHook<Teacher>("teachers", "*", "full_name");
export const useSubjects = listHook<Subject>("subjects", "*", "name");
export const useClasses = listHook<ClassGroup>("classes", "*", "name");
export const useRooms = listHook<Room>("rooms", "*", "name");
export const useClassSubjects = listHook<ClassSubject>("class_subjects", "*");
export const useVersions = listHook<TimetableVersion>("timetable_versions", "*");
export const useSchoolBreaks = listHook<SchoolBreak>("school_breaks", "*", "start_time");

export function useUnavailabilities() {
  const { data: profile } = useProfile();
  const schoolId = profile?.school_id ?? null;
  return useQuery({
    queryKey: ["teacher_unavailabilities", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase.from("teacher_unavailabilities").select("*");
      if (error) throw error;
      return (data ?? []) as Unavailability[];
    },
  });
}

export function useEntries(versionId: string | null) {
  return useQuery({
    queryKey: ["timetable_entries", versionId],
    enabled: !!versionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_entries")
        .select("*")
        .eq("timetable_version_id", versionId!);
      if (error) throw error;
      return (data ?? []) as TimetableEntry[];
    },
  });
}
