import { supabase } from '../../../lib/supabase/client'
import type { Database } from '../../../lib/supabase/types'

export type RoutineItem = Database['public']['Tables']['routine_items']['Row']
export type DailyTask = Database['public']['Tables']['daily_tasks']['Row']

export type CreateRoutineItemInput = {
    userId: string
    title: string
    category?: string | null
    notes?: string | null
    sortOrder?: number
}

export type CreateDailyTaskInput = {
    userId: string
    taskDate: string
    title: string
    category?: string | null
    notes?: string | null
    routineItemId?: string | null
    sortOrder?: number
}

function createClientId() {
    return crypto.randomUUID()
}

function cleanText(value: string | null | undefined) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

export async function listRoutineItems(userId: string) {
    const { data, error } = await supabase
        .from('routine_items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) {
        throw error
    }

    return data
}

export async function createRoutineItem(input: CreateRoutineItemInput) {
    const { data, error } = await supabase
        .from('routine_items')
        .insert({
            user_id: input.userId,
            title: input.title.trim(),
            category: cleanText(input.category),
            notes: cleanText(input.notes),
            sort_order: input.sortOrder ?? 1,
            recurrence: 'daily',
            is_active: true,
            client_id: createClientId(),
            sync_status: 'synced'
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function archiveRoutineItem(userId: string, routineItemId: string) {
    const { data, error } = await supabase
        .from('routine_items')
        .update({
            is_active: false,
            deleted_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('id', routineItemId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function listDailyTasks(userId: string, taskDate?: string) {
    let query = supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('task_date', { ascending: false })
        .order('sort_order', { ascending: true })
        .limit(100)

    if (taskDate) {
        query = query.eq('task_date', taskDate)
    }

    const { data, error } = await query

    if (error) {
        throw error
    }

    return data
}

export async function createDailyTask(input: CreateDailyTaskInput) {
    const { data, error } = await supabase
        .from('daily_tasks')
        .insert({
            user_id: input.userId,
            routine_item_id: input.routineItemId ?? null,
            task_date: input.taskDate,
            title: input.title.trim(),
            category: cleanText(input.category),
            notes: cleanText(input.notes),
            status: 'pending',
            sort_order: input.sortOrder ?? 1,
            client_id: createClientId(),
            sync_status: 'synced'
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function updateDailyTaskStatus(
    userId: string,
    taskId: string,
    status: 'pending' | 'completed' | 'skipped'
) {
    const now = new Date().toISOString()

    const { data, error } = await supabase
        .from('daily_tasks')
        .update({
            status,
            completed_at: status === 'completed' ? now : null,
            skipped_at: status === 'skipped' ? now : null
        })
        .eq('user_id', userId)
        .eq('id', taskId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function deleteDailyTask(userId: string, taskId: string) {
    const { data, error } = await supabase
        .from('daily_tasks')
        .update({
            deleted_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('id', taskId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function generateTodayTasksFromRoutine(userId: string, taskDate: string) {
    const routineItems = await listRoutineItems(userId)
    const existingTasks = await listDailyTasks(userId, taskDate)

    const existingRoutineItemIds = new Set(
        existingTasks
            .map((task) => task.routine_item_id)
            .filter((id): id is string => Boolean(id))
    )

    const tasksToCreate = routineItems.filter((item) => !existingRoutineItemIds.has(item.id))

    if (tasksToCreate.length === 0) {
        return []
    }

    const { data, error } = await supabase
        .from('daily_tasks')
        .insert(
            tasksToCreate.map((item) => ({
                user_id: userId,
                routine_item_id: item.id,
                task_date: taskDate,
                title: item.title,
                category: item.category,
                notes: item.notes,
                status: 'pending',
                sort_order: item.sort_order,
                client_id: createClientId(),
                sync_status: 'synced' as const
            }))
        )
        .select()

    if (error) {
        throw error
    }

    return data
}