import { supabase } from '../../../lib/supabase/client'
import type { Database } from '../../../lib/supabase/types'

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type MealPrepTemplate = Database['public']['Tables']['meal_prep_templates']['Row']

export type UpsertRecipeInput = {
    userId: string
    recipeId?: string | null
    name: string
    calories?: number | null
    proteinG?: number | null
    carbsG?: number | null
    fatG?: number | null
    servings: number
    ingredients?: string | null
    instructions?: string | null
    notes?: string | null
    category?: string | null
}

export type UpsertMealPrepTemplateInput = {
    userId: string
    templateId?: string | null
    name: string
    mealsCovered?: string | null
    daysPlanned: number
    mealsText?: string | null
    groceryNotes?: string | null
    prepNotes?: string | null
    notes?: string | null
}

export type RecipePerServing = {
    calories: number | null
    proteinG: number | null
    carbsG: number | null
    fatG: number | null
}

function createClientId() {
    return crypto.randomUUID()
}

function cleanText(value: string | null | undefined) {
    const trimmed = value?.trim()

    return trimmed ? trimmed : null
}

function cleanOptionalNumber(value: number | null | undefined) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null
    }

    return value
}

function roundMacro(value: number | null) {
    return value === null ? null : Math.round(value * 10) / 10
}

export function calculateRecipePerServing(input: {
    calories?: number | null
    proteinG?: number | null
    carbsG?: number | null
    fatG?: number | null
    servings: number
}): RecipePerServing {
    const servings = Math.max(1, input.servings)

    return {
        calories: input.calories === null || typeof input.calories === 'undefined'
            ? null
            : Math.round(input.calories / servings),
        proteinG: roundMacro(cleanOptionalNumber(input.proteinG) === null ? null : Number(input.proteinG) / servings),
        carbsG: roundMacro(cleanOptionalNumber(input.carbsG) === null ? null : Number(input.carbsG) / servings),
        fatG: roundMacro(cleanOptionalNumber(input.fatG) === null ? null : Number(input.fatG) / servings),
    }
}

export async function listRecipes(userId: string) {
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(100)

    if (error) {
        throw error
    }

    return data
}

export async function upsertRecipe(input: UpsertRecipeInput) {
    const payload = {
        name: input.name.trim(),
        calories: cleanOptionalNumber(input.calories),
        protein_g: cleanOptionalNumber(input.proteinG),
        carbs_g: cleanOptionalNumber(input.carbsG),
        fat_g: cleanOptionalNumber(input.fatG),
        servings: Math.max(1, input.servings),
        ingredients: cleanText(input.ingredients),
        instructions: cleanText(input.instructions),
        notes: cleanText(input.notes),
        category: cleanText(input.category),
        sync_status: 'synced' as const,
    }

    if (input.recipeId) {
        const { data, error } = await supabase
            .from('recipes')
            .update(payload)
            .eq('user_id', input.userId)
            .eq('id', input.recipeId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data
    }

    const { data, error } = await supabase
        .from('recipes')
        .insert({
            ...payload,
            user_id: input.userId,
            client_id: createClientId(),
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function deleteRecipe(userId: string, recipeId: string) {
    const { data, error } = await supabase
        .from('recipes')
        .update({
            deleted_at: new Date().toISOString(),
            sync_status: 'synced',
        })
        .eq('user_id', userId)
        .eq('id', recipeId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function listMealPrepTemplates(userId: string) {
    const { data, error } = await supabase
        .from('meal_prep_templates')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(100)

    if (error) {
        throw error
    }

    return data
}

export async function upsertMealPrepTemplate(input: UpsertMealPrepTemplateInput) {
    const payload = {
        name: input.name.trim(),
        meals_covered: cleanText(input.mealsCovered),
        days_planned: Math.max(1, Math.round(input.daysPlanned)),
        meals_text: cleanText(input.mealsText),
        grocery_notes: cleanText(input.groceryNotes),
        prep_notes: cleanText(input.prepNotes),
        notes: cleanText(input.notes),
        sync_status: 'synced' as const,
    }

    if (input.templateId) {
        const { data, error } = await supabase
            .from('meal_prep_templates')
            .update(payload)
            .eq('user_id', input.userId)
            .eq('id', input.templateId)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data
    }

    const { data, error } = await supabase
        .from('meal_prep_templates')
        .insert({
            ...payload,
            user_id: input.userId,
            client_id: createClientId(),
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function deleteMealPrepTemplate(userId: string, templateId: string) {
    const { data, error } = await supabase
        .from('meal_prep_templates')
        .update({
            deleted_at: new Date().toISOString(),
            sync_status: 'synced',
        })
        .eq('user_id', userId)
        .eq('id', templateId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}
