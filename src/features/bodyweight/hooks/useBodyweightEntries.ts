import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    createBodyweightEntry,
    deleteBodyweightEntry,
    listBodyweightEntries,
    updateBodyweightEntry,
    type CreateBodyweightEntryInput,
    type UpdateBodyweightEntryInput
} from '../lib/bodyweight'

export function useBodyweightEntries() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['bodyweight-entries', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load bodyweight entries without a signed-in user')
            }

            return listBodyweightEntries(user.id)
        },
        enabled: Boolean(user)
    })
}

export function useCreateBodyweightEntry() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<CreateBodyweightEntryInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot create bodyweight entry without a signed-in user')
            }

            return createBodyweightEntry({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bodyweight-entries', user?.id] })
        }
    })
}

export function useDeleteBodyweightEntry() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (entryId: string) => {
            if (!user) {
                throw new Error('Cannot delete bodyweight entry without a signed-in user')
            }

            return deleteBodyweightEntry(entryId, user.id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bodyweight-entries', user?.id] })
        }
    })
}

export function useUpdateBodyweightEntry() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpdateBodyweightEntryInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot update bodyweight entry without a signed-in user')
            }

            return updateBodyweightEntry({
                ...input,
                userId: user.id
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bodyweight-entries', user?.id] })
        }
    })
}
