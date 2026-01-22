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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          question_part_id: string
          score: number | null
          user_text: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          question_part_id: string
          score?: number | null
          user_text?: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          question_part_id?: string
          score?: number | null
          user_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_part_id_fkey"
            columns: ["question_part_id"]
            isOneToOne: false
            referencedRelation: "question_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          answered_parts_count: number | null
          finished_at: string | null
          id: string
          max_pauses: number | null
          mode: string
          pause_count: number | null
          started_at: string
          time_remaining_seconds: number | null
          timer_enabled: boolean | null
          timer_minutes: number | null
          total_characters: number | null
          total_parts_count: number | null
          total_paused_ms: number | null
          total_score: number | null
          user_id: string
        }
        Insert: {
          answered_parts_count?: number | null
          finished_at?: string | null
          id?: string
          max_pauses?: number | null
          mode: string
          pause_count?: number | null
          started_at?: string
          time_remaining_seconds?: number | null
          timer_enabled?: boolean | null
          timer_minutes?: number | null
          total_characters?: number | null
          total_parts_count?: number | null
          total_paused_ms?: number | null
          total_score?: number | null
          user_id: string
        }
        Update: {
          answered_parts_count?: number | null
          finished_at?: string | null
          id?: string
          max_pauses?: number | null
          mode?: string
          pause_count?: number | null
          started_at?: string
          time_remaining_seconds?: number | null
          timer_enabled?: boolean | null
          timer_minutes?: number | null
          total_characters?: number | null
          total_parts_count?: number | null
          total_paused_ms?: number | null
          total_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      correction_criteria: {
        Row: {
          created_at: string
          criteria_text: string
          id: string
          order_index: number
          subquestion_id: string
        }
        Insert: {
          created_at?: string
          criteria_text: string
          id?: string
          order_index?: number
          subquestion_id: string
        }
        Update: {
          created_at?: string
          criteria_text?: string
          id?: string
          order_index?: number
          subquestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "correction_criteria_subquestion_id_fkey"
            columns: ["subquestion_id"]
            isOneToOne: false
            referencedRelation: "subquestions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          convocatoria: string
          created_at: string
          id: string
          year: number
        }
        Insert: {
          convocatoria: string
          created_at?: string
          id?: string
          year: number
        }
        Update: {
          convocatoria?: string
          created_at?: string
          id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_parts: {
        Row: {
          correction_text: string
          created_at: string
          id: string
          label: string
          max_score: number
          order_index: number
          question_id: string
          statement: string
        }
        Insert: {
          correction_text: string
          created_at?: string
          id?: string
          label: string
          max_score?: number
          order_index?: number
          question_id: string
          statement: string
        }
        Update: {
          correction_text?: string
          created_at?: string
          id?: string
          label?: string
          max_score?: number
          order_index?: number
          question_id?: string
          statement?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_parts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          active: boolean
          block_id: string
          convocatoria: string | null
          created_at: string
          created_by: string | null
          exam_id: string | null
          has_image: boolean
          id: string
          image_url: string | null
          statement: string
          updated_at: string
          year: number | null
        }
        Insert: {
          active?: boolean
          block_id: string
          convocatoria?: string | null
          created_at?: string
          created_by?: string | null
          exam_id?: string | null
          has_image?: boolean
          id?: string
          image_url?: string | null
          statement: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          active?: boolean
          block_id?: string
          convocatoria?: string | null
          created_at?: string
          created_by?: string | null
          exam_id?: string | null
          has_image?: boolean
          id?: string
          image_url?: string | null
          statement?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          created_at: string
          id: string
          model_answer: string
          subquestion_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_answer: string
          subquestion_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model_answer?: string
          subquestion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solutions_subquestion_id_fkey"
            columns: ["subquestion_id"]
            isOneToOne: true
            referencedRelation: "subquestions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_answers: {
        Row: {
          answer_text: string
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      subquestions: {
        Row: {
          created_at: string
          id: string
          label: string
          order_index: number
          question_id: string
          statement: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          order_index?: number
          question_id: string
          statement: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          order_index?: number
          question_id?: string
          statement?: string
        }
        Relationships: [
          {
            foreignKeyName: "subquestions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "alumno" | "profesor" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["alumno", "profesor", "admin"],
    },
  },
} as const
