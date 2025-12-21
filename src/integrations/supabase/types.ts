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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string
          id: string
          is_valid: boolean | null
          key_hint: string | null
          last_validated_at: string | null
          provider: Database["public"]["Enums"]["llm_provider"]
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          id?: string
          is_valid?: boolean | null
          key_hint?: string | null
          last_validated_at?: string | null
          provider: Database["public"]["Enums"]["llm_provider"]
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          id?: string
          is_valid?: boolean | null
          key_hint?: string | null
          last_validated_at?: string | null
          provider?: Database["public"]["Enums"]["llm_provider"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      block_connections: {
        Row: {
          created_at: string
          id: string
          label: string | null
          source_block_id: string
          target_block_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          source_block_id: string
          target_block_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          source_block_id?: string
          target_block_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_connections_source_block_id_fkey"
            columns: ["source_block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_connections_target_block_id_fkey"
            columns: ["target_block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          board_id: string
          color: string | null
          created_at: string
          height: number | null
          id: string
          is_collapsed: boolean | null
          model_id: string
          position_x: number
          position_y: number
          provider: Database["public"]["Enums"]["llm_provider"]
          system_prompt: string | null
          title: string | null
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          board_id: string
          color?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_collapsed?: boolean | null
          model_id: string
          position_x?: number
          position_y?: number
          provider: Database["public"]["Enums"]["llm_provider"]
          system_prompt?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          board_id?: string
          color?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_collapsed?: boolean | null
          model_id?: string
          position_x?: number
          position_y?: number
          provider?: Database["public"]["Enums"]["llm_provider"]
          system_prompt?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          canvas_position_x: number | null
          canvas_position_y: number | null
          canvas_zoom: number | null
          created_at: string
          description: string | null
          id: string
          is_archived: boolean | null
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_position_x?: number | null
          canvas_position_y?: number | null
          canvas_zoom?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_position_x?: number | null
          canvas_position_y?: number | null
          canvas_zoom?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          block_id: string
          content: string
          created_at: string
          id: string
          meta: Json | null
          role: string
          size_bytes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block_id: string
          content: string
          created_at?: string
          id?: string
          meta?: Json | null
          role: string
          size_bytes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block_id?: string
          content?: string
          created_at?: string
          id?: string
          meta?: Json | null
          role?: string
          size_bytes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_api_keys: number
          max_blocks_per_board: number
          max_boards: number
          max_messages_per_day: number
          max_seats: number
          name: string
          price_monthly: number
          price_yearly: number
          sort_order: number | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_api_keys?: number
          max_blocks_per_board?: number
          max_boards?: number
          max_messages_per_day?: number
          max_seats?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_api_keys?: number
          max_blocks_per_board?: number
          max_boards?: number
          max_messages_per_day?: number
          max_seats?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          messages_reset_at: string | null
          messages_used_today: number | null
          plan_id: string
          seats_used: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          messages_reset_at?: string | null
          messages_used_today?: number | null
          plan_id: string
          seats_used?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          messages_reset_at?: string | null
          messages_used_today?: number | null
          plan_id?: string
          seats_used?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_block: {
        Args: { p_board_id: string; p_user_id: string }
        Returns: boolean
      }
      can_create_board: { Args: { p_user_id: string }; Returns: boolean }
      can_send_message: { Args: { p_user_id: string }; Returns: boolean }
      get_block_incoming_connections: {
        Args: { p_block_id: string }
        Returns: {
          connection_id: string
          source_block_id: string
          source_model_id: string
          source_provider: Database["public"]["Enums"]["llm_provider"]
          source_title: string
        }[]
      }
      get_board_block_count: { Args: { p_board_id: string }; Returns: number }
      get_user_api_key_count: { Args: { p_user_id: string }; Returns: number }
      get_user_board_count: { Args: { p_user_id: string }; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_subscription: {
        Args: { p_user_id: string }
        Returns: {
          current_period_end: string
          max_api_keys: number
          max_blocks_per_board: number
          max_boards: number
          max_messages_per_day: number
          max_seats: number
          messages_used_today: number
          plan_id: string
          plan_name: string
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_message_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      user_has_api_key: {
        Args: {
          p_provider: Database["public"]["Enums"]["llm_provider"]
          p_user_id: string
        }
        Returns: boolean
      }
      user_owns_block: {
        Args: { p_block_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
      llm_provider: "openai" | "anthropic" | "google" | "xai" | "deepseek"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "paused"
      subscription_tier: "free" | "pro" | "team" | "enterprise"
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
      app_role: ["user", "admin", "super_admin"],
      llm_provider: ["openai", "anthropic", "google", "xai", "deepseek"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "paused",
      ],
      subscription_tier: ["free", "pro", "team", "enterprise"],
    },
  },
} as const
