import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    addPlannedExercise,
    createExercise,
    createWorkoutDay,
    createWorkoutProgram,
    getActiveWorkoutProgram,
    listExercises,
    listPlannedExercises,
    listWorkoutDays,
    listWorkoutPrograms,
    setActiveWorkoutProgram,
    type AddPlannedExerciseInput,
    type CreateExerciseInput,
    type CreateProgramInput,
    type CreateWorkoutDayInput
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