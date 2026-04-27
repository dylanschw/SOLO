export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type WeightUnit = 'lb' | 'kg'

export type ThemePreference = 'light' | 'dark' | 'system'

export type SyncStatus = 'synced' | 'pending' | 'conflict'

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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}