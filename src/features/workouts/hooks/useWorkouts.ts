import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    addPlannedExercise,
    archiveWorkoutProgram,
    createExercise,
    createWorkoutDay,
    createWorkoutProgram,
    deletePlannedExercise,
    deleteWorkoutDay,
    getActiveWorkoutProgram,
    listExercises,
    listPlannedExercises,
    listWorkoutDays,
    listWorkoutPrograms,
    setActiveWorkoutProgram,
    updatePlannedExercise,
    updateWorkoutDay,
    updateWorkoutProgram,
    type AddPlannedExerciseInput,
    type CreateExerciseInput,
    type CreateProgramInput,
    type CreateWorkoutDayInput,
    type UpdatePlannedExerciseInput,
    type UpdateProgramInput,
    type UpdateWorkoutDayInput
} from '../lib/workouts'

export function useWorkoutPrograms() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['workout-programs', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load workout programs without a signed-in user')
            }

            return listWorkoutPrograms(user.id)
        },
        enabled: Boolean(user)
    })
}

export function useActiveWorkoutProgram() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['active-workout-program', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load active workout program without a signed-in user')
            }

            return getActiveWorkoutProgram(user.id)
        },
        enabled: Boolean(user)
    })
}

export function useWorkoutDays(programId: string | null) {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['workout-days', user?.id, programId],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load workout days without a signed-in user')
            }

            return listWorkoutDays(user.id, programId)
        },
        enabled: Boolean(user)
    })
}

export function useExercises() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['exercises', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load exercises without a signed-in user')
            }

            return listExercises(user.id)
        },
        enabled: Boolean(user)
    })
}

export function usePlannedExercises(workoutDayIds: string[]) {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['planned-exercises', user?.id, workoutDayIds],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load planned exercises without a signed-in user')
            }

            return listPlannedExercises(user.id, workoutDayIds)
        },
        enabled: Boolean(user)
    })
}

export function useCreateWorkoutProgram() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<CreateProgramInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot create workout program without a signed-in user')
            }

            return createWorkoutProgram({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-programs', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['active-workout-program', user?.id] })
        }
    })
}

export function useSetActiveWorkoutProgram() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (programId: string) => {
            if (!user) {
                throw new Error('Cannot set active program without a signed-in user')
            }

            return setActiveWorkoutProgram(user.id, programId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-programs', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['active-workout-program', user?.id] })
        }
    })
}

export function useCreateWorkoutDay() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<CreateWorkoutDayInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot create workout day without a signed-in user')
            }

            return createWorkoutDay({
                ...input,
                userId: user.id
            })
        },
        onSuccess: (_day, variables) => {
            queryClient.invalidateQueries({ queryKey: ['workout-days', user?.id, variables.programId] })
        }
    })
}

export function useCreateExercise() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<CreateExerciseInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot create exercise without a signed-in user')
            }

            return createExercise({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exercises', user?.id] })
        }
    })
}

export function useAddPlannedExercise() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<AddPlannedExerciseInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot add planned exercise without a signed-in user')
            }

            return addPlannedExercise({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['planned-exercises', user?.id] })
        }
    })
}

export function useUpdateWorkoutProgram() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpdateProgramInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot update workout program without a signed-in user')
            }

            return updateWorkoutProgram({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-programs', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['active-workout-program', user?.id] })
        }
    })
}

export function useArchiveWorkoutProgram() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (programId: string) => {
            if (!user) {
                throw new Error('Cannot archive workout program without a signed-in user')
            }

            return archiveWorkoutProgram(user.id, programId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-programs', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['active-workout-program', user?.id] })
        }
    })
}

export function useUpdateWorkoutDay() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpdateWorkoutDayInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot update workout day without a signed-in user')
            }

            return updateWorkoutDay({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-days', user?.id] })
        }
    })
}

export function useDeleteWorkoutDay() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (dayId: string) => {
            if (!user) {
                throw new Error('Cannot delete workout day without a signed-in user')
            }

            return deleteWorkoutDay(user.id, dayId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-days', user?.id] })
        }
    })
}

export function useUpdatePlannedExercise() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpdatePlannedExerciseInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot update planned exercise without a signed-in user')
            }

            return updatePlannedExercise({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['planned-exercises', user?.id] })
        }
    })
}

export function useDeletePlannedExercise() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (plannedExerciseId: string) => {
            if (!user) {
                throw new Error('Cannot delete planned exercise without a signed-in user')
            }

            return deletePlannedExercise(user.id, plannedExerciseId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['planned-exercises', user?.id] })
        }
    })
}