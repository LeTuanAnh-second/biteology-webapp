export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      content: {
        Row: {
          content: string | null
          content_type: string | null
          created_at: string | null
          created_by: number | null
          id: number
          last_modifieddate: string | null
          like_count: number | null
          picture: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: number | null
          id: number
          last_modifieddate?: string | null
          like_count?: number | null
          picture?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          created_by?: number | null
          id?: number
          last_modifieddate?: string | null
          like_count?: number | null
          picture?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          content: string | null
          content_id: number | null
          created_by: number | null
          created_date: string | null
          id: number
          is_liked: boolean | null
          user_id: number | null
        }
        Insert: {
          content?: string | null
          content_id?: number | null
          created_by?: number | null
          created_date?: string | null
          id: number
          is_liked?: boolean | null
          user_id?: number | null
        }
        Update: {
          content?: string | null
          content_id?: number | null
          created_by?: number | null
          created_date?: string | null
          id?: number
          is_liked?: boolean | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_feedback_content"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_feedback_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      food: {
        Row: {
          description: string | null
          id: number
          name: string
          recipes: string | null
          type_of_disease_id: number | null
        }
        Insert: {
          description?: string | null
          id?: never
          name: string
          recipes?: string | null
          type_of_disease_id?: number | null
        }
        Update: {
          description?: string | null
          id?: never
          name?: string
          recipes?: string | null
          type_of_disease_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_food_typeofdisease"
            columns: ["type_of_disease_id"]
            isOneToOne: false
            referencedRelation: "type_of_disease"
            referencedColumns: ["id"]
          },
        ]
      }
      health_record: {
        Row: {
          blood_pressure: string | null
          blood_sugar: number | null
          bmi: number | null
          cholesterol_level: number | null
          field1: string | null
          field2: string | null
          field3: string | null
          id: number
          recorded_date: string | null
          user_id: number | null
          weight: number | null
        }
        Insert: {
          blood_pressure?: string | null
          blood_sugar?: number | null
          bmi?: number | null
          cholesterol_level?: number | null
          field1?: string | null
          field2?: string | null
          field3?: string | null
          id: number
          recorded_date?: string | null
          user_id?: number | null
          weight?: number | null
        }
        Update: {
          blood_pressure?: string | null
          blood_sugar?: number | null
          bmi?: number | null
          cholesterol_level?: number | null
          field1?: string | null
          field2?: string | null
          field3?: string | null
          id?: number
          recorded_date?: string | null
          user_id?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_healthrecord_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          id: number
          name: string | null
        }
        Insert: {
          id: number
          name?: string | null
        }
        Update: {
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_detail: {
        Row: {
          end_date: string | null
          id: number
          package_id: number | null
          plan_name: string | null
          start_date: string | null
          status: string | null
          user_id: number | null
        }
        Insert: {
          end_date?: string | null
          id: number
          package_id?: number | null
          plan_name?: string | null
          start_date?: string | null
          status?: string | null
          user_id?: number | null
        }
        Update: {
          end_date?: string | null
          id?: number
          package_id?: number | null
          plan_name?: string | null
          start_date?: string | null
          status?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscription_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      type_of_disease: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: never
          name: string
        }
        Update: {
          id?: never
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          created_date: string
          date_of_birth: string | null
          email: string
          fullname: string | null
          health_condition: string | null
          id: number
          last_modifieddate: string | null
          password: string
          role: string | null
          status: string | null
          subscription_status: string | null
          uuid: string | null
        }
        Insert: {
          avatar?: string | null
          created_date?: string
          date_of_birth?: string | null
          email: string
          fullname?: string | null
          health_condition?: string | null
          id?: never
          last_modifieddate?: string | null
          password: string
          role?: string | null
          status?: string | null
          subscription_status?: string | null
          uuid?: string | null
        }
        Update: {
          avatar?: string | null
          created_date?: string
          date_of_birth?: string | null
          email?: string
          fullname?: string | null
          health_condition?: string | null
          id?: never
          last_modifieddate?: string | null
          password?: string
          role?: string | null
          status?: string | null
          subscription_status?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
