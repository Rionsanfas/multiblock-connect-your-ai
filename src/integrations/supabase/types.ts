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
          team_id: string | null
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
          team_id?: string | null
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
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ltd_inventory: {
        Row: {
          created_at: string
          id: string
          remaining_seats: number
          total_seats: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          remaining_seats?: number
          total_seats?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          remaining_seats?: number
          total_seats?: number
          updated_at?: string
        }
        Relationships: []
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
          billing_period: Database["public"]["Enums"]["billing_period"]
          checkout_url: string | null
          created_at: string
          description: string | null
          extra_boards: number
          features: Json | null
          id: string
          is_active: boolean | null
          is_lifetime: boolean
          max_api_keys: number
          max_blocks_per_board: number
          max_boards: number
          max_file_size_mb: number
          max_files_per_day: number
          max_images_per_day: number
          max_message_size_bytes: number
          max_messages_per_day: number
          max_seats: number
          name: string
          plan_type: string
          price_lifetime: number
          price_monthly: number
          price_yearly: number
          sort_order: number | null
          storage_mb: number
          tier: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at: string
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          checkout_url?: string | null
          created_at?: string
          description?: string | null
          extra_boards?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_lifetime?: boolean
          max_api_keys?: number
          max_blocks_per_board?: number
          max_boards?: number
          max_file_size_mb?: number
          max_files_per_day?: number
          max_images_per_day?: number
          max_message_size_bytes?: number
          max_messages_per_day?: number
          max_seats?: number
          name: string
          plan_type?: string
          price_lifetime?: number
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          storage_mb?: number
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"]
          checkout_url?: string | null
          created_at?: string
          description?: string | null
          extra_boards?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_lifetime?: boolean
          max_api_keys?: number
          max_blocks_per_board?: number
          max_boards?: number
          max_file_size_mb?: number
          max_files_per_day?: number
          max_images_per_day?: number
          max_message_size_bytes?: number
          max_messages_per_day?: number
          max_seats?: number
          name?: string
          plan_type?: string
          price_lifetime?: number
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          storage_mb?: number
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          block_id: string | null
          board_id: string | null
          created_at: string
          file_name: string
          file_size_bytes: number
          file_type: string
          id: string
          mime_type: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          block_id?: string | null
          board_id?: string | null
          created_at?: string
          file_name: string
          file_size_bytes: number
          file_type: string
          id?: string
          mime_type?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          block_id?: string | null
          board_id?: string | null
          created_at?: string
          file_name?: string
          file_size_bytes?: number
          file_type?: string
          id?: string
          mime_type?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploads_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_billing: {
        Row: {
          access_expires_at: string | null
          active_plan: string | null
          applied_addons: Json | null
          billing_type: string | null
          blocks: number | null
          boards: number | null
          created_at: string | null
          current_period_end: string | null
          is_lifetime: boolean | null
          last_event_id: string | null
          last_event_type: string | null
          plan_category: string | null
          polar_customer_id: string | null
          polar_subscription_id: string | null
          product_id: string | null
          product_price_id: string | null
          seats: number | null
          storage_gb: number | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          active_plan?: string | null
          applied_addons?: Json | null
          billing_type?: string | null
          blocks?: number | null
          boards?: number | null
          created_at?: string | null
          current_period_end?: string | null
          is_lifetime?: boolean | null
          last_event_id?: string | null
          last_event_type?: string | null
          plan_category?: string | null
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          product_id?: string | null
          product_price_id?: string | null
          seats?: number | null
          storage_gb?: number | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          active_plan?: string | null
          applied_addons?: Json | null
          billing_type?: string | null
          blocks?: number | null
          boards?: number | null
          created_at?: string | null
          current_period_end?: string | null
          is_lifetime?: boolean | null
          last_event_id?: string | null
          last_event_type?: string | null
          plan_category?: string | null
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          product_id?: string | null
          product_price_id?: string | null
          seats?: number | null
          storage_gb?: number | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
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
      user_storage_usage: {
        Row: {
          created_at: string
          files_bytes: number
          images_bytes: number
          last_calculated_at: string
          messages_bytes: number
          total_bytes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          files_bytes?: number
          images_bytes?: number
          last_calculated_at?: string
          messages_bytes?: number
          total_bytes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          files_bytes?: number
          images_bytes?: number
          last_calculated_at?: string
          messages_bytes?: number
          total_bytes?: number | null
          updated_at?: string
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
          files_used_today: number
          grace_expires_at: string | null
          grace_started_at: string | null
          grace_status: Database["public"]["Enums"]["grace_status"]
          id: string
          images_used_today: number
          messages_reset_at: string | null
          messages_used_today: number | null
          plan_id: string
          seats_used: number | null
          snapshot_max_api_keys: number | null
          snapshot_max_blocks_per_board: number | null
          snapshot_max_boards: number | null
          snapshot_max_file_size_mb: number | null
          snapshot_max_files_per_day: number | null
          snapshot_max_images_per_day: number | null
          snapshot_max_message_size_bytes: number | null
          snapshot_max_messages_per_day: number | null
          snapshot_max_seats: number | null
          snapshot_storage_mb: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          uploads_reset_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          files_used_today?: number
          grace_expires_at?: string | null
          grace_started_at?: string | null
          grace_status?: Database["public"]["Enums"]["grace_status"]
          id?: string
          images_used_today?: number
          messages_reset_at?: string | null
          messages_used_today?: number | null
          plan_id: string
          seats_used?: number | null
          snapshot_max_api_keys?: number | null
          snapshot_max_blocks_per_board?: number | null
          snapshot_max_boards?: number | null
          snapshot_max_file_size_mb?: number | null
          snapshot_max_files_per_day?: number | null
          snapshot_max_images_per_day?: number | null
          snapshot_max_message_size_bytes?: number | null
          snapshot_max_messages_per_day?: number | null
          snapshot_max_seats?: number | null
          snapshot_storage_mb?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          uploads_reset_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          files_used_today?: number
          grace_expires_at?: string | null
          grace_started_at?: string | null
          grace_status?: Database["public"]["Enums"]["grace_status"]
          id?: string
          images_used_today?: number
          messages_reset_at?: string | null
          messages_used_today?: number | null
          plan_id?: string
          seats_used?: number | null
          snapshot_max_api_keys?: number | null
          snapshot_max_blocks_per_board?: number | null
          snapshot_max_boards?: number | null
          snapshot_max_file_size_mb?: number | null
          snapshot_max_files_per_day?: number | null
          snapshot_max_images_per_day?: number | null
          snapshot_max_message_size_bytes?: number | null
          snapshot_max_messages_per_day?: number | null
          snapshot_max_seats?: number | null
          snapshot_storage_mb?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          uploads_reset_at?: string | null
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
      _internal_get_team_max_seats: {
        Args: { p_team_id: string }
        Returns: number
      }
      _internal_get_team_seat_count: {
        Args: { p_team_id: string }
        Returns: number
      }
      _internal_is_team_admin_or_owner: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      _internal_is_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      _internal_is_team_owner: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      accept_team_invitation: {
        Args: { p_token: string }
        Returns: {
          error_message: string
          success: boolean
          team_id: string
          team_name: string
        }[]
      }
      atomic_increment_daily_counter: {
        Args: { p_counter_type: string; p_user_id: string }
        Returns: boolean
      }
      atomic_storage_increment: {
        Args: {
          p_files_delta?: number
          p_images_delta?: number
          p_messages_delta?: number
          p_user_id: string
        }
        Returns: undefined
      }
      can_add_api_key: { Args: { p_user_id: string }; Returns: boolean }
      can_create_block: {
        Args: { p_board_id: string; p_user_id: string }
        Returns: boolean
      }
      can_create_board: { Args: { p_user_id: string }; Returns: boolean }
      can_send_message: {
        Args: { p_message_size_bytes?: number; p_user_id: string }
        Returns: boolean
      }
      can_upload_file: {
        Args: { p_file_size_bytes?: number; p_user_id: string }
        Returns: boolean
      }
      can_upload_image: {
        Args: { p_file_size_bytes?: number; p_user_id: string }
        Returns: boolean
      }
      create_team: { Args: { p_name: string; p_slug: string }; Returns: string }
      create_team_invitation: {
        Args: {
          p_email: string
          p_role?: Database["public"]["Enums"]["team_role"]
          p_team_id: string
        }
        Returns: string
      }
      decrement_ltd_seats: { Args: never; Returns: number }
      delete_team: { Args: { p_team_id: string }; Returns: boolean }
      delete_team_invitation: {
        Args: { p_invitation_id: string }
        Returns: boolean
      }
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
      get_enforcement_status: {
        Args: { p_user_id: string }
        Returns: {
          api_keys_used: number
          blocks_used: number
          boards_remaining: number
          boards_used: number
          can_add_api_key: boolean
          can_create_board: boolean
          can_send_message: boolean
          can_upload_file: boolean
          can_upload_image: boolean
          files_remaining: number
          files_used_today: number
          grace_expires_at: string
          grace_status: Database["public"]["Enums"]["grace_status"]
          images_remaining: number
          images_used_today: number
          is_in_grace_period: boolean
          max_api_keys: number
          max_blocks_per_board: number
          max_boards: number
          max_file_size_mb: number
          max_files_per_day: number
          max_images_per_day: number
          max_message_size_bytes: number
          max_messages_per_day: number
          messages_remaining: number
          messages_used_today: number
          plan_name: string
          storage_mb: number
          storage_remaining_mb: number
          storage_used_bytes: number
          storage_used_mb: number
          tier: Database["public"]["Enums"]["subscription_tier"]
        }[]
      }
      get_ltd_inventory: {
        Args: never
        Returns: {
          remaining_seats: number
          total_seats: number
        }[]
      }
      get_team_limits: {
        Args: { p_team_id: string }
        Returns: {
          current_boards: number
          current_seats: number
          max_blocks_per_board: number
          max_boards: number
          max_seats: number
          storage_gb: number
        }[]
      }
      get_team_max_seats: { Args: { p_team_id: string }; Returns: number }
      get_team_seat_count: { Args: { p_team_id: string }; Returns: number }
      get_user_api_key_count: { Args: { p_user_id: string }; Returns: number }
      get_user_board_count: { Args: { p_user_id: string }; Returns: number }
      get_user_effective_limits: {
        Args: { p_user_id: string }
        Returns: {
          addon_extra_boards: number
          addon_extra_storage_mb: number
          grace_expires_at: string
          grace_status: Database["public"]["Enums"]["grace_status"]
          max_api_keys: number
          max_blocks_per_board: number
          max_boards: number
          max_file_size_mb: number
          max_files_per_day: number
          max_images_per_day: number
          max_message_size_bytes: number
          max_messages_per_day: number
          max_seats: number
          storage_mb: number
        }[]
      }
      get_user_entitlements: {
        Args: { p_user_id: string }
        Returns: {
          blocks_unlimited: boolean
          boards_limit: number
          extra_boards: number
          extra_storage_gb: number
          seats: number
          source_plan: string
          storage_gb: number
          total_boards: number
          total_storage_gb: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_subscription: {
        Args: { p_user_id: string }
        Returns: {
          current_period_end: string
          grace_status: Database["public"]["Enums"]["grace_status"]
          max_api_keys: number
          max_blocks_per_board: number
          max_boards: number
          max_messages_per_day: number
          max_seats: number
          messages_used_today: number
          plan_id: string
          plan_name: string
          status: Database["public"]["Enums"]["subscription_status"]
          storage_mb: number
          subscription_id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }[]
      }
      get_user_team_role: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["team_role"]
      }
      get_user_teams: {
        Args: { p_user_id: string }
        Returns: {
          board_count: number
          is_owner: boolean
          member_count: number
          team_id: string
          team_name: string
          team_slug: string
          user_role: Database["public"]["Enums"]["team_role"]
        }[]
      }
      get_user_usage_stats: {
        Args: { p_user_id: string }
        Returns: {
          api_keys_used: number
          blocks_used: number
          boards_used: number
          files_used_today: number
          images_used_today: number
          messages_used_today: number
          storage_used_bytes: number
          storage_used_mb: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_team_role: {
        Args: {
          p_role: Database["public"]["Enums"]["team_role"]
          p_team_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      increment_message_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_in_grace: { Args: { p_user_id: string }; Returns: boolean }
      is_team_admin_or_owner: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      recalculate_user_storage: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      remove_team_member: {
        Args: { p_member_user_id: string; p_team_id: string }
        Returns: boolean
      }
      reset_daily_usage: { Args: never; Returns: undefined }
      team_can_add_member: { Args: { p_team_id: string }; Returns: boolean }
      transfer_board_to_team: {
        Args: { p_board_id: string; p_team_id: string }
        Returns: boolean
      }
      transfer_team_ownership: {
        Args: { p_new_owner_id: string; p_team_id: string }
        Returns: boolean
      }
      update_team_member_role: {
        Args: {
          p_member_user_id: string
          p_new_role: Database["public"]["Enums"]["team_role"]
          p_team_id: string
        }
        Returns: boolean
      }
      update_user_grace_status: {
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
      billing_period: "monthly" | "yearly" | "lifetime" | "one_time"
      grace_status:
        | "none"
        | "exceeded_boards"
        | "exceeded_storage"
        | "exceeded_both"
        | "expired"
      llm_provider: "openai" | "anthropic" | "google" | "xai" | "deepseek"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "paused"
      subscription_tier: "free" | "pro" | "team" | "enterprise" | "starter"
      team_role: "owner" | "admin" | "member"
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
      billing_period: ["monthly", "yearly", "lifetime", "one_time"],
      grace_status: [
        "none",
        "exceeded_boards",
        "exceeded_storage",
        "exceeded_both",
        "expired",
      ],
      llm_provider: ["openai", "anthropic", "google", "xai", "deepseek"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "paused",
      ],
      subscription_tier: ["free", "pro", "team", "enterprise", "starter"],
      team_role: ["owner", "admin", "member"],
    },
  },
} as const
