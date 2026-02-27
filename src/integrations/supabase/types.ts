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
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
          target_username: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
          target_username?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
          target_username?: string | null
        }
        Relationships: []
      }
      game_action_log: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string
          id: string
          result_data: Json | null
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string
          id?: string
          result_data?: Json | null
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          result_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          backstory: string | null
          cash: number
          crew_size: number
          day: number
          districts_owned: number
          id: string
          karma: number
          level: number
          rep: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          backstory?: string | null
          cash?: number
          crew_size?: number
          day?: number
          districts_owned?: number
          id?: string
          karma?: number
          level?: number
          rep?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          backstory?: string | null
          cash?: number
          crew_size?: number
          day?: number
          districts_owned?: number
          id?: string
          karma?: number
          level?: number
          rep?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_businesses: {
        Row: {
          acquired_at: string
          business_id: string
          id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          business_id: string
          id?: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          business_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      player_crew: {
        Row: {
          created_at: string
          hp: number
          id: string
          level: number
          loyalty: number
          name: string
          role: string
          slot_index: number
          specialization: string | null
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          hp?: number
          id?: string
          level?: number
          loyalty?: number
          name: string
          role: string
          slot_index?: number
          specialization?: string | null
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          hp?: number
          id?: string
          level?: number
          loyalty?: number
          name?: string
          role?: string
          slot_index?: number
          specialization?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      player_districts: {
        Row: {
          captured_at: string
          defense: Json
          district_id: string
          district_rep: number
          id: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          defense?: Json
          district_id: string
          district_rep?: number
          id?: string
          user_id: string
        }
        Update: {
          captured_at?: string
          defense?: Json
          district_id?: string
          district_rep?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      player_gear: {
        Row: {
          acquired_at: string
          gear_id: string
          id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          gear_id: string
          id?: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          gear_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      player_inventory: {
        Row: {
          avg_cost: number
          good_id: string
          id: string
          quantity: number
          user_id: string
        }
        Insert: {
          avg_cost?: number
          good_id: string
          id?: string
          quantity?: number
          user_id: string
        }
        Update: {
          avg_cost?: number
          good_id?: string
          id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      player_safehouses: {
        Row: {
          acquired_at: string
          district_id: string
          id: string
          level: number
          upgrades: Json
          user_id: string
        }
        Insert: {
          acquired_at?: string
          district_id: string
          id?: string
          level?: number
          upgrades?: Json
          user_id: string
        }
        Update: {
          acquired_at?: string
          district_id?: string
          id?: string
          level?: number
          upgrades?: Json
          user_id?: string
        }
        Relationships: []
      }
      player_sanctions: {
        Row: {
          active: boolean
          admin_id: string
          created_at: string
          expires_at: string | null
          id: string
          reason: string | null
          type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          admin_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          type: string
          user_id: string
        }
        Update: {
          active?: boolean
          admin_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      player_state: {
        Row: {
          ammo: number
          ammo_factory_level: number
          ammo_stock: Json
          attack_cooldown_until: string | null
          backstory: string | null
          casino_jackpot: number
          created_at: string
          crime_cooldown_until: string | null
          day: number
          debt: number
          dirty_money: number
          endgame_phase: string
          energy: number
          energy_regen_at: string
          final_boss_defeated: boolean
          free_play_mode: boolean
          game_over: boolean
          heat: number
          heist_cooldown_until: string | null
          hiding_until: string | null
          hospital_until: string | null
          hospitalizations: number
          hp: number
          id: string
          karma: number
          last_action_at: string
          level: number
          loadout: Json
          loc: string
          max_energy: number
          max_hp: number
          max_nerve: number
          money: number
          nerve: number
          nerve_regen_at: string
          new_game_plus_level: number
          next_xp: number
          personal_heat: number
          police_rel: number
          prison_reason: string | null
          prison_until: string | null
          rep: number
          skill_points: number
          stats: Json
          stats_casino_lost: number
          stats_casino_won: number
          stats_days_played: number
          stats_missions_completed: number
          stats_missions_failed: number
          stats_total_earned: number
          stats_total_spent: number
          stats_trades_completed: number
          travel_cooldown_until: string | null
          updated_at: string
          user_id: string
          wash_used_today: number
          xp: number
        }
        Insert: {
          ammo?: number
          ammo_factory_level?: number
          ammo_stock?: Json
          attack_cooldown_until?: string | null
          backstory?: string | null
          casino_jackpot?: number
          created_at?: string
          crime_cooldown_until?: string | null
          day?: number
          debt?: number
          dirty_money?: number
          endgame_phase?: string
          energy?: number
          energy_regen_at?: string
          final_boss_defeated?: boolean
          free_play_mode?: boolean
          game_over?: boolean
          heat?: number
          heist_cooldown_until?: string | null
          hiding_until?: string | null
          hospital_until?: string | null
          hospitalizations?: number
          hp?: number
          id?: string
          karma?: number
          last_action_at?: string
          level?: number
          loadout?: Json
          loc?: string
          max_energy?: number
          max_hp?: number
          max_nerve?: number
          money?: number
          nerve?: number
          nerve_regen_at?: string
          new_game_plus_level?: number
          next_xp?: number
          personal_heat?: number
          police_rel?: number
          prison_reason?: string | null
          prison_until?: string | null
          rep?: number
          skill_points?: number
          stats?: Json
          stats_casino_lost?: number
          stats_casino_won?: number
          stats_days_played?: number
          stats_missions_completed?: number
          stats_missions_failed?: number
          stats_total_earned?: number
          stats_total_spent?: number
          stats_trades_completed?: number
          travel_cooldown_until?: string | null
          updated_at?: string
          user_id: string
          wash_used_today?: number
          xp?: number
        }
        Update: {
          ammo?: number
          ammo_factory_level?: number
          ammo_stock?: Json
          attack_cooldown_until?: string | null
          backstory?: string | null
          casino_jackpot?: number
          created_at?: string
          crime_cooldown_until?: string | null
          day?: number
          debt?: number
          dirty_money?: number
          endgame_phase?: string
          energy?: number
          energy_regen_at?: string
          final_boss_defeated?: boolean
          free_play_mode?: boolean
          game_over?: boolean
          heat?: number
          heist_cooldown_until?: string | null
          hiding_until?: string | null
          hospital_until?: string | null
          hospitalizations?: number
          hp?: number
          id?: string
          karma?: number
          last_action_at?: string
          level?: number
          loadout?: Json
          loc?: string
          max_energy?: number
          max_hp?: number
          max_nerve?: number
          money?: number
          nerve?: number
          nerve_regen_at?: string
          new_game_plus_level?: number
          next_xp?: number
          personal_heat?: number
          police_rel?: number
          prison_reason?: string | null
          prison_until?: string | null
          rep?: number
          skill_points?: number
          stats?: Json
          stats_casino_lost?: number
          stats_casino_won?: number
          stats_days_played?: number
          stats_missions_completed?: number
          stats_missions_failed?: number
          stats_total_earned?: number
          stats_total_spent?: number
          stats_trades_completed?: number
          travel_cooldown_until?: string | null
          updated_at?: string
          user_id?: string
          wash_used_today?: number
          xp?: number
        }
        Relationships: []
      }
      player_vehicles: {
        Row: {
          acquired_at: string
          condition: number
          id: string
          is_active: boolean
          rekat_cooldown: number
          upgrades: Json
          user_id: string
          vehicle_heat: number
          vehicle_id: string
        }
        Insert: {
          acquired_at?: string
          condition?: number
          id?: string
          is_active?: boolean
          rekat_cooldown?: number
          upgrades?: Json
          user_id: string
          vehicle_heat?: number
          vehicle_id: string
        }
        Update: {
          acquired_at?: string
          condition?: number
          id?: string
          is_active?: boolean
          rekat_cooldown?: number
          upgrades?: Json
          user_id?: string
          vehicle_heat?: number
          vehicle_id?: string
        }
        Relationships: []
      }
      player_villa: {
        Row: {
          created_at: string
          helipad_used_today: boolean
          id: string
          last_party_day: number
          level: number
          modules: Json
          prestige_modules: Json
          purchase_day: number
          stored_ammo: number
          stored_goods: Json
          user_id: string
          vault_money: number
        }
        Insert: {
          created_at?: string
          helipad_used_today?: boolean
          id?: string
          last_party_day?: number
          level?: number
          modules?: Json
          prestige_modules?: Json
          purchase_day?: number
          stored_ammo?: number
          stored_goods?: Json
          user_id: string
          vault_money?: number
        }
        Update: {
          created_at?: string
          helipad_used_today?: boolean
          id?: string
          last_party_day?: number
          level?: number
          modules?: Json
          prestige_modules?: Json
          purchase_day?: number
          stored_ammo?: number
          stored_goods?: Json
          user_id?: string
          vault_money?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          username?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
