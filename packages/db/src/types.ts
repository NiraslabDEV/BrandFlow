Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      credit_wallets: {
        Row: {
          balance: number
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_wallets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_log: {
        Row: {
          created_at: string
          id: number
          payload: Json
          tenant_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          payload: Json
          tenant_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          payload?: Json
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          credits_provider: string
          ga4_measurement_id: string | null
          gads_conversion_id: string | null
          gads_conversion_label: string | null
          gads_developer_token: string | null
          gtm_container_id: string | null
          id: number
          meta_capi_token: string | null
          meta_pixel_id: string | null
          paysuite_api_key: string | null
          paysuite_webhook_secret: string | null
          resend_api_key: string | null
          subscription_provider: string
          updated_at: string
          zumbopay_api_key: string | null
          zumbopay_merchant_id: string | null
          zumbopay_wallet_id: string | null
          zumbopay_webhook_secret: string | null
        }
        Insert: {
          credits_provider?: string
          ga4_measurement_id?: string | null
          gads_conversion_id?: string | null
          gads_conversion_label?: string | null
          gads_developer_token?: string | null
          gtm_container_id?: string | null
          id?: number
          meta_capi_token?: string | null
          meta_pixel_id?: string | null
          paysuite_api_key?: string | null
          paysuite_webhook_secret?: string | null
          resend_api_key?: string | null
          subscription_provider?: string
          updated_at?: string
          zumbopay_api_key?: string | null
          zumbopay_merchant_id?: string | null
          zumbopay_wallet_id?: string | null
          zumbopay_webhook_secret?: string | null
        }
        Update: {
          credits_provider?: string
          ga4_measurement_id?: string | null
          gads_conversion_id?: string | null
          gads_conversion_label?: string | null
          gads_developer_token?: string | null
          gtm_container_id?: string | null
          id?: number
          meta_capi_token?: string | null
          meta_pixel_id?: string | null
          paysuite_api_key?: string | null
          paysuite_webhook_secret?: string | null
          resend_api_key?: string | null
          subscription_provider?: string
          updated_at?: string
          zumbopay_api_key?: string | null
          zumbopay_merchant_id?: string | null
          zumbopay_wallet_id?: string | null
          zumbopay_webhook_secret?: string | null
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          brand_colors: Json | null
          close_hour: number
          created_at: string
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          open_hour: number
          photos: Json | null
          slug: string
          tenant_id: string
          timezone: string
        }
        Insert: {
          brand_colors?: Json | null
          close_hour?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          open_hour?: number
          photos?: Json | null
          slug: string
          tenant_id: string
          timezone?: string
        }
        Update: {
          brand_colors?: Json | null
          close_hour?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          open_hour?: number
          photos?: Json | null
          slug?: string
          tenant_id?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          deleted_at: string | null
          grace_until: string | null
          id: string
          name: string
          plan: string
          slug: string
          status: string
          trial_ends_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          grace_until?: string | null
          id?: string
          name: string
          plan?: string
          slug: string
          status?: string
          trial_ends_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          grace_until?: string | null
          id?: string
          name?: string
          plan?: string
          slug?: string
          status?: string
          trial_ends_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_tenant_ids: { Args: never; Returns: string[] }
      create_tenant: {
        Args: { p_name: string; p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

A new version of Supabase CLI is available: v2.107.0 (currently installed v2.105.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
