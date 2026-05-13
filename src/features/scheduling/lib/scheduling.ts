import { supabase } from '../../../lib/supabase/client'
import type { DailyTaskStatus, Database } from '../../../lib/supabase/types'

export type RoutineItem = Database['public']['Tables']['routine_items']['Row']
export type DailyTask = Database['public']['Tables']['daily_tasks']['Row']

export type RoutineReorderDirection = 'up' | 'down'

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

export type ReorderRoutineItemsInput = {
    userId: string
    updates: Array<{
        routineItemId: string
        sortOrder: number
    }>
}

function createClientId() {
    return crypto.randomUUID()
}

function cleanText(value: string | null | undefined) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

export function isTaskDateBefore(taskDate: string, today: string) {
    return taskDate < today
}

export function buildRoutineReorderUpdates(
    items: Array<Pick<RoutineItem, 'id' | 'sort_order' | 'created_at'>>,
    routineItemId: string,
    direction: RoutineReorderDirection
) {
    const orderedItems = [...items].sort((a, b) => {
        const sortDifference = a.sort_order - b.sort_order

        if (sortDifference !== 0) {
            return sortDifference
        }

        return a.created_at.localeCompare(b.created_at)
    })
    const currentIndex = orderedItems.findIndex((item) => item.id === routineItemId)
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedItems.length) {
        return []
    }

    const reorderedItems = [...orderedItems]
    const [movedItem] = reorderedItems.splice(currentIndex, 1)

    reorderedItems.splice(nextIndex, 0, movedItem)

    return reorderedItems
        .map((item, index) => ({
            routineItemId: item.id,
            sortOrder: index + 1
        }))
        .filter((update) => orderedItems.find((item) => item.id === update.routineItemId)?.sort_order !== update.sortOrder)
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
    status: DailyTaskStatus
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

export async function reorderRoutineItems(input: ReorderRoutineItemsInput) {
    const updatedItems: RoutineItem[] = []

    for (const update of input.updates) {
        const { data, error } = await supabase
            .from('routine_items')
            .update({
                sort_order: update.sortOrder,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', input.userId)
            .eq('id', update.routineItemId)
            .select()
            .single()

        if (error) {
            throw error
        }

        updatedItems.push(data)
    }

    return updatedItems
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
                sort_order: (todayTasks?.length ?? 0) + index + 1,
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
                status: 'pending' as const,
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
