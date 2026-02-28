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
      activity_feed: {
        Row: {
          action_type: string
          created_at: string
          data: Json | null
          description: string
          district_id: string | null
          icon: string
          id: string
          target_name: string | null
          user_id: string
          username: string
        }
        Insert: {
          action_type: string
          created_at?: string
          data?: Json | null
          description: string
          district_id?: string | null
          icon?: string
          id?: string
          target_name?: string | null
          user_id: string
          username?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          data?: Json | null
          description?: string
          district_id?: string | null
          icon?: string
          id?: string
          target_name?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
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
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          bidder_name: string
          created_at: string
          id: string
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          bidder_name?: string
          created_at?: string
          id?: string
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          bidder_name?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "live_auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_players: {
        Row: {
          backstory: string | null
          cash: number
          created_at: string
          crew_size: number
          day: number
          districts_owned: number
          gang_id: string | null
          hp: number
          id: string
          is_active: boolean
          karma: number
          level: number
          loc: string
          max_hp: number
          prestige_level: number
          rep: number
          username: string
        }
        Insert: {
          backstory?: string | null
          cash?: number
          created_at?: string
          crew_size?: number
          day?: number
          districts_owned?: number
          gang_id?: string | null
          hp?: number
          id?: string
          is_active?: boolean
          karma?: number
          level?: number
          loc?: string
          max_hp?: number
          prestige_level?: number
          rep?: number
          username: string
        }
        Update: {
          backstory?: string | null
          cash?: number
          created_at?: string
          crew_size?: number
          day?: number
          districts_owned?: number
          gang_id?: string | null
          hp?: number
          id?: string
          is_active?: boolean
          karma?: number
          level?: number
          loc?: string
          max_hp?: number
          prestige_level?: number
          rep?: number
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_players_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel: string
          created_at: string
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          message: string
          user_id: string
          username?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      daily_digests: {
        Row: {
          created_at: string
          digest_data: Json
          id: string
          seen: boolean
          user_id: string
          world_day: number
        }
        Insert: {
          created_at?: string
          digest_data?: Json
          id?: string
          seen?: boolean
          user_id: string
          world_day: number
        }
        Update: {
          created_at?: string
          digest_data?: Json
          id?: string
          seen?: boolean
          user_id?: string
          world_day?: number
        }
        Relationships: []
      }
      death_legacy: {
        Row: {
          coffer_cash: number
          created_at: string
          death_count: number
          id: string
          last_death_at: string | null
          legacy_xp_bonus: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coffer_cash?: number
          created_at?: string
          death_count?: number
          id?: string
          last_death_at?: string | null
          legacy_xp_bonus?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coffer_cash?: number
          created_at?: string
          death_count?: number
          id?: string
          last_death_at?: string | null
          legacy_xp_bonus?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      district_events: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          data: Json | null
          description: string | null
          district_id: string
          escalation_level: number
          event_type: string
          expires_at: string
          id: string
          participants: Json
          source_type: string
          title: string
          triggered_by: string | null
          triggered_by_name: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          district_id: string
          escalation_level?: number
          event_type: string
          expires_at?: string
          id?: string
          participants?: Json
          source_type?: string
          title: string
          triggered_by?: string | null
          triggered_by_name?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          district_id?: string
          escalation_level?: number
          event_type?: string
          expires_at?: string
          id?: string
          participants?: Json
          source_type?: string
          title?: string
          triggered_by?: string | null
          triggered_by_name?: string | null
        }
        Relationships: []
      }
      district_influence: {
        Row: {
          district_id: string
          gang_id: string
          id: string
          influence: number
          updated_at: string
          user_id: string
        }
        Insert: {
          district_id: string
          gang_id: string
          id?: string
          influence?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          district_id?: string
          gang_id?: string
          id?: string
          influence?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "district_influence_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      faction_relations: {
        Row: {
          boss_hp: number
          boss_max_hp: number
          conquered_at: string | null
          conquered_by: string | null
          conquest_phase: string
          conquest_progress: number
          conquest_reward_claimed: Json
          faction_id: string
          gang_damage: Json
          global_relation: number
          id: string
          last_attack_at: string | null
          last_attack_by: string | null
          reset_at: string | null
          status: string
          total_damage_dealt: Json
          updated_at: string
          vassal_owner_id: string | null
        }
        Insert: {
          boss_hp?: number
          boss_max_hp?: number
          conquered_at?: string | null
          conquered_by?: string | null
          conquest_phase?: string
          conquest_progress?: number
          conquest_reward_claimed?: Json
          faction_id: string
          gang_damage?: Json
          global_relation?: number
          id?: string
          last_attack_at?: string | null
          last_attack_by?: string | null
          reset_at?: string | null
          status?: string
          total_damage_dealt?: Json
          updated_at?: string
          vassal_owner_id?: string | null
        }
        Update: {
          boss_hp?: number
          boss_max_hp?: number
          conquered_at?: string | null
          conquered_by?: string | null
          conquest_phase?: string
          conquest_progress?: number
          conquest_reward_claimed?: Json
          faction_id?: string
          gang_damage?: Json
          global_relation?: number
          id?: string
          last_attack_at?: string | null
          last_attack_by?: string | null
          reset_at?: string | null
          status?: string
          total_damage_dealt?: Json
          updated_at?: string
          vassal_owner_id?: string | null
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
      gang_alliances: {
        Row: {
          accepted_at: string | null
          benefits: Json
          created_at: string
          expires_at: string
          gang_a_id: string
          gang_b_id: string
          id: string
          proposed_by: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          benefits?: Json
          created_at?: string
          expires_at?: string
          gang_a_id: string
          gang_b_id: string
          id?: string
          proposed_by: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          benefits?: Json
          created_at?: string
          expires_at?: string
          gang_a_id?: string
          gang_b_id?: string
          id?: string
          proposed_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gang_alliances_gang_a_id_fkey"
            columns: ["gang_a_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gang_alliances_gang_b_id_fkey"
            columns: ["gang_b_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      gang_chat: {
        Row: {
          created_at: string
          gang_id: string
          id: string
          message: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          created_at?: string
          gang_id: string
          id?: string
          message: string
          sender_id: string
          sender_name?: string
        }
        Update: {
          created_at?: string
          gang_id?: string
          id?: string
          message?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gang_chat_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      gang_invites: {
        Row: {
          created_at: string
          gang_id: string
          id: string
          invitee_id: string
          inviter_id: string
        }
        Insert: {
          created_at?: string
          gang_id: string
          id?: string
          invitee_id: string
          inviter_id: string
        }
        Update: {
          created_at?: string
          gang_id?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gang_invites_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      gang_members: {
        Row: {
          contributed: number
          gang_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          contributed?: number
          gang_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          contributed?: number
          gang_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gang_members_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      gang_moles: {
        Row: {
          cover_strength: number
          created_at: string
          discovered_at: string | null
          discovery_consequence: string | null
          id: string
          intel_reports: Json
          last_intel_at: string | null
          planted_at: string
          player_gang_id: string
          player_id: string
          status: string
          target_gang_id: string
          updated_at: string
        }
        Insert: {
          cover_strength?: number
          created_at?: string
          discovered_at?: string | null
          discovery_consequence?: string | null
          id?: string
          intel_reports?: Json
          last_intel_at?: string | null
          planted_at?: string
          player_gang_id: string
          player_id: string
          status?: string
          target_gang_id: string
          updated_at?: string
        }
        Update: {
          cover_strength?: number
          created_at?: string
          discovered_at?: string | null
          discovery_consequence?: string | null
          id?: string
          intel_reports?: Json
          last_intel_at?: string | null
          planted_at?: string
          player_gang_id?: string
          player_id?: string
          status?: string
          target_gang_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gang_moles_player_gang_id_fkey"
            columns: ["player_gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gang_moles_target_gang_id_fkey"
            columns: ["target_gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      gang_story_arcs: {
        Row: {
          arc_id: string
          completed_at: string | null
          created_at: string
          current_step: number
          gang_id: string
          id: string
          member_choices: Json
          result: Json | null
          started_at: string
          status: string
          total_steps: number
        }
        Insert: {
          arc_id: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          gang_id: string
          id?: string
          member_choices?: Json
          result?: Json | null
          started_at?: string
          status?: string
          total_steps?: number
        }
        Update: {
          arc_id?: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          gang_id?: string
          id?: string
          member_choices?: Json
          result?: Json | null
          started_at?: string
          status?: string
          total_steps?: number
        }
        Relationships: [
          {
            foreignKeyName: "gang_story_arcs_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      gang_territories: {
        Row: {
          captured_at: string
          defense_level: number
          district_id: string
          gang_id: string
          id: string
          total_influence: number
        }
        Insert: {
          captured_at?: string
          defense_level?: number
          district_id: string
          gang_id: string
          id?: string
          total_influence?: number
        }
        Update: {
          captured_at?: string
          defense_level?: number
          district_id?: string
          gang_id?: string
          id?: string
          total_influence?: number
        }
        Relationships: [
          {
            foreignKeyName: "gang_territories_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      gang_wars: {
        Row: {
          attacker_chain: number
          attacker_gang_id: string
          attacker_last_hit_at: string | null
          attacker_score: number
          defender_chain: number
          defender_gang_id: string
          defender_last_hit_at: string | null
          defender_score: number
          district_id: string | null
          ended_at: string | null
          ends_at: string
          id: string
          started_at: string
          status: string
          winner_gang_id: string | null
        }
        Insert: {
          attacker_chain?: number
          attacker_gang_id: string
          attacker_last_hit_at?: string | null
          attacker_score?: number
          defender_chain?: number
          defender_gang_id: string
          defender_last_hit_at?: string | null
          defender_score?: number
          district_id?: string | null
          ended_at?: string | null
          ends_at?: string
          id?: string
          started_at?: string
          status?: string
          winner_gang_id?: string | null
        }
        Update: {
          attacker_chain?: number
          attacker_gang_id?: string
          attacker_last_hit_at?: string | null
          attacker_score?: number
          defender_chain?: number
          defender_gang_id?: string
          defender_last_hit_at?: string | null
          defender_score?: number
          district_id?: string | null
          ended_at?: string | null
          ends_at?: string
          id?: string
          started_at?: string
          status?: string
          winner_gang_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gang_wars_attacker_gang_id_fkey"
            columns: ["attacker_gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gang_wars_defender_gang_id_fkey"
            columns: ["defender_gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      gangs: {
        Row: {
          created_at: string
          description: string
          id: string
          leader_id: string
          level: number
          max_members: number
          name: string
          tag: string
          treasury: number
          updated_at: string
          xp: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          leader_id: string
          level?: number
          max_members?: number
          name: string
          tag: string
          treasury?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          leader_id?: string
          level?: number
          max_members?: number
          name?: string
          tag?: string
          treasury?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      heist_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          crew_slots: Json
          equipment: Json
          gang_id: string
          heist_id: string
          id: string
          initiator_id: string
          recon_done: boolean
          result: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          crew_slots?: Json
          equipment?: Json
          gang_id: string
          heist_id: string
          id?: string
          initiator_id: string
          recon_done?: boolean
          result?: Json | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          crew_slots?: Json
          equipment?: Json
          gang_id?: string
          heist_id?: string
          id?: string
          initiator_id?: string
          recon_done?: boolean
          result?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "heist_sessions_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          backstory: string | null
          cash: number
          crew_size: number
          day: number
          districts_owned: number
          id: string
          is_hardcore: boolean
          karma: number
          level: number
          prestige_level: number
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
          is_hardcore?: boolean
          karma?: number
          level?: number
          prestige_level?: number
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
          is_hardcore?: boolean
          karma?: number
          level?: number
          prestige_level?: number
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
      live_auctions: {
        Row: {
          bid_count: number
          claimed_at: string | null
          created_at: string
          current_bid: number
          current_bidder_id: string | null
          current_bidder_name: string | null
          ends_at: string
          id: string
          item_id: string
          item_name: string
          item_type: string
          min_increment: number
          original_ends_at: string
          quantity: number
          seller_id: string
          seller_name: string
          starting_price: number
          status: string
        }
        Insert: {
          bid_count?: number
          claimed_at?: string | null
          created_at?: string
          current_bid?: number
          current_bidder_id?: string | null
          current_bidder_name?: string | null
          ends_at: string
          id?: string
          item_id: string
          item_name: string
          item_type: string
          min_increment?: number
          original_ends_at: string
          quantity?: number
          seller_id: string
          seller_name?: string
          starting_price: number
          status?: string
        }
        Update: {
          bid_count?: number
          claimed_at?: string | null
          created_at?: string
          current_bid?: number
          current_bidder_id?: string | null
          current_bidder_name?: string | null
          ends_at?: string
          id?: string
          item_id?: string
          item_name?: string
          item_type?: string
          min_increment?: number
          original_ends_at?: string
          quantity?: number
          seller_id?: string
          seller_name?: string
          starting_price?: number
          status?: string
        }
        Relationships: []
      }
      market_listings: {
        Row: {
          created_at: string
          district_id: string
          expires_at: string
          good_id: string
          id: string
          price_per_unit: number
          quantity: number
          seller_id: string
          seller_name: string
          status: string
        }
        Insert: {
          created_at?: string
          district_id: string
          expires_at?: string
          good_id: string
          id?: string
          price_per_unit: number
          quantity: number
          seller_id: string
          seller_name?: string
          status?: string
        }
        Update: {
          created_at?: string
          district_id?: string
          expires_at?: string
          good_id?: string
          id?: string
          price_per_unit?: number
          quantity?: number
          seller_id?: string
          seller_name?: string
          status?: string
        }
        Relationships: []
      }
      market_player_trades: {
        Row: {
          buyer_id: string
          created_at: string
          district_id: string
          good_id: string
          id: string
          price_per_unit: number
          quantity: number
          seller_id: string | null
          trade_type: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          district_id: string
          good_id: string
          id?: string
          price_per_unit: number
          quantity: number
          seller_id?: string | null
          trade_type?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          district_id?: string
          good_id?: string
          id?: string
          price_per_unit?: number
          quantity?: number
          seller_id?: string | null
          trade_type?: string
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          buy_volume: number
          current_price: number
          district_id: string
          good_id: string
          id: string
          last_updated: string
          price_trend: string
          sell_volume: number
        }
        Insert: {
          buy_volume?: number
          current_price?: number
          district_id: string
          good_id: string
          id?: string
          last_updated?: string
          price_trend?: string
          sell_volume?: number
        }
        Update: {
          buy_volume?: number
          current_price?: number
          district_id?: string
          good_id?: string
          id?: string
          last_updated?: string
          price_trend?: string
          sell_volume?: number
        }
        Relationships: []
      }
      market_trade_history: {
        Row: {
          created_at: string
          district_id: string
          good_id: string
          id: string
          price: number
          trade_type: string
          volume: number
        }
        Insert: {
          created_at?: string
          district_id: string
          good_id: string
          id?: string
          price: number
          trade_type: string
          volume: number
        }
        Update: {
          created_at?: string
          district_id?: string
          good_id?: string
          id?: string
          price?: number
          trade_type?: string
          volume?: number
        }
        Relationships: []
      }
      news_events: {
        Row: {
          category: string
          created_at: string
          detail: string | null
          district_id: string | null
          expires_at: string
          icon: string
          id: string
          text: string
          urgency: string
        }
        Insert: {
          category?: string
          created_at?: string
          detail?: string | null
          district_id?: string | null
          expires_at?: string
          icon?: string
          id?: string
          text: string
          urgency?: string
        }
        Update: {
          category?: string
          created_at?: string
          detail?: string | null
          district_id?: string | null
          expires_at?: string
          icon?: string
          id?: string
          text?: string
          urgency?: string
        }
        Relationships: []
      }
      npc_district_mood: {
        Row: {
          collective_score: number
          district_id: string
          id: string
          interaction_count: number
          npc_id: string
          status: string
          updated_at: string
        }
        Insert: {
          collective_score?: number
          district_id: string
          id?: string
          interaction_count?: number
          npc_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          collective_score?: number
          district_id?: string
          id?: string
          interaction_count?: number
          npc_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      organized_crimes: {
        Row: {
          completes_at: string | null
          created_at: string
          crime_id: string
          gang_id: string
          id: string
          initiated_at: string | null
          initiated_by: string
          result: Json | null
          signups: Json
          status: string
        }
        Insert: {
          completes_at?: string | null
          created_at?: string
          crime_id: string
          gang_id: string
          id?: string
          initiated_at?: string | null
          initiated_by: string
          result?: Json | null
          signups?: Json
          status?: string
        }
        Update: {
          completes_at?: string | null
          created_at?: string
          crime_id?: string
          gang_id?: string
          id?: string
          initiated_at?: string | null
          initiated_by?: string
          result?: Json | null
          signups?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organized_crimes_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_story_events: {
        Row: {
          choices: Json
          chosen_option: string | null
          context_snapshot: Json
          created_at: string
          expires_at: string
          id: string
          reward_data: Json | null
          status: string
          story_text: string
          story_title: string
          user_id: string
        }
        Insert: {
          choices?: Json
          chosen_option?: string | null
          context_snapshot?: Json
          created_at?: string
          expires_at?: string
          id?: string
          reward_data?: Json | null
          status?: string
          story_text: string
          story_title?: string
          user_id: string
        }
        Update: {
          choices?: Json
          chosen_option?: string | null
          context_snapshot?: Json
          created_at?: string
          expires_at?: string
          id?: string
          reward_data?: Json | null
          status?: string
          story_text?: string
          story_title?: string
          user_id?: string
        }
        Relationships: []
      }
      player_bounties: {
        Row: {
          amount: number
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          expires_at: string
          id: string
          placer_id: string
          reason: string
          status: string
          target_id: string
        }
        Insert: {
          amount?: number
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          placer_id: string
          reason?: string
          status?: string
          target_id: string
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          placer_id?: string
          reason?: string
          status?: string
          target_id?: string
        }
        Relationships: []
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
      player_education: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          started_at?: string
          status?: string
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
      player_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
          subject?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      player_nemesis: {
        Row: {
          arc_progress: number
          assigned_at: string
          district_id: string
          events_log: Json
          id: string
          nemesis_id: string
          player_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          arc_progress?: number
          assigned_at?: string
          district_id: string
          events_log?: Json
          id?: string
          nemesis_id: string
          player_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          arc_progress?: number
          assigned_at?: string
          district_id?: string
          events_log?: Json
          id?: string
          nemesis_id?: string
          player_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      player_online_status: {
        Row: {
          district_id: string
          is_online: boolean
          last_seen_at: string
          level: number
          user_id: string
          username: string
        }
        Insert: {
          district_id?: string
          is_online?: boolean
          last_seen_at?: string
          level?: number
          user_id: string
          username?: string
        }
        Update: {
          district_id?: string
          is_online?: boolean
          last_seen_at?: string
          level?: number
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      player_reputation_echo: {
        Row: {
          district_id: string
          generosity: number
          id: string
          loyalty: number
          price_modifier: number
          stealth: number
          total_interactions: number
          trade_trust: number
          updated_at: string
          user_id: string
          violence: number
        }
        Insert: {
          district_id: string
          generosity?: number
          id?: string
          loyalty?: number
          price_modifier?: number
          stealth?: number
          total_interactions?: number
          trade_trust?: number
          updated_at?: string
          user_id: string
          violence?: number
        }
        Update: {
          district_id?: string
          generosity?: number
          id?: string
          loyalty?: number
          price_modifier?: number
          stealth?: number
          total_interactions?: number
          trade_trust?: number
          updated_at?: string
          user_id?: string
          violence?: number
        }
        Relationships: []
      }
      player_rivalries: {
        Row: {
          created_at: string
          id: string
          last_interaction: string
          player_id: string
          rival_id: string
          rivalry_score: number
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_interaction?: string
          player_id: string
          rival_id: string
          rivalry_score?: number
          source?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_interaction?: string
          player_id?: string
          rival_id?: string
          rivalry_score?: number
          source?: string
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
      player_skills: {
        Row: {
          id: string
          level: number
          skill_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          level?: number
          skill_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          level?: number
          skill_id?: string
          unlocked_at?: string
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
          combat_rating: number
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
          is_hardcore: boolean
          karma: number
          last_action_at: string
          last_save_at: string | null
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
          prestige_level: number
          prison_reason: string | null
          prison_until: string | null
          rep: number
          rested_xp: number
          save_data: Json | null
          save_version: number | null
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
          xp_streak: number
        }
        Insert: {
          ammo?: number
          ammo_factory_level?: number
          ammo_stock?: Json
          attack_cooldown_until?: string | null
          backstory?: string | null
          casino_jackpot?: number
          combat_rating?: number
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
          is_hardcore?: boolean
          karma?: number
          last_action_at?: string
          last_save_at?: string | null
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
          prestige_level?: number
          prison_reason?: string | null
          prison_until?: string | null
          rep?: number
          rested_xp?: number
          save_data?: Json | null
          save_version?: number | null
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
          xp_streak?: number
        }
        Update: {
          ammo?: number
          ammo_factory_level?: number
          ammo_stock?: Json
          attack_cooldown_until?: string | null
          backstory?: string | null
          casino_jackpot?: number
          combat_rating?: number
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
          is_hardcore?: boolean
          karma?: number
          last_action_at?: string
          last_save_at?: string | null
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
          prestige_level?: number
          prison_reason?: string | null
          prison_until?: string | null
          rep?: number
          rested_xp?: number
          save_data?: Json | null
          save_version?: number | null
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
          xp_streak?: number
        }
        Relationships: []
      }
      player_titles: {
        Row: {
          earned_at: string
          id: string
          is_active: boolean
          title_icon: string
          title_id: string
          title_name: string
          user_id: string
        }
        Insert: {
          earned_at?: string
          id?: string
          is_active?: boolean
          title_icon?: string
          title_id: string
          title_name: string
          user_id: string
        }
        Update: {
          earned_at?: string
          id?: string
          is_active?: boolean
          title_icon?: string
          title_id?: string
          title_name?: string
          user_id?: string
        }
        Relationships: []
      }
      player_travel: {
        Row: {
          arrives_at: string
          created_at: string
          departed_at: string
          destination: string
          id: string
          purchased_goods: Json
          status: string
          user_id: string
        }
        Insert: {
          arrives_at: string
          created_at?: string
          departed_at?: string
          destination: string
          id?: string
          purchased_goods?: Json
          status?: string
          user_id: string
        }
        Update: {
          arrives_at?: string
          created_at?: string
          departed_at?: string
          destination?: string
          id?: string
          purchased_goods?: Json
          status?: string
          user_id?: string
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
      pvp_combat_sessions: {
        Row: {
          attacker_id: string
          attacker_state: Json
          combat_log: Json
          created_at: string
          defender_id: string
          defender_state: Json
          id: string
          status: string
          turn: number
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          attacker_id: string
          attacker_state?: Json
          combat_log?: Json
          created_at?: string
          defender_id: string
          defender_state?: Json
          id?: string
          status?: string
          turn?: number
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          attacker_id?: string
          attacker_state?: Json
          combat_log?: Json
          created_at?: string
          defender_id?: string
          defender_state?: Json
          id?: string
          status?: string
          turn?: number
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      safehouse_raids: {
        Row: {
          attacker_damage: number
          attacker_id: string
          attacker_won: boolean
          created_at: string
          defender_damage: number
          defender_id: string
          district_id: string
          id: string
          loot_stolen: number
          upgrade_destroyed: string | null
        }
        Insert: {
          attacker_damage?: number
          attacker_id: string
          attacker_won: boolean
          created_at?: string
          defender_damage?: number
          defender_id: string
          district_id: string
          id?: string
          loot_stolen?: number
          upgrade_destroyed?: string | null
        }
        Update: {
          attacker_damage?: number
          attacker_id?: string
          attacker_won?: boolean
          created_at?: string
          defender_damage?: number
          defender_id?: string
          district_id?: string
          id?: string
          loot_stolen?: number
          upgrade_destroyed?: string | null
        }
        Relationships: []
      }
      smuggle_routes: {
        Row: {
          capacity: number
          created_at: string
          created_by: string | null
          expires_at: string
          from_district: string
          gang_id: string | null
          good_id: string
          id: string
          profit_multiplier: number
          risk_level: number
          status: string
          to_district: string
          used_capacity: number
        }
        Insert: {
          capacity?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string
          from_district: string
          gang_id?: string | null
          good_id: string
          id?: string
          profit_multiplier?: number
          risk_level?: number
          status?: string
          to_district: string
          used_capacity?: number
        }
        Update: {
          capacity?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string
          from_district?: string
          gang_id?: string | null
          good_id?: string
          id?: string
          profit_multiplier?: number
          risk_level?: number
          status?: string
          to_district?: string
          used_capacity?: number
        }
        Relationships: [
          {
            foreignKeyName: "smuggle_routes_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_offers: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          message: string | null
          offer_cash: number
          offer_goods: Json
          receiver_id: string
          receiver_name: string
          request_cash: number
          request_goods: Json
          sender_id: string
          sender_name: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          offer_cash?: number
          offer_goods?: Json
          receiver_id: string
          receiver_name?: string
          request_cash?: number
          request_goods?: Json
          sender_id: string
          sender_name?: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          offer_cash?: number
          offer_goods?: Json
          receiver_id?: string
          receiver_name?: string
          request_cash?: number
          request_goods?: Json
          sender_id?: string
          sender_name?: string
          status?: string
        }
        Relationships: []
      }
      tribunal_cases: {
        Row: {
          accused_id: string
          accused_name: string
          accuser_id: string
          accuser_name: string
          charge: string
          created_at: string
          evidence: string
          expires_at: string
          id: string
          jury_size: number
          punishment: Json | null
          resolved_at: string | null
          status: string
          verdict: string | null
          votes_guilty: number
          votes_innocent: number
        }
        Insert: {
          accused_id: string
          accused_name?: string
          accuser_id: string
          accuser_name?: string
          charge: string
          created_at?: string
          evidence?: string
          expires_at?: string
          id?: string
          jury_size?: number
          punishment?: Json | null
          resolved_at?: string | null
          status?: string
          verdict?: string | null
          votes_guilty?: number
          votes_innocent?: number
        }
        Update: {
          accused_id?: string
          accused_name?: string
          accuser_id?: string
          accuser_name?: string
          charge?: string
          created_at?: string
          evidence?: string
          expires_at?: string
          id?: string
          jury_size?: number
          punishment?: Json | null
          resolved_at?: string | null
          status?: string
          verdict?: string | null
          votes_guilty?: number
          votes_innocent?: number
        }
        Relationships: []
      }
      tribunal_votes: {
        Row: {
          case_id: string
          created_at: string
          id: string
          juror_id: string
          juror_name: string
          reasoning: string | null
          vote: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          juror_id: string
          juror_name?: string
          reasoning?: string | null
          vote: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          juror_id?: string
          juror_name?: string
          reasoning?: string | null
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribunal_votes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "tribunal_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      undercover_missions: {
        Row: {
          completed_at: string | null
          cover_identity: string
          cover_integrity: number
          created_at: string
          days_active: number
          id: string
          intel_gathered: Json
          missions_completed: number
          reward_data: Json | null
          started_at: string
          status: string
          target_faction: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cover_identity?: string
          cover_integrity?: number
          created_at?: string
          days_active?: number
          id?: string
          intel_gathered?: Json
          missions_completed?: number
          reward_data?: Json | null
          started_at?: string
          status?: string
          target_faction: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cover_identity?: string
          cover_integrity?: number
          created_at?: string
          days_active?: number
          id?: string
          intel_gathered?: Json
          missions_completed?: number
          reward_data?: Json | null
          started_at?: string
          status?: string
          target_faction?: string
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
      world_raids: {
        Row: {
          boss_hp: number
          boss_max_hp: number
          completed_at: string | null
          created_at: string
          description: string | null
          district_id: string | null
          ends_at: string
          id: string
          participants: Json
          raid_type: string
          reward_pool: Json
          started_at: string
          status: string
          title: string
          total_participants: number
        }
        Insert: {
          boss_hp?: number
          boss_max_hp?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          district_id?: string | null
          ends_at?: string
          id?: string
          participants?: Json
          raid_type: string
          reward_pool?: Json
          started_at?: string
          status?: string
          title: string
          total_participants?: number
        }
        Update: {
          boss_hp?: number
          boss_max_hp?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          district_id?: string | null
          ends_at?: string
          id?: string
          participants?: Json
          raid_type?: string
          reward_pool?: Json
          started_at?: string
          status?: string
          title?: string
          total_participants?: number
        }
        Relationships: []
      }
      world_state: {
        Row: {
          active_event: Json | null
          current_weather: string
          golden_district: string | null
          golden_district_expires_at: string | null
          id: number
          maintenance_message: string | null
          maintenance_mode: boolean
          next_cycle_at: string
          season_ends_at: string | null
          season_number: number | null
          time_of_day: string
          updated_at: string
          weather_changed_at: string
          world_day: number
        }
        Insert: {
          active_event?: Json | null
          current_weather?: string
          golden_district?: string | null
          golden_district_expires_at?: string | null
          id?: number
          maintenance_message?: string | null
          maintenance_mode?: boolean
          next_cycle_at?: string
          season_ends_at?: string | null
          season_number?: number | null
          time_of_day?: string
          updated_at?: string
          weather_changed_at?: string
          world_day?: number
        }
        Update: {
          active_event?: Json | null
          current_weather?: string
          golden_district?: string | null
          golden_district_expires_at?: string | null
          id?: number
          maintenance_message?: string | null
          maintenance_mode?: boolean
          next_cycle_at?: string
          season_ends_at?: string | null
          season_number?: number | null
          time_of_day?: string
          updated_at?: string
          weather_changed_at?: string
          world_day?: number
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
