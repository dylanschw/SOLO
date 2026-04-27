export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type WeightUnit = 'lb' | 'kg'

export type ThemePreference = 'light' | 'dark' | 'system'

export type SyncStatus = 'synced' | 'pending' | 'conflict'

export type NutritionGoalType = 'gain_weight' | 'lose_weight' | 'maintain_weight'

export type ExerciseSetType = 'straight' | 'top_set_backoff' | 'warmup' | 'custom'

export type WorkoutSessionStatus = 'planned' | 'in_progress' | 'completed' | 'skipped'

export type LoggedSetType = 'warmup' | 'working' | 'top' | 'backoff' | 'drop'

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

      workout_programs: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          rotation_length_days: number
          is_active: boolean
          is_archived: boolean
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
          name: string
          description?: string | null
          rotation_length_days?: number
          is_active?: boolean
          is_archived?: boolean
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
          name?: string
          description?: string | null
          rotation_length_days?: number
          is_active?: boolean
          is_archived?: boolean
          client_id?: string
          version?: number
          deleted_at?: string | null
          sync_status?: SyncStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      workout_days: {
        Row: {
          id: string
          user_id: string
          program_id: string
          day_number: number
          name: string
          notes: string | null
          is_rest_day: boolean
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
          program_id: string
          day_number: number
          name: string
          notes?: string | null
          is_rest_day?: boolean
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
          program_id?: string
          day_number?: number
          name?: string
          notes?: string | null
          is_rest_day?: boolean
          client_id?: string
          version?: number
          deleted_at?: string | null
          sync_status?: SyncStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          muscle_group: string | null
          equipment: string | null
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
          name: string
          muscle_group?: string | null
          equipment?: string | null
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
          name?: string
          muscle_group?: string | null
          equipment?: string | null
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

      planned_exercises: {
        Row: {
          id: string
          user_id: string
          workout_day_id: string
          exercise_id: string
          sort_order: number
          set_type: ExerciseSetType
          planned_sets: number
          min_reps: number | null
          max_reps: number | null
          rest_seconds: number | null
          target_rpe: number | null
          backoff_percent: number | null
          notes: string | null
          progression_rule: string | null
          deload_rule: string | null
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
          workout_day_id: string
          exercise_id: string
          sort_order?: number
          set_type?: ExerciseSetType
          planned_sets?: number
          min_reps?: number | null
          max_reps?: number | null
          rest_seconds?: number | null
          target_rpe?: number | null
          backoff_percent?: number | null
          notes?: string | null
          progression_rule?: string | null
          deload_rule?: string | null
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
          workout_day_id?: string
          exercise_id?: string
          sort_order?: number
          set_type?: ExerciseSetType
          planned_sets?: number
          min_reps?: number | null
          max_reps?: number | null
          rest_seconds?: number | null
          target_rpe?: number | null
          backoff_percent?: number | null
          notes?: string | null
          progression_rule?: string | null
          deload_rule?: string | null
          client_id?: string
          version?: number
          deleted_at?: string | null
          sync_status?: SyncStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      workout_sessions: {
        Row: {
          id: string
          user_id: string
          program_id: string | null
          workout_day_id: string | null
          session_date: string
          started_at: string | null
          completed_at: string | null
          status: WorkoutSessionStatus
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
          program_id?: string | null
          workout_day_id?: string | null
          session_date?: string
          started_at?: string | null
          completed_at?: string | null
          status?: WorkoutSessionStatus
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
          program_id?: string | null
          workout_day_id?: string | null
          session_date?: string
          started_at?: string | null
          completed_at?: string | null
          status?: WorkoutSessionStatus
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

      workout_sets: {
        Row: {
          id: string
          user_id: string
          workout_session_id: string
          planned_exercise_id: string | null
          exercise_id: string
          set_number: number
          set_type: LoggedSetType
          weight_kg: number | null
          reps: number | null
          rpe: number | null
          completed: boolean
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
          workout_session_id: string
          planned_exercise_id?: string | null
          exercise_id: string
          set_number: number
          set_type?: LoggedSetType
          weight_kg?: number | null
          reps?: number | null
          rpe?: number | null
          completed?: boolean
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
          workout_session_id?: string
          planned_exercise_id?: string | null
          exercise_id?: string
          set_number?: number
          set_type?: LoggedSetType
          weight_kg?: number | null
          reps?: number | null
          rpe?: number | null
          completed?: boolean
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