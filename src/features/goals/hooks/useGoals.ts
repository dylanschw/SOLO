import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    listGoalTargets,
    upsertGoalTarget,
    type UpsertGoalTargetInput,
} from '../lib/goals'

export function useGoalTargets() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['goal-targets', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load goals without a signed-in user')
            }

            return listGoalTargets(user.id)
        },
        enabled: Boolean(user),
    })
}

export function useUpsertGoalTarget() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertGoalTargetInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save goal without a signed-in user')
            }

            return upsertGoalTarget({
                userId: user.id,
                ...input,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal-targets', user?.id] })
        },
    })
}
