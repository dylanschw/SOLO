import { describe, expect, it } from 'vitest'
import {
    buildActivityHeatmap,
    countActivityByDate,
    getHeatmapLevel,
} from '../lib/activity-heatmap'

describe('activity heatmap utilities', () => {
    it('counts activity by date', () => {
        const counts = countActivityByDate(
            [
                { date: '2026-05-14' },
                { date: '2026-05-14' },
                { date: '2026-05-13' },
            ],
            (item) => item.date
        )

        expect(counts.get('2026-05-14')).toBe(2)
        expect(counts.get('2026-05-13')).toBe(1)
    })

    it('maps counts to levels', () => {
        expect(getHeatmapLevel(0)).toBe(0)
        expect(getHeatmapLevel(1)).toBe(1)
        expect(getHeatmapLevel(3)).toBe(2)
        expect(getHeatmapLevel(5)).toBe(3)
        expect(getHeatmapLevel(8)).toBe(4)
    })

    it('builds fixed weeks ending on the selected week', () => {
        const weeks = buildActivityHeatmap({
            endDate: '2026-05-14',
            weekCount: 2,
            countsByDate: new Map([['2026-05-14', 2]]),
        })

        expect(weeks).toHaveLength(2)
        expect(weeks[1].days).toHaveLength(7)
        expect(weeks[1].days.find((day) => day.date === '2026-05-14')?.count).toBe(2)
    })
})
