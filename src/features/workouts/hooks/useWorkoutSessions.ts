import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    completeWorkoutSession,
    createWorkoutSet,
    listWorkoutSessions,
    listWorkoutSets,
    listAllWorkoutSets,
    startWorkoutSession,
    deleteWorkoutSet,
    updateWorkoutSet,
    type UpdateWorkoutSetInput,
    type CreateWorkoutSetInput,
    deleteWorkoutSession,
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

export function useDeleteWorkoutSession() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: string) => {
            if (!user) {
                throw new Error('Cannot delete workout session without a signed-in user');
            }

            return deleteWorkoutSession(user.id, sessionId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-sessions', user?.id] });
        },
    });
}

export function useAllWorkoutSets() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['all-workout-sets', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot list workout sets without a signed-in user');
            }

            return listAllWorkoutSets(user.id);
        },
        enabled: Boolean(user),
    });
}

export function useUpdateWorkoutSet() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: Omit<UpdateWorkoutSetInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot update workout set without a signed-in user');
            }

            return updateWorkoutSet({
                ...input,
                userId: user.id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-sets', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['all-workout-sets', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['workout-sessions', user?.id] });
        },
    });
}

export function useDeleteWorkoutSet() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (setId: string) => {
            if (!user) {
                throw new Error('Cannot delete workout set without a signed-in user');
            }

            return deleteWorkoutSet(user.id, setId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workout-sets', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['all-workout-sets', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['workout-sessions', user?.id] });
        },
    });
}