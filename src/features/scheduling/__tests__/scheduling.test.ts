import { describe, expect, it } from 'vitest'
import { buildRoutineReorderUpdates, isTaskDateBefore } from '../lib/scheduling'

const routineItems = [
    {
        id: 'routine-1',
        sort_order: 1,
        created_at: '2026-05-01T12:00:00.000Z'
    },
    {
        id: 'routine-2',
        sort_order: 2,
        created_at: '2026-05-02T12:00:00.000Z'
    },
    {
        id: 'routine-3',
        sort_order: 3,
        created_at: '2026-05-03T12:00:00.000Z'
    }
]

describe('scheduling utilities', () => {
    it('detects tasks before today', () => {
        expect(isTaskDateBefore('2026-05-12', '2026-05-13')).toBe(true)
        expect(isTaskDateBefore('2026-05-13', '2026-05-13')).toBe(false)
        expect(isTaskDateBefore('2026-05-14', '2026-05-13')).toBe(false)
    })

    it('builds routine reorder updates', () => {
        expect(buildRoutineReorderUpdates(routineItems, 'routine-2', 'up')).toEqual([
            {
                routineItemId: 'routine-2',
                sortOrder: 1
            },
            {
                routineItemId: 'routine-1',
                sortOrder: 2
            }
        ])
    })

    it('does not build reorder updates outside the list bounds', () => {
        expect(buildRoutineReorderUpdates(routineItems, 'routine-1', 'up')).toEqual([])
        expect(buildRoutineReorderUpdates(routineItems, 'routine-3', 'down')).toEqual([])
    })
})
