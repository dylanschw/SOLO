import { describe, expect, it } from 'vitest'
import { parseWorkoutPlainText } from '../lib/workout-text-import'

describe('plain text workout import parser', () => {
    it('parses days and exercises from plain text', () => {
        const text = `Day 1 Chest / Back
Incline Dumbbell Press 3x8-12 RPE 8 120s rest
Chest Supported Row 3x8-12 RPE 8

Day 2 Rest`

        const draft = parseWorkoutPlainText(text)

        expect(draft.rotationLengthDays).toBe(2)
        expect(draft.days).toHaveLength(2)
        expect(draft.days[0].name).toBe('Chest / Back')
        expect(draft.days[0].exercises).toHaveLength(2)
        expect(draft.days[0].exercises[0]).toMatchObject({
            name: 'Incline Dumbbell Press',
            sets: 3,
            minReps: 8,
            maxReps: 12,
            targetRpe: 8,
            restSeconds: 120
        })
        expect(draft.days[1].isRestDay).toBe(true)
    })

    it('detects top set backoff exercises', () => {
        const text = `Day 1 Chest
Top Set Bench Press 1x6-8 RPE 9 back off 10%`

        const draft = parseWorkoutPlainText(text)

        expect(draft.days[0].exercises[0]).toMatchObject({
            setType: 'top_set_backoff',
            backoffPercent: 10
        })
    })

    it('throws when text is empty', () => {
        expect(() => parseWorkoutPlainText('')).toThrow(/paste a workout routine/i)
    })
})