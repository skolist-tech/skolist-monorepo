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
      activities: {
        Row: {
          created_at: string
          id: string
          name: string
          product_type: Database["public"]["Enums"]["product_type_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          product_type: Database["public"]["Enums"]["product_type_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_type?: Database["public"]["Enums"]["product_type_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_questions: {
        Row: {
          answer_text: string
          correct_mcq_option: number | null
          created_at: string
          explanation: string | null
          figure: string | null
          hardness_level:
            | Database["public"]["Enums"]["hardness_level_enum"]
            | null
          id: string
          marks: number | null
          msq_option1_answer: boolean | null
          msq_option2_answer: boolean | null
          msq_option3_answer: boolean | null
          msq_option4_answer: boolean | null
          option1: string | null
          option2: string | null
          option3: string | null
          option4: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type_enum"]
          reference: string | null
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          answer_text: string
          correct_mcq_option?: number | null
          created_at?: string
          explanation?: string | null
          figure?: string | null
          hardness_level?:
            | Database["public"]["Enums"]["hardness_level_enum"]
            | null
          id?: string
          marks?: number | null
          msq_option1_answer?: boolean | null
          msq_option2_answer?: boolean | null
          msq_option3_answer?: boolean | null
          msq_option4_answer?: boolean | null
          option1?: string | null
          option2?: string | null
          option3?: string | null
          option4?: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type_enum"]
          reference?: string | null
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          answer_text?: string
          correct_mcq_option?: number | null
          created_at?: string
          explanation?: string | null
          figure?: string | null
          hardness_level?:
            | Database["public"]["Enums"]["hardness_level_enum"]
            | null
          id?: string
          marks?: number | null
          msq_option1_answer?: boolean | null
          msq_option2_answer?: boolean | null
          msq_option3_answer?: boolean | null
          msq_option4_answer?: boolean | null
          option1?: string | null
          option2?: string | null
          option3?: string | null
          option4?: string | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type_enum"]
          reference?: string | null
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_questions_concepts_maps: {
        Row: {
          bank_question_id: string
          concept_id: string
          created_at: string
          id: string
        }
        Insert: {
          bank_question_id?: string
          concept_id?: string
          created_at?: string
          id?: string
        }
        Update: {
          bank_question_id?: string
          concept_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_questions_concepts_maps_bank_question_id_fkey"
            columns: ["bank_question_id"]
            isOneToOne: false
            referencedRelation: "bank_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_questions_concepts_maps_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          position: number | null
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number | null
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          page_number: number
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          page_number: number
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          page_number?: number
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts_activities_maps: {
        Row: {
          activity_id: string | null
          concept_id: string | null
          created_at: string
          id: number
        }
        Insert: {
          activity_id?: string | null
          concept_id?: string | null
          created_at?: string
          id?: number
        }
        Update: {
          activity_id?: string | null
          concept_id?: string | null
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "concepts_activities_maps_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concepts_activities_maps_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      gen_artifacts: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          name: string
          source_url: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          name: string
          source_url: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          name?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gen_artifacts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      gen_images: {
        Row: {
          created_at: string
          gen_question_id: string | null
          id: string
          img_url: string | null
          position: number | null
          svg_string: string | null
        }
        Insert: {
          created_at?: string
          gen_question_id?: string | null
          id?: string
          img_url?: string | null
          position?: number | null
          svg_string?: string | null
        }
        Update: {
          created_at?: string
          gen_question_id?: string | null
          id?: string
          img_url?: string | null
          position?: number | null
          svg_string?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gen_images_gen_question_id_fkey"
            columns: ["gen_question_id"]
            isOneToOne: false
            referencedRelation: "gen_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      gen_questions: {
        Row: {
          activity_id: string
          answer_text: string | null
          correct_mcq_option: number | null
          created_at: string
          explanation: string | null
          hardness_level: Database["public"]["Enums"]["hardness_level_enum"]
          id: string
          is_in_draft: boolean
          is_page_break_below: boolean
          marks: number
          msq_option1_answer: boolean | null
          msq_option2_answer: boolean | null
          msq_option3_answer: boolean | null
          msq_option4_answer: boolean | null
          option1: string | null
          option2: string | null
          option3: string | null
          option4: string | null
          position_in_section: number | null
          qgen_draft_section_id: string | null
          question_text: string | null
          question_type: Database["public"]["Enums"]["question_type_enum"]
          updated_at: string
        }
        Insert: {
          activity_id: string
          answer_text?: string | null
          correct_mcq_option?: number | null
          created_at?: string
          explanation?: string | null
          hardness_level: Database["public"]["Enums"]["hardness_level_enum"]
          id?: string
          is_in_draft?: boolean
          is_page_break_below?: boolean
          marks: number
          msq_option1_answer?: boolean | null
          msq_option2_answer?: boolean | null
          msq_option3_answer?: boolean | null
          msq_option4_answer?: boolean | null
          option1?: string | null
          option2?: string | null
          option3?: string | null
          option4?: string | null
          position_in_section?: number | null
          qgen_draft_section_id?: string | null
          question_text?: string | null
          question_type: Database["public"]["Enums"]["question_type_enum"]
          updated_at?: string
        }
        Update: {
          activity_id?: string
          answer_text?: string | null
          correct_mcq_option?: number | null
          created_at?: string
          explanation?: string | null
          hardness_level?: Database["public"]["Enums"]["hardness_level_enum"]
          id?: string
          is_in_draft?: boolean
          is_page_break_below?: boolean
          marks?: number
          msq_option1_answer?: boolean | null
          msq_option2_answer?: boolean | null
          msq_option3_answer?: boolean | null
          msq_option4_answer?: boolean | null
          option1?: string | null
          option2?: string | null
          option3?: string | null
          option4?: string | null
          position_in_section?: number | null
          qgen_draft_section_id?: string | null
          question_text?: string | null
          question_type?: Database["public"]["Enums"]["question_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gen_questions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gen_questions_qgen_draft_section_id_fkey"
            columns: ["qgen_draft_section_id"]
            isOneToOne: false
            referencedRelation: "qgen_draft_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      gen_questions_concepts_maps: {
        Row: {
          concept_id: string
          created_at: string
          gen_question_id: string
          id: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          gen_question_id: string
          id?: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          gen_question_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gen_questions_concepts_maps_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gen_questions_concepts_maps_gen_question_id_fkey"
            columns: ["gen_question_id"]
            isOneToOne: false
            referencedRelation: "gen_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          address: string | null
          board_id: string | null
          created_at: string
          email: string
          header_line: string | null
          id: string
          logo_url: string | null
          org_type: string | null
          phone_num: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          board_id?: string | null
          created_at?: string
          email: string
          header_line?: string | null
          id?: string
          logo_url?: string | null
          org_type?: string | null
          phone_num: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          board_id?: string | null
          created_at?: string
          email?: string
          header_line?: string | null
          id?: string
          logo_url?: string | null
          org_type?: string | null
          phone_num?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orgs_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      qgen_draft_instructions_drafts_maps: {
        Row: {
          created_at: string
          id: string
          instruction_text: string | null
          qgen_draft_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instruction_text?: string | null
          qgen_draft_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instruction_text?: string | null
          qgen_draft_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qgen_draft_instructions_users_maps_qgen_draft_id_fkey"
            columns: ["qgen_draft_id"]
            isOneToOne: false
            referencedRelation: "qgen_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qgen_draft_instructions_users_maps_qgen_draft_id_fkey1"
            columns: ["qgen_draft_id"]
            isOneToOne: false
            referencedRelation: "qgen_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      qgen_draft_sections: {
        Row: {
          created_at: string
          id: string
          position_in_draft: number
          qgen_draft_id: string | null
          section_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          position_in_draft?: number
          qgen_draft_id?: string | null
          section_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          position_in_draft?: number
          qgen_draft_id?: string | null
          section_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qgen_draft_sections_qgen_draft_id_fkey"
            columns: ["qgen_draft_id"]
            isOneToOne: false
            referencedRelation: "qgen_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      qgen_drafts: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          institute_name: string | null
          logo_url: string | null
          maximum_marks: number | null
          paper_datetime: string | null
          paper_duration: string | null
          paper_subtitle: string | null
          paper_title: string | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          institute_name?: string | null
          logo_url?: string | null
          maximum_marks?: number | null
          paper_datetime?: string | null
          paper_duration?: string | null
          paper_subtitle?: string | null
          paper_title?: string | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          institute_name?: string | null
          logo_url?: string | null
          maximum_marks?: number | null
          paper_datetime?: string | null
          paper_duration?: string | null
          paper_subtitle?: string | null
          paper_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qgen_drafts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      school_classes: {
        Row: {
          board_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          board_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position: number
          updated_at?: string
        }
        Update: {
          board_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_class_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_class_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_class_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_class_id_fkey"
            columns: ["school_class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          chapter_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position: number
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          credits: number
          email: string | null
          id: string
          last_active_at: string
          name: string | null
          org_id: string | null
          phone_num: string | null
          updated_at: string
          user_entered_school_address: string | null
          user_entered_school_board: string | null
          user_entered_school_name: string | null
          user_type: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          id: string
          last_active_at?: string
          name?: string | null
          org_id?: string | null
          phone_num?: string | null
          updated_at?: string
          user_entered_school_address?: string | null
          user_entered_school_board?: string | null
          user_entered_school_name?: string | null
          user_type: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          id?: string
          last_active_at?: string
          name?: string | null
          org_id?: string | null
          phone_num?: string | null
          updated_at?: string
          user_entered_school_address?: string | null
          user_entered_school_board?: string | null
          user_entered_school_name?: string | null
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      hardness_level_enum: "easy" | "medium" | "hard"
      product_type_enum: "qgen" | "ai_tutor"
      question_type_enum:
        | "mcq4"
        | "msq4"
        | "short_answer"
        | "true_or_false"
        | "fill_in_the_blanks"
        | "long_answer"
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
      hardness_level_enum: ["easy", "medium", "hard"],
      product_type_enum: ["qgen", "ai_tutor"],
      question_type_enum: [
        "mcq4",
        "msq4",
        "short_answer",
        "true_or_false",
        "fill_in_the_blanks",
        "long_answer",
      ],
    },
  },
} as const
