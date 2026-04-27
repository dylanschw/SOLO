export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type WeightUnit = 'lb' | 'kg'

export type ThemePreference = 'light' | 'dark' | 'system'

export type SyncStatus = 'synced' | 'pending' | 'conflict'

export type NutritionGoalType = 'gain_weight' | 'lose_weight' | 'maintain_weight'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          preferred_weight_unit: WeightUnit
          theme_preference: ThemePreference
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_weight_unit?: WeightUnit
          theme_preference?: ThemePreference
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_weight_unit?: WeightUnit
          theme_preference?: ThemePreference
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      bodyweight_entries: {
        Row: {
          id: string
          user_id: string
          entry_date: string
          weight_kg: number
          notes: string | null
          client_id: string
          version: number
          deleted_at: string | null
          sync_status: SyncStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_date: string
          weight_kg: number
          notes?: string | null
          client_id: string
          version?: number
          deleted_at?: string | null
          sync_status?: SyncStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entry_date?: string
          weight_kg?: number
          notes?: string | null
          client_id?: string
          version?: number
          deleted_at?: string | null
          sync_status?: SyncStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      nutrition_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          meal_count: number
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          notes: string | null
          client_id: string
          version: number
          deleted_at: string | null
          sync_status: SyncStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          meal_count?: number
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          notes?: string | null
          client_id: string
          version?: number
          deleted_at?: string | null
          sync_status?: SyncStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          meal_count?: number
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          notes?: string | null
          client_id?: string
          version?: number
          deleted_at?: string | null
          sync_status?: SyncStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      nutrition_targets: {
        Row: {
          id: string
          user_id: string
          mode: 'manual' | 'calculated'
          goal_type: NutritionGoalType
          calories: number
          protein_g: number
          carbs_g: number | null
          fat_g: number | null
          effective_from: string
          is_active: boolean
          client_id: string
          version: number
          deleted_at: string | null
          sync_status: SyncStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mode: 'manual' | 'calculated'
          goal_type: NutritionGoalType
          calories: number
          protein_g: number
          carbs_g?: number | null
          fat_g?: number | null
          effective_from?: string
          is_active?: boolean
          client_id: string
          version?: number
          deleted_at?: string | null
          sync_status?: SyncStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mode?: 'manual' | 'calculated'
          goal_type?: NutritionGoalType
          calories?: number
          protein_g?: number
          carbs_g?: number | null
          fat_g?: number | null
          effective_from?: string
          is_active?: boolean
          client_id?: string
          version?: number
          deleted_at?: string | null
          sync_status?: SyncStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}