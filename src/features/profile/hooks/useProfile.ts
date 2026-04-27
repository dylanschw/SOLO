import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import { getProfile, updateProfile, type ProfileUpdateInput } from '../lib/profile'

export function useProfile() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['profile', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load profile without a signed-in user')
            }

            return getProfile(user)
        },
        enabled: Boolean(user)
    })
}

export function useUpdateProfile() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (values: ProfileUpdateInput) => {
            if (!user) {
                throw new Error('Cannot update profile without a signed-in user')
            }

            return updateProfile(user.id, values)
        },
        onSuccess: (profile) => {
            queryClient.setQueryData(['profile', profile.id], profile)
        }
    })
}