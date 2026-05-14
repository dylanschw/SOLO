import { describe, expect, it } from 'vitest'
import { calculateRecipePerServing } from '../lib/recipes'

describe('recipe utilities', () => {
    it('calculates per-serving nutrition from user-entered totals', () => {
        expect(
            calculateRecipePerServing({
                calories: 1200,
                proteinG: 90,
                carbsG: 150,
                fatG: 30,
                servings: 3,
            })
        ).toEqual({
            calories: 400,
            proteinG: 30,
            carbsG: 50,
            fatG: 10,
        })
    })

    it('keeps empty macro fields empty', () => {
        expect(
            calculateRecipePerServing({
                calories: null,
                proteinG: null,
                servings: 2,
            })
        ).toMatchObject({
            calories: null,
            proteinG: null,
        })
    })
})
