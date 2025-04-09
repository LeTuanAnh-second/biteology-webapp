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
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      food_categories: {
        Row: {
          category_id: number
          created_at: string | null
          food_id: number
        }
        Insert: {
          category_id: number
          created_at?: string | null
          food_id: number
        }
        Update: {
          category_id?: number
          created_at?: string | null
          food_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_categories_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          name: string
          recipe: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          name: string
          recipe?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          name?: string
          recipe?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      nutrition_chat_logs: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          id?: string
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          user_id?: string
          user_message?: string
        }
        Relationships: []
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
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_id: string | null
          payment_id: string | null
          payment_method: string
          plan_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          payment_method: string
          plan_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          payment_method?: string
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_plans: {
        Row: {
          created_at: string | null
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_days: number
          features?: Json | null
          id?: string
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_premium?: boolean | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          phone_number?: string | null
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
      transaction_proofs: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          order_id: string
          payment_method: string
          transaction_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id: string
          payment_method: string
          transaction_id: string
          verified_at: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          payment_method?: string
          transaction_id?: string
          verified_at?: string
        }
        Relationships: []
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
      user_disease_categories: {
        Row: {
          category_id: number
          created_at: string | null
          user_id: string
        }
        Insert: {
          category_id: number
          created_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: number
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_disease_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          plan_id: string
          start_date: string
          status: string
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          plan_id: string
          start_date?: string
          status?: string
          transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          plan_id?: string
          start_date?: string
          status?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
