import { describe, expect, it } from 'vitest'
import {
    buildActivityHeatmap,
    calculateActivityHeatmapStats,
    combineActivityCounts,
    countActivityByDate,
    getActivityHeatmapRangeConfig,
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

    it('calculates streaks and completion percentage', () => {
        const stats = calculateActivityHeatmapStats({
            endDate: '2026-05-14',
            dayCount: 7,
            countsByDate: new Map([
                ['2026-05-08', 1],
                ['2026-05-09', 1],
                ['2026-05-11', 2],
                ['2026-05-13', 1],
                ['2026-05-14', 1],
            ]),
        })

        expect(stats.activeDays).toBe(5)
        expect(stats.totalCount).toBe(6)
        expect(stats.currentStreak).toBe(2)
        expect(stats.longestStreak).toBe(2)
        expect(stats.completionPercentage).toBe(71)
    })

    it('combines activity counts from multiple sources', () => {
        const combined = combineActivityCounts([
            new Map([['2026-05-14', 1]]),
            new Map([
                ['2026-05-14', 2],
                ['2026-05-13', 1],
            ]),
        ])

        expect(combined.get('2026-05-14')).toBe(3)
        expect(combined.get('2026-05-13')).toBe(1)
    })

    it('builds range configs for recent days and this year', () => {
        expect(getActivityHeatmapRangeConfig('30d', '2026-05-14')).toMatchObject({
            dayCount: 30,
            weekCount: 5,
        })
        expect(getActivityHeatmapRangeConfig('year', '2026-05-14').dayCount).toBe(134)
    })
})
