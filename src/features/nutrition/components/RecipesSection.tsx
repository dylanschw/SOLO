import { BookOpen, CalendarDays, Edit3, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import {
    useDeleteMealPrepTemplate,
    useDeleteRecipe,
    useMealPrepTemplates,
    useRecipes,
    useUpsertMealPrepTemplate,
    useUpsertRecipe,
} from '../hooks/useRecipes'
import { calculateRecipePerServing, type MealPrepTemplate, type Recipe } from '../lib/recipes'

type RecipeFormState = {
    id: string | null
    name: string
    calories: string
    proteinG: string
    carbsG: string
    fatG: string
    servings: string
    ingredients: string
    instructions: string
    notes: string
    category: string
}

type MealPrepFormState = {
    id: string | null
    name: string
    mealsCovered: string
    daysPlanned: string
    mealsText: string
    groceryNotes: string
    prepNotes: string
    notes: string
}

const emptyRecipeForm: RecipeFormState = {
    id: null,
    name: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    servings: '1',
    ingredients: '',
    instructions: '',
    notes: '',
    category: '',
}

const emptyMealPrepForm: MealPrepFormState = {
    id: null,
    name: '',
    mealsCovered: '',
    daysPlanned: '1',
    mealsText: '',
    groceryNotes: '',
    prepNotes: '',
    notes: '',
}

function optionalNumberFromInput(value: string) {
    if (!value.trim()) {
        return null
    }

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
}

function numberToInputValue(value: number | null) {
    return value === null ? '' : String(value)
}

function formatMacro(value: number | null, suffix: string) {
    return value === null ? '--' : `${value}${suffix}`
}

export function RecipesSection() {
    const recipesQuery = useRecipes()
    const mealPrepTemplatesQuery = useMealPrepTemplates()
    const upsertRecipe = useUpsertRecipe()
    const deleteRecipe = useDeleteRecipe()
    const upsertMealPrepTemplate = useUpsertMealPrepTemplate()
    const deleteMealPrepTemplate = useDeleteMealPrepTemplate()

    const recipes = recipesQuery.data ?? []
    const mealPrepTemplates = mealPrepTemplatesQuery.data ?? []

    const [recipeForm, setRecipeForm] = useState<RecipeFormState>(emptyRecipeForm)
    const [mealPrepForm, setMealPrepForm] = useState<MealPrepFormState>(emptyMealPrepForm)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    function resetRecipeForm() {
        setRecipeForm(emptyRecipeForm)
    }

    function resetMealPrepForm() {
        setMealPrepForm(emptyMealPrepForm)
    }

    function editRecipe(recipe: Recipe) {
        setRecipeForm({
            id: recipe.id,
            name: recipe.name,
            calories: numberToInputValue(recipe.calories),
            proteinG: numberToInputValue(recipe.protein_g),
            carbsG: numberToInputValue(recipe.carbs_g),
            fatG: numberToInputValue(recipe.fat_g),
            servings: String(recipe.servings),
            ingredients: recipe.ingredients ?? '',
            instructions: recipe.instructions ?? '',
            notes: recipe.notes ?? '',
            category: recipe.category ?? '',
        })
    }

    function editMealPrepTemplate(template: MealPrepTemplate) {
        setMealPrepForm({
            id: template.id,
            name: template.name,
            mealsCovered: template.meals_covered ?? '',
            daysPlanned: String(template.days_planned),
            mealsText: template.meals_text ?? '',
            groceryNotes: template.grocery_notes ?? '',
            prepNotes: template.prep_notes ?? '',
            notes: template.notes ?? '',
        })
    }

    async function handleSaveRecipe(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatusMessage(null)
        setErrorMessage(null)

        const servings = Number(recipeForm.servings)

        if (!recipeForm.name.trim()) {
            setErrorMessage('Recipe name is required.')
            return
        }

        if (!Number.isFinite(servings) || servings <= 0) {
            setErrorMessage('Servings must be greater than 0.')
            return
        }

        try {
            await upsertRecipe.mutateAsync({
                recipeId: recipeForm.id,
                name: recipeForm.name,
                calories: optionalNumberFromInput(recipeForm.calories),
                proteinG: optionalNumberFromInput(recipeForm.proteinG),
                carbsG: optionalNumberFromInput(recipeForm.carbsG),
                fatG: optionalNumberFromInput(recipeForm.fatG),
                servings,
                ingredients: recipeForm.ingredients,
                instructions: recipeForm.instructions,
                notes: recipeForm.notes,
                category: recipeForm.category,
            })

            resetRecipeForm()
            setStatusMessage('Recipe saved.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not save recipe.')
        }
    }

    async function handleDeleteRecipe(recipeId: string) {
        const confirmed = window.confirm('Delete this recipe?')

        if (!confirmed) {
            return
        }

        try {
            await deleteRecipe.mutateAsync(recipeId)
            setStatusMessage('Recipe deleted.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not delete recipe.')
        }
    }

    async function handleSaveMealPrepTemplate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatusMessage(null)
        setErrorMessage(null)

        const daysPlanned = Number(mealPrepForm.daysPlanned)

        if (!mealPrepForm.name.trim()) {
            setErrorMessage('Meal prep template name is required.')
            return
        }

        if (!Number.isInteger(daysPlanned) || daysPlanned < 1 || daysPlanned > 31) {
            setErrorMessage('Days planned must be a whole number from 1 to 31.')
            return
        }

        try {
            await upsertMealPrepTemplate.mutateAsync({
                templateId: mealPrepForm.id,
                name: mealPrepForm.name,
                mealsCovered: mealPrepForm.mealsCovered,
                daysPlanned,
                mealsText: mealPrepForm.mealsText,
                groceryNotes: mealPrepForm.groceryNotes,
                prepNotes: mealPrepForm.prepNotes,
                notes: mealPrepForm.notes,
            })

            resetMealPrepForm()
            setStatusMessage('Meal prep template saved.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not save meal prep template.')
        }
    }

    async function handleDeleteMealPrepTemplate(templateId: string) {
        const confirmed = window.confirm('Delete this meal prep template?')

        if (!confirmed) {
            return
        }

        try {
            await deleteMealPrepTemplate.mutateAsync(templateId)
            setStatusMessage('Meal prep template deleted.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not delete meal prep template.')
        }
    }

    return (
        <div className="mt-4 grid gap-4">
            {statusMessage ? (
                <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
                    {statusMessage}
                </p>
            ) : null}

            {errorMessage ? (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
                    {errorMessage}
                </p>
            ) : null}

            <form
                onSubmit={handleSaveRecipe}
                className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <BookOpen className="size-5 text-emerald-600" />
                        <h2 className="text-xl font-bold">{recipeForm.id ? 'Edit recipe' : 'Recipe library'}</h2>
                    </div>
                    {recipeForm.id ? (
                        <button
                            type="button"
                            onClick={resetRecipeForm}
                            className="grid size-10 shrink-0 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-neutral-900"
                            aria-label="Cancel recipe edit"
                        >
                            <X className="size-4" />
                        </button>
                    ) : null}
                </div>

                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                    Save your own recipes and macro totals. SOLO does not include built-in recipe content here.
                </p>

                <div className="mt-5 grid gap-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Name</span>
                            <input
                                value={recipeForm.name}
                                onChange={(event) => setRecipeForm((form) => ({ ...form, name: event.target.value }))}
                                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Category/tag</span>
                            <input
                                value={recipeForm.category}
                                onChange={(event) => setRecipeForm((form) => ({ ...form, category: event.target.value }))}
                                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {[
                            ['calories', 'Calories'],
                            ['proteinG', 'Protein'],
                            ['carbsG', 'Carbs'],
                            ['fatG', 'Fat'],
                            ['servings', 'Servings'],
                        ].map(([field, label]) => (
                            <label key={field} className="grid gap-2">
                                <span className="text-sm font-semibold">{label}</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    step={field === 'servings' ? '0.5' : '1'}
                                    value={recipeForm[field as keyof RecipeFormState] ?? ''}
                                    onChange={(event) =>
                                        setRecipeForm((form) => ({ ...form, [field]: event.target.value }))
                                    }
                                    className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </label>
                        ))}
                    </div>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Ingredients</span>
                        <textarea
                            value={recipeForm.ingredients}
                            onChange={(event) => setRecipeForm((form) => ({ ...form, ingredients: event.target.value }))}
                            rows={4}
                            className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Instructions</span>
                        <textarea
                            value={recipeForm.instructions}
                            onChange={(event) => setRecipeForm((form) => ({ ...form, instructions: event.target.value }))}
                            rows={4}
                            className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Notes</span>
                        <textarea
                            value={recipeForm.notes}
                            onChange={(event) => setRecipeForm((form) => ({ ...form, notes: event.target.value }))}
                            rows={2}
                            className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={upsertRecipe.isPending}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Save className="size-4" />
                        {upsertRecipe.isPending ? 'Saving...' : 'Save recipe'}
                    </button>
                </div>
            </form>

            <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <h2 className="text-xl font-bold">Saved recipes</h2>

                {recipesQuery.isLoading ? (
                    <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Loading recipes...</p>
                ) : null}

                {recipes.length === 0 && !recipesQuery.isLoading ? (
                    <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        No recipes yet. Add your own recipe above to build a reusable library.
                    </p>
                ) : null}

                <div className="mt-4 grid gap-3">
                    {recipes.map((recipe) => {
                        const perServing = calculateRecipePerServing({
                            calories: recipe.calories,
                            proteinG: recipe.protein_g,
                            carbsG: recipe.carbs_g,
                            fatG: recipe.fat_g,
                            servings: recipe.servings,
                        })

                        return (
                            <div
                                key={recipe.id}
                                className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="break-words font-semibold">{recipe.name}</p>
                                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                            {recipe.category || 'No category'} - {recipe.servings} servings
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => editRecipe(recipe)}
                                            className="grid size-10 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-neutral-900"
                                            aria-label={`Edit ${recipe.name}`}
                                        >
                                            <Edit3 className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteRecipe(recipe.id)}
                                            disabled={deleteRecipe.isPending}
                                            className="grid size-10 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-400 dark:hover:bg-neutral-900"
                                            aria-label={`Delete ${recipe.name}`}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                                        <p className="text-xs text-stone-500 dark:text-stone-400">Calories/serving</p>
                                        <p className="font-bold">{formatMacro(perServing.calories, '')}</p>
                                    </div>
                                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                                        <p className="text-xs text-stone-500 dark:text-stone-400">Protein</p>
                                        <p className="font-bold">{formatMacro(perServing.proteinG, 'g')}</p>
                                    </div>
                                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                                        <p className="text-xs text-stone-500 dark:text-stone-400">Carbs</p>
                                        <p className="font-bold">{formatMacro(perServing.carbsG, 'g')}</p>
                                    </div>
                                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                                        <p className="text-xs text-stone-500 dark:text-stone-400">Fat</p>
                                        <p className="font-bold">{formatMacro(perServing.fatG, 'g')}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </article>

            <form
                onSubmit={handleSaveMealPrepTemplate}
                className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <CalendarDays className="size-5 text-emerald-600" />
                        <h2 className="text-xl font-bold">
                            {mealPrepForm.id ? 'Edit meal prep template' : 'Meal prep templates'}
                        </h2>
                    </div>
                    {mealPrepForm.id ? (
                        <button
                            type="button"
                            onClick={resetMealPrepForm}
                            className="grid size-10 shrink-0 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-neutral-900"
                            aria-label="Cancel meal prep edit"
                        >
                            <X className="size-4" />
                        </button>
                    ) : null}
                </div>

                <div className="mt-5 grid gap-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Name</span>
                            <input
                                value={mealPrepForm.name}
                                onChange={(event) => setMealPrepForm((form) => ({ ...form, name: event.target.value }))}
                                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Days</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                max="31"
                                value={mealPrepForm.daysPlanned}
                                onChange={(event) =>
                                    setMealPrepForm((form) => ({ ...form, daysPlanned: event.target.value }))
                                }
                                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>
                    </div>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Meals covered</span>
                        <input
                            value={mealPrepForm.mealsCovered}
                            onChange={(event) =>
                                setMealPrepForm((form) => ({ ...form, mealsCovered: event.target.value }))
                            }
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Meals</span>
                        <textarea
                            value={mealPrepForm.mealsText}
                            onChange={(event) =>
                                setMealPrepForm((form) => ({ ...form, mealsText: event.target.value }))
                            }
                            rows={3}
                            className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                    </label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Grocery notes</span>
                            <textarea
                                value={mealPrepForm.groceryNotes}
                                onChange={(event) =>
                                    setMealPrepForm((form) => ({ ...form, groceryNotes: event.target.value }))
                                }
                                rows={3}
                                className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="text-sm font-semibold">Prep notes</span>
                            <textarea
                                value={mealPrepForm.prepNotes}
                                onChange={(event) =>
                                    setMealPrepForm((form) => ({ ...form, prepNotes: event.target.value }))
                                }
                                rows={3}
                                className="w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={upsertMealPrepTemplate.isPending}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Save className="size-4" />
                        {upsertMealPrepTemplate.isPending ? 'Saving...' : 'Save meal prep template'}
                    </button>
                </div>
            </form>

            <article className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <h2 className="text-xl font-bold">Saved meal prep templates</h2>

                {mealPrepTemplates.length === 0 && !mealPrepTemplatesQuery.isLoading ? (
                    <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        No meal prep templates yet. Create your own reusable plan above.
                    </p>
                ) : null}

                <div className="mt-4 grid gap-3">
                    {mealPrepTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="break-words font-semibold">{template.name}</p>
                                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                        {template.days_planned} day{template.days_planned === 1 ? '' : 's'}
                                        {template.meals_covered ? ` - ${template.meals_covered}` : ''}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => editMealPrepTemplate(template)}
                                        className="grid size-10 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-neutral-900"
                                        aria-label={`Edit ${template.name}`}
                                    >
                                        <Edit3 className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteMealPrepTemplate(template.id)}
                                        disabled={deleteMealPrepTemplate.isPending}
                                        className="grid size-10 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-400 dark:hover:bg-neutral-900"
                                        aria-label={`Delete ${template.name}`}
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                            {template.meals_text ? (
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600 dark:text-stone-300">
                                    {template.meals_text}
                                </p>
                            ) : null}
                        </div>
                    ))}
                </div>
            </article>
        </div>
    )
}
