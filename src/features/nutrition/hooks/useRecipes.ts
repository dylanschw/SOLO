import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import {
    deleteMealPrepTemplate,
    deleteRecipe,
    listMealPrepTemplates,
    listRecipes,
    updateRecipeFavorite,
    upsertMealPrepTemplate,
    upsertRecipe,
    type UpsertMealPrepTemplateInput,
    type UpsertRecipeInput,
} from '../lib/recipes'

export function useRecipes() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['recipes', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load recipes without a signed-in user')
            }

            return listRecipes(user.id)
        },
        enabled: Boolean(user),
    })
}

export function useMealPrepTemplates() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['meal-prep-templates', user?.id],
        queryFn: () => {
            if (!user) {
                throw new Error('Cannot load meal prep templates without a signed-in user')
            }

            return listMealPrepTemplates(user.id)
        },
        enabled: Boolean(user),
    })
}

export function useUpsertRecipe() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertRecipeInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save recipe without a signed-in user')
            }

            return upsertRecipe({
                userId: user.id,
                ...input,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes', user?.id] })
        },
    })
}

export function useDeleteRecipe() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (recipeId: string) => {
            if (!user) {
                throw new Error('Cannot delete recipe without a signed-in user')
            }

            return deleteRecipe(user.id, recipeId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes', user?.id] })
        },
    })
}

export function useUpdateRecipeFavorite() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: { recipeId: string; isFavorite: boolean }) => {
            if (!user) {
                throw new Error('Cannot update recipe without a signed-in user')
            }

            return updateRecipeFavorite(user.id, input.recipeId, input.isFavorite)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes', user?.id] })
        },
    })
}

export function useUpsertMealPrepTemplate() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: Omit<UpsertMealPrepTemplateInput, 'userId'>) => {
            if (!user) {
                throw new Error('Cannot save meal prep template without a signed-in user')
            }

            return upsertMealPrepTemplate({
                userId: user.id,
                ...input,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal-prep-templates', user?.id] })
        },
    })
}

export function useDeleteMealPrepTemplate() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (templateId: string) => {
            if (!user) {
                throw new Error('Cannot delete meal prep template without a signed-in user')
            }

            return deleteMealPrepTemplate(user.id, templateId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meal-prep-templates', user?.id] })
        },
    })
}
