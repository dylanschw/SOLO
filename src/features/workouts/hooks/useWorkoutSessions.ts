import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    completeWorkoutSession,
    createWorkoutSet,
    listWorkoutSessions,
    listWorkoutSets,
    startWorkoutSession,
    type CreateWorkoutSetInput,
    type StartWorkoutSessionInput
} from '../lib/workout-sessions'

export function useWorkoutSessions() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['workout-sessions', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load workout sessions without a signed-in user')
            }

            return listWorkoutSessions(user.id)
        },
        enabled: Boolean(user)
    })
}

export function useWorkoutSets(sessionId: string | null) {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['workout-sets', user?.id, sessionId],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load workout sets without a signed-in user')
            }

            return listWorkoutSets(user.id, sessionId)
        },
        enabled: Boolean(user)
    })
}

export function useStartWorkoutSession() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<StartWorkoutSessionInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot start workout without a signed-in user')
            }

            return startWorkoutSession({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-sessions', user?.id] })
        }
    })
}

export function useCreateWorkoutSet() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<CreateWorkoutSetInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot log set without a signed-in user')
            }

            return createWorkoutSet({
                ...input,
                userId: user.id
            })
        },
        onSuccess: (_set, variables) => {
            queryClient.invalidateQueries({ queryKey: ['workout-sets', user?.id, variables.workoutSessionId] })
            queryClient.invalidateQueries({ queryKey: ['workout-sessions', user?.id] })
        }
    })
}

export function useCompleteWorkoutSession() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: { sessionId: string; notes?: string | null }) => {
            if (!user) {
                throw new Error('Cannot complete workout without a signed-in user')
            }

            return completeWorkoutSession(user.id, input.sessionId, input.notes)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-sessions', user?.id] })
        }
    })
}