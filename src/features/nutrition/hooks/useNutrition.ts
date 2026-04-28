import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    deleteNutritionLog,
    getActiveNutritionTarget,
    listNutritionLogs,
    upsertNutritionLog,
    upsertNutritionTarget,
    type UpsertNutritionLogInput,
    type UpsertNutritionTargetInput
} from '../lib/nutrition'

export function useNutritionLogs() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['nutrition-logs', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load nutrition logs without a signed-in user')
            }

            return listNutritionLogs(user.id)
        },
        enabled: Boolean(user)
    })
}

export function useActiveNutritionTarget() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['nutrition-target', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load nutrition target without a signed-in user')
            }

            return getActiveNutritionTarget(user.id)
        },
        enabled: Boolean(user)
    })
}

export function useUpsertNutritionLog() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertNutritionLogInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save nutrition log without a signed-in user')
            }

            return upsertNutritionLog({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nutrition-logs', user?.id] })
        }
    })
}

export function useUpsertNutritionTarget() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertNutritionTargetInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save nutrition target without a signed-in user')
            }

            return upsertNutritionTarget({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nutrition-target', user?.id] })
        }
    })
}
export function useDeleteNutritionLog() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (logId: string) => {
            if (!user) {
                throw new Error('Cannot delete nutrition log without a signed-in user');
            }

            return deleteNutritionLog(user.id, logId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nutrition-logs', user?.id] });
        },
    });
}