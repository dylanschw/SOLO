export type ActivityHeatmapDay = {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
}

export type ActivityHeatmapWeek = {
    weekStart: string
    days: ActivityHeatmapDay[]
}

export type ActivityHeatmapRange = '30d' | '90d' | 'year'

export type ActivityHeatmapStats = {
    activeDays: number
    totalCount: number
    currentStreak: number
    longestStreak: number
    completionPercentage: number
}

function toDate(value: string) {
    return new Date(`${value}T00:00:00`)
}

function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
    const copy = new Date(date)
    copy.setDate(copy.getDate() + days)
    return copy
}

function getStartOfWeek(date: Date) {
    const copy = new Date(date)
    copy.setDate(copy.getDate() - copy.getDay())
    copy.setHours(0, 0, 0, 0)
    return copy
}

function getDaysBetween(startDate: Date, endDate: Date) {
    const millisecondsPerDay = 1000 * 60 * 60 * 24
    const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

    return Math.floor((endUtc - startUtc) / millisecondsPerDay) + 1
}

export function getActivityHeatmapRangeConfig(range: ActivityHeatmapRange, endDate: string) {
    if (range === '30d') {
        return {
            range,
            label: 'Last 30 days',
            dayCount: 30,
            weekCount: 5,
        }
    }

    if (range === '90d') {
        return {
            range,
            label: 'Last 90 days',
            dayCount: 90,
            weekCount: 13,
        }
    }

    const end = toDate(endDate)
    const yearStart = new Date(end.getFullYear(), 0, 1)
    const weekCount = Math.max(1, Math.ceil(getDaysBetween(getStartOfWeek(yearStart), getStartOfWeek(end)) / 7) + 1)

    return {
        range,
        label: 'This year',
        dayCount: getDaysBetween(yearStart, end),
        weekCount,
    }
}

export function getHeatmapLevel(count: number): ActivityHeatmapDay['level'] {
    if (count <= 0) {
        return 0
    }

    if (count === 1) {
        return 1
    }

    if (count <= 3) {
        return 2
    }

    if (count <= 5) {
        return 3
    }

    return 4
}

export function countActivityByDate<T>(items: T[], getDate: (item: T) => string | null | undefined) {
    const counts = new Map<string, number>()

    for (const item of items) {
        const date = getDate(item)

        if (!date) {
            continue
        }

        const dateKey = date.slice(0, 10)
        counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1)
    }

    return counts
}

export function combineActivityCounts(countMaps: Array<Map<string, number>>) {
    const combined = new Map<string, number>()

    for (const countMap of countMaps) {
        for (const [date, count] of countMap.entries()) {
            if (count <= 0) {
                continue
            }

            combined.set(date, (combined.get(date) ?? 0) + count)
        }
    }

    return combined
}

export function calculateActivityHeatmapStats(input: {
    endDate: string
    dayCount: number
    countsByDate: Map<string, number>
    minimumCount?: number
}): ActivityHeatmapStats {
    const dayCount = Math.max(1, Math.round(input.dayCount))
    const minimumCount = input.minimumCount ?? 1
    const end = toDate(input.endDate)
    const start = addDays(end, -(dayCount - 1))

    let activeDays = 0
    let totalCount = 0
    let longestStreak = 0
    let runningStreak = 0

    for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
        const dateKey = toDateKey(addDays(start, dayIndex))
        const count = input.countsByDate.get(dateKey) ?? 0
        const isActive = count >= minimumCount

        totalCount += count

        if (isActive) {
            activeDays += 1
            runningStreak += 1
            longestStreak = Math.max(longestStreak, runningStreak)
        } else {
            runningStreak = 0
        }
    }

    let currentStreak = 0

    for (let dayOffset = 0; dayOffset < dayCount; dayOffset += 1) {
        const dateKey = toDateKey(addDays(end, -dayOffset))
        const count = input.countsByDate.get(dateKey) ?? 0

        if (count < minimumCount) {
            break
        }

        currentStreak += 1
    }

    return {
        activeDays,
        totalCount,
        currentStreak,
        longestStreak,
        completionPercentage: Math.round((activeDays / dayCount) * 100),
    }
}

export function buildActivityHeatmap(input: {
    endDate: string
    weekCount?: number
    countsByDate: Map<string, number>
}): ActivityHeatmapWeek[] {
    const weekCount = input.weekCount ?? 12
    const end = toDate(input.endDate)
    const endWeekStart = getStartOfWeek(end)
    const firstWeekStart = addDays(endWeekStart, -(weekCount - 1) * 7)
    const weeks: ActivityHeatmapWeek[] = []

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
        const weekStart = addDays(firstWeekStart, weekIndex * 7)
        const days: ActivityHeatmapDay[] = []

        for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
            const date = addDays(weekStart, dayIndex)
            const dateKey = toDateKey(date)
            const count = input.countsByDate.get(dateKey) ?? 0

            days.push({
                date: dateKey,
                count,
                level: getHeatmapLevel(count),
            })
        }

        weeks.push({
            weekStart: toDateKey(weekStart),
            days,
        })
    }

    return weeks
}
