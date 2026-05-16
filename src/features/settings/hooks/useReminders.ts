import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    listReminderPreferences,
    upsertReminderPreference,
    type UpsertReminderPreferenceInput,
} from '../lib/reminders'

export function useReminderPreferences() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['reminder-preferences', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load reminders without a signed-in user')
            }

            return listReminderPreferences(user.id)
        },
        enabled: Boolean(user),
    })
}

export function useUpsertReminderPreference() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertReminderPreferenceInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save reminder without a signed-in user')
            }

            return upsertReminderPreference({
                userId: user.id,
                ...input,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminder-preferences', user?.id] })
        },
    })
}
