import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    listSupplementMedicationItems,
    listSupplementMedicationLogs,
    setSupplementMedicationItemArchived,
    upsertSupplementMedicationItem,
    upsertSupplementMedicationLog,
    type UpsertSupplementMedicationItemInput,
    type UpsertSupplementMedicationLogInput,
} from '../lib/supplements-medications'

export function useSupplementMedicationItems() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['supplement-medication-items', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load supplements or medications without a signed-in user')
            }

            return listSupplementMedicationItems(user.id)
        },
        enabled: Boolean(user),
    })
}

export function useSupplementMedicationLogs() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['supplement-medication-logs', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load supplement or medication logs without a signed-in user')
            }

            return listSupplementMedicationLogs(user.id)
        },
        enabled: Boolean(user),
    })
}

export function useUpsertSupplementMedicationItem() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertSupplementMedicationItemInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save supplement or medication without a signed-in user')
            }

            return upsertSupplementMedicationItem({
                userId: user.id,
                ...input,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supplement-medication-items', user?.id] })
        },
    })
}

export function useSetSupplementMedicationItemArchived() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: { itemId: string; isArchived: boolean }) => {
            if (!user) {
                throw new Error('Cannot archive supplement or medication without a signed-in user')
            }

            return setSupplementMedicationItemArchived(user.id, input.itemId, input.isArchived)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supplement-medication-items', user?.id] })
        },
    })
}

export function useUpsertSupplementMedicationLog() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertSupplementMedicationLogInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save supplement or medication log without a signed-in user')
            }

            return upsertSupplementMedicationLog({
                userId: user.id,
                ...input,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supplement-medication-logs', user?.id] })
        },
    })
}
