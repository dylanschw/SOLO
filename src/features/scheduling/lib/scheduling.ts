import { supabase } from '../../../lib/supabase/client'
import type { Database } from '../../../lib/supabase/types'

export type RoutineItem = Database['public']['Tables']['routine_items']['Row']
export type DailyTask = Database['public']['Tables']['daily_tasks']['Row']
export type DailyWellnessEntry = Database['public']['Tables']['daily_wellness_entries']['Row']

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

export type UpdateRoutineItemInput = {
    userId: string
    routineItemId: string
    title: string
    category?: string | null
    notes?: string | null
}

export type UpdateDailyTaskInput = {
    userId: string
    taskId: string
    taskDate: string
    title: string
    category?: string | null
    notes?: string | null
}

export type UpsertDailyWellnessEntryInput = {
    userId: string
    entryDate: string
    waterGoalMl: number
    waterLoggedMl: number
    creatineCompleted: boolean
    notes?: string | null
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
        .limit(400)

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

export async function updateRoutineItem(input: UpdateRoutineItemInput) {
    const { data, error } = await supabase
        .from('routine_items')
        .update({
            title: input.title.trim(),
            category: cleanText(input.category),
            notes: cleanText(input.notes),
            updated_at: new Date().toISOString()
        })
        .eq('user_id', input.userId)
        .eq('id', input.routineItemId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function updateDailyTask(input: UpdateDailyTaskInput) {
    const { data, error } = await supabase
        .from('daily_tasks')
        .update({
            task_date: input.taskDate,
            title: input.title.trim(),
            category: cleanText(input.category),
            notes: cleanText(input.notes),
            updated_at: new Date().toISOString()
        })
        .eq('user_id', input.userId)
        .eq('id', input.taskId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export async function carryUnfinishedTasksToToday(userId: string, today: string) {
    const { data: unfinishedTasks, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .lt('task_date', today)
        .order('task_date', { ascending: true })
        .order('sort_order', { ascending: true })

    if (error) {
        throw error
    }

    const tasksToCopy = unfinishedTasks ?? []

    if (tasksToCopy.length === 0) {
        return []
    }

    const { data: todayTasks, error: todayTasksError } = await supabase
        .from('daily_tasks')
        .select('title, category')
        .eq('user_id', userId)
        .eq('task_date', today)
        .is('deleted_at', null)

    if (todayTasksError) {
        throw todayTasksError
    }

    const existingTodayKeys = new Set(
        (todayTasks ?? []).map((task) => `${task.title.trim().toLowerCase()}|${task.category ?? ''}`)
    )

    const copiedTasks = tasksToCopy.filter(
        (task) => !existingTodayKeys.has(`${task.title.trim().toLowerCase()}|${task.category ?? ''}`)
    )

    if (copiedTasks.length === 0) {
        return []
    }

    const { data, error: insertError } = await supabase
        .from('daily_tasks')
        .insert(
            copiedTasks.map((task, index) => ({
                user_id: userId,
                routine_item_id: task.routine_item_id,
                task_date: today,
                title: task.title,
                category: task.category,
                notes: task.notes,
                status: 'pending' as const,
                sort_order: index + 1,
                client_id: createClientId(),
                sync_status: 'synced' as const
            }))
        )
        .select()

    if (insertError) {
        throw insertError
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

export async function getDailyWellnessEntry(userId: string, entryDate: string) {
    const { data, error } = await supabase
        .from('daily_wellness_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', entryDate)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) {
        throw error
    }

    return data
}

export async function listDailyWellnessEntries(userId: string) {
    const { data, error } = await supabase
        .from('daily_wellness_entries')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('entry_date', { ascending: false })
        .limit(400)

    if (error) {
        throw error
    }

    return data
}

export async function upsertDailyWellnessEntry(input: UpsertDailyWellnessEntryInput) {
    const waterGoalMl = Math.max(0, Math.round(input.waterGoalMl))
    const waterLoggedMl = Math.max(0, Math.round(input.waterLoggedMl))

    const { data, error } = await supabase
        .from('daily_wellness_entries')
        .upsert(
            {
                user_id: input.userId,
                entry_date: input.entryDate,
                water_goal_ml: waterGoalMl,
                water_logged_ml: waterLoggedMl,
                creatine_completed: input.creatineCompleted,
                notes: cleanText(input.notes),
                client_id: `${input.userId}-${input.entryDate}`,
                sync_status: 'synced' as const
            },
            {
                onConflict: 'user_id,entry_date'
            }
        )
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}
