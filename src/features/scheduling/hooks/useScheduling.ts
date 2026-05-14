import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    archiveRoutineItem,
    createDailyTask,
    createRoutineItem,
    deleteDailyTask,
    generateTodayTasksFromRoutine,
    getDailyWellnessEntry,
    listDailyWellnessEntries,
    listDailyTasks,
    listRoutineItems,
    carryUnfinishedTasksToToday,
    upsertDailyWellnessEntry,
    updateDailyTask,
    updateRoutineItem,
    type UpsertDailyWellnessEntryInput,
    type UpdateDailyTaskInput,
    type UpdateRoutineItemInput,
    updateDailyTaskStatus
} from '../lib/scheduling'

export function useRoutineItems() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['routine-items', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot list routine items without a signed-in user')
            }

            return listRoutineItems(user.id)
        },
        enabled: Boolean(user)
    })
}

export function useDailyTasks(taskDate?: string) {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['daily-tasks', user?.id, taskDate ?? 'all'],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot list daily tasks without a signed-in user')
            }

            return listDailyTasks(user.id, taskDate)
        },
        enabled: Boolean(user)
    })
}

export function useDailyWellnessEntry(entryDate: string) {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['daily-wellness-entry', user?.id, entryDate],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load daily wellness without a signed-in user')
            }

            return getDailyWellnessEntry(user.id, entryDate)
        },
        enabled: Boolean(user && entryDate)
    })
}

export function useDailyWellnessEntries() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['daily-wellness-entries', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load daily wellness entries without a signed-in user')
            }

            return listDailyWellnessEntries(user.id)
        },
        enabled: Boolean(user)
    })
}

export function useCreateRoutineItem() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: {
            title: string
            category?: string | null
            notes?: string | null
            sortOrder?: number
        }) => {
            if (!user) {
                throw new Error('Cannot create routine item without a signed-in user')
            }

            return createRoutineItem({
                userId: user.id,
                ...input
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routine-items', user?.id] })
        }
    })
}

export function useArchiveRoutineItem() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (routineItemId: string) => {
            if (!user) {
                throw new Error('Cannot archive routine item without a signed-in user')
            }

            return archiveRoutineItem(user.id, routineItemId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routine-items', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['daily-tasks', user?.id] })
        }
    })
}

export function useCreateDailyTask() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: {
            taskDate: string
            title: string
            category?: string | null
            notes?: string | null
            routineItemId?: string | null
            sortOrder?: number
        }) => {
            if (!user) {
                throw new Error('Cannot create daily task without a signed-in user')
            }

            return createDailyTask({
                userId: user.id,
                ...input
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-tasks', user?.id] })
        }
    })
}

export function useUpdateDailyTaskStatus() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: {
            taskId: string
            status: 'pending' | 'completed' | 'skipped'
        }) => {
            if (!user) {
                throw new Error('Cannot update daily task without a signed-in user')
            }

            return updateDailyTaskStatus(user.id, input.taskId, input.status)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-tasks', user?.id] })
        }
    })
}

export function useDeleteDailyTask() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (taskId: string) => {
            if (!user) {
                throw new Error('Cannot delete daily task without a signed-in user')
            }

            return deleteDailyTask(user.id, taskId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-tasks', user?.id] })
        }
    })
}

export function useUpdateRoutineItem() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpdateRoutineItemInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot update routine item without a signed-in user')
            }

            return updateRoutineItem({
                userId: user.id,
                ...input
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routine-items', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['daily-tasks', user?.id] })
        }
    })
}

export function useUpdateDailyTask() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpdateDailyTaskInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot update daily task without a signed-in user')
            }

            return updateDailyTask({
                userId: user.id,
                ...input
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-tasks', user?.id] })
        }
    })
}

export function useCarryUnfinishedTasksToToday() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (today: string) => {
            if (!user) {
                throw new Error('Cannot carry tasks without a signed-in user')
            }

            return carryUnfinishedTasksToToday(user.id, today)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-tasks', user?.id] })
        }
    })
}

export function useGenerateTodayTasksFromRoutine() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (taskDate: string) => {
            if (!user) {
                throw new Error('Cannot generate daily tasks without a signed-in user')
            }

            return generateTodayTasksFromRoutine(user.id, taskDate)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-tasks', user?.id] })
        }
    })
}

export function useUpsertDailyWellnessEntry() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertDailyWellnessEntryInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save daily wellness without a signed-in user')
            }

            return upsertDailyWellnessEntry({
                userId: user.id,
                ...input
            })
        },
        onSuccess: (_entry, variables) => {
            queryClient.invalidateQueries({ queryKey: ['daily-wellness-entry', user?.id, variables.entryDate] })
            queryClient.invalidateQueries({ queryKey: ['daily-wellness-entries', user?.id] })
        }
    })
}
