export type ActivityHeatmapDay = {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
}

export type ActivityHeatmapWeek = {
    weekStart: string
    days: ActivityHeatmapDay[]
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
