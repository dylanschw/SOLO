import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    listHealthMetricEntries,
    upsertHealthMetricEntry,
    type UpsertHealthMetricEntryInput,
} from '../lib/health-metrics'

export function useHealthMetricEntries() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['health-metric-entries', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load health metrics without a signed-in user')
            }

            return listHealthMetricEntries(user.id)
        },
        enabled: Boolean(user),
    })
}

export function useUpsertHealthMetricEntry() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertHealthMetricEntryInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save health metric without a signed-in user')
            }

            return upsertHealthMetricEntry({
                userId: user.id,
                ...input,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['health-metric-entries', user?.id] })
        },
    })
}
