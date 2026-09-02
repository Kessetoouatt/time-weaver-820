export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      class_subjects: {
        Row: {
          class_id: string
          hours_per_week: number
          id: string
          school_id: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          hours_per_week?: number
          id?: string
          school_id: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          hours_per_week?: number
          id?: string
          school_id?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          headcount: number
          id: string
          level: string | null
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          headcount?: number
          id?: string
          level?: string | null
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          headcount?: number
          id?: string
          level?: string | null
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          school_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          school_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          id: string
          name: string
          room_type: string
          school_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          name: string
          room_type?: string
          school_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          room_type?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_breaks: {
        Row: {
          created_at: string
          end_time: string
          id: string
          label: string
          school_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          label?: string
          school_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          label?: string
          school_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_breaks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          day_end_time: string
          day_start_time: string
          days_of_week: string[]
          email: string | null
          head_name: string | null
          id: string
          logo_url: string | null
          lunch_enabled: boolean
          lunch_end_time: string | null
          lunch_start_time: string | null
          name: string
          phone: string | null
          reference_code: string | null
          slot_duration_minutes: number
          type: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          day_end_time?: string
          day_start_time?: string
          days_of_week?: string[]
          email?: string | null
          head_name?: string | null
          id?: string
          logo_url?: string | null
          lunch_enabled?: boolean
          lunch_end_time?: string | null
          lunch_start_time?: string | null
          name: string
          phone?: string | null
          reference_code?: string | null
          slot_duration_minutes?: number
          type?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          day_end_time?: string
          day_start_time?: string
          days_of_week?: string[]
          email?: string | null
          head_name?: string | null
          id?: string
          logo_url?: string | null
          lunch_enabled?: boolean
          lunch_end_time?: string | null
          lunch_start_time?: string | null
          name?: string
          phone?: string | null
          reference_code?: string | null
          slot_duration_minutes?: number
          type?: string
          website?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string
          color_index: number
          created_at: string
          id: string
          name: string
          required_room_type: string | null
          requires_special_room: boolean
          school_id: string
        }
        Insert: {
          color?: string
          color_index?: number
          created_at?: string
          id?: string
          name: string
          required_room_type?: string | null
          requires_special_room?: boolean
          school_id: string
        }
        Update: {
          color?: string
          color_index?: number
          created_at?: string
          id?: string
          name?: string
          required_room_type?: string | null
          requires_special_room?: boolean
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          id?: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_unavailabilities: {
        Row: {
          day_of_week: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
          teacher_id: string
        }
        Insert: {
          day_of_week: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          teacher_id: string
        }
        Update: {
          day_of_week?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_unavailabilities_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          latest_end_time: string | null
          max_hours_week: number
          school_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          latest_end_time?: string | null
          max_hours_week?: number
          school_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          latest_end_time?: string | null
          max_hours_week?: number
          school_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_entries: {
        Row: {
          class_id: string
          day_of_week: string
          end_time: string
          id: string
          room_id: string | null
          school_id: string
          start_time: string
          subject_id: string
          teacher_id: string | null
          timetable_version_id: string
        }
        Insert: {
          class_id: string
          day_of_week: string
          end_time: string
          id?: string
          room_id?: string | null
          school_id: string
          start_time: string
          subject_id: string
          teacher_id?: string | null
          timetable_version_id: string
        }
        Update: {
          class_id?: string
          day_of_week?: string
          end_time?: string
          id?: string
          room_id?: string | null
          school_id?: string
          start_time?: string
          subject_id?: string
          teacher_id?: string | null
          timetable_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_timetable_version_id_fkey"
            columns: ["timetable_version_id"]
            isOneToOne: false
            referencedRelation: "timetable_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_versions: {
        Row: {
          generated_at: string
          id: string
          is_public: boolean
          label: string
          public_token: string
          school_id: string
          status: string
          success: boolean
          unplaced_count: number
        }
        Insert: {
          generated_at?: string
          id?: string
          is_public?: boolean
          label?: string
          public_token?: string
          school_id: string
          status?: string
          success?: boolean
          unplaced_count?: number
        }
        Update: {
          generated_at?: string
          id?: string
          is_public?: boolean
          label?: string
          public_token?: string
          school_id?: string
          status?: string
          success?: boolean
          unplaced_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "timetable_versions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage: { Args: never; Returns: boolean }
      create_school_and_join: {
        Args: {
          _break_end?: string
          _break_start?: string
          _days: string[]
          _end: string
          _name: string
          _slot: number
          _start: string
          _type: string
        }
        Returns: string
      }
      current_school_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      seed_default_subjects: {
        Args: { _school_id: string }
        Returns: undefined
      }
      time_to_min: { Args: { t: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "gestionnaire" | "enseignant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestionnaire", "enseignant"],
    },
  },
} as const
