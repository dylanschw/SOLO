export type CoachRecommendationLabel =
    | 'keep_going'
    | 'increase_weight_carefully'
    | 'repeat_same_load'
    | 'consider_rest_recovery'
    | 'calories_are_behind_target'
    | 'sleep_is_below_target'

export type CoachWeeklySummary = {
    startDate: string
    endDate: string
    workoutsCompleted: number
    nutritionLoggedDays: number
    schedulingCompletedDays: number
    averageSleepHours: number | null
    trainingConsistencyScore: number
    nutritionConsistencyScore: number
    schedulingConsistencyScore: number
    sleepConsistencyScore: number | null
    bodyweightTrend: 'up' | 'down' | 'flat' | 'unknown'
    recommendations: CoachRecommendationLabel[]
}

export type LiftPerformance = {
    date: string
    exerciseName: string
    weight: number
    reps: number
}

export type StalledLiftSummary = {
    exerciseName: string
    isStalled: boolean
    recentBestScores: number[]
}

function toDate(value: string) {
    return new Date(`${value}T12:00:00`)
}

function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
    const copy = new Date(date)
    copy.setDate(copy.getDate() + days)
    return copy
}

function getTextField(source: unknown, fieldNames: string[]) {
    const record = source as Record<string, unknown> | null | undefined

    if (!record) {
        return null
    }

    for (const fieldName of fieldNames) {
        const value = record[fieldName]

        if (typeof value === 'string' && value.trim()) {
            return value
        }
    }

    return null
}

function getNumberField(source: unknown, fieldNames: string[]) {
    const record = source as Record<string, unknown> | null | undefined

    if (!record) {
        return null
    }

    for (const fieldName of fieldNames) {
        const value = record[fieldName]

        if (typeof value === 'number' && Number.isFinite(value)) {
            return value
        }

        if (typeof value === 'string' && value.trim()) {
            const parsed = Number(value)

            if (Number.isFinite(parsed)) {
                return parsed
            }
        }
    }

    return null
}

function isInRange(dateValue: string | null, startDate: string, endDate: string) {
    if (!dateValue) {
        return false
    }

    const dateKey = dateValue.slice(0, 10)

    return dateKey >= startDate && dateKey <= endDate
}

function scorePercent(actual: number, target: number) {
    if (target <= 0) {
        return 0
    }

    return Math.max(0, Math.min(100, Math.round((actual / target) * 100)))
}

function countUniqueActiveDates(items: unknown[], getDate: (item: unknown) => string | null, startDate: string, endDate: string) {
    const dates = new Set<string>()

    for (const item of items) {
        const date = getDate(item)

        if (isInRange(date, startDate, endDate)) {
            dates.add(date?.slice(0, 10) ?? '')
        }
    }

    dates.delete('')

    return dates.size
}

function getGoalValue(goals: unknown[] | undefined, metric: string, fallback: number) {
    const goal = goals?.find((item) => {
        const record = item as Record<string, unknown> | null | undefined

        return (
            getTextField(item, ['metric']) === metric &&
            record?.is_active !== false &&
            !getTextField(item, ['deleted_at'])
        )
    })

    return getNumberField(goal, ['target_value']) ?? fallback
}

export function buildCoachWeeklySummary(input: {
    today: string
    workoutSessions: unknown[]
    nutritionLogs: unknown[]
    bodyweightEntries: unknown[]
    healthMetricEntries: unknown[]
    dailyTasks: unknown[]
    goalTargets?: unknown[]
}): CoachWeeklySummary {
    const end = toDate(input.today)
    const startDate = toDateKey(addDays(end, -6))
    const endDate = input.today
    const workoutTarget = getGoalValue(input.goalTargets, 'workouts_per_week', 4)
    const sleepTarget = getGoalValue(input.goalTargets, 'sleep', 8)

    const workoutsCompleted = input.workoutSessions.filter((session) => {
        const status = getTextField(session, ['status'])
        const date = getTextField(session, ['session_date', 'date'])

        return status === 'completed' && isInRange(date, startDate, endDate)
    }).length

    const nutritionLoggedDays = countUniqueActiveDates(
        input.nutritionLogs.filter((log) =>
            Boolean(getNumberField(log, ['calories', 'protein_g', 'meal_count']))
        ),
        (log) => getTextField(log, ['log_date', 'date']),
        startDate,
        endDate
    )

    const schedulingCompletedDays = countUniqueActiveDates(
        input.dailyTasks.filter((task) => getTextField(task, ['status']) === 'completed'),
        (task) => getTextField(task, ['task_date', 'date']),
        startDate,
        endDate
    )

    const sleepValues = input.healthMetricEntries
        .filter((entry) => getTextField(entry, ['metric_type']) === 'sleep_hours')
        .filter((entry) => isInRange(getTextField(entry, ['metric_date', 'date']), startDate, endDate))
        .map((entry) => getNumberField(entry, ['value']))
        .filter((value): value is number => value !== null)

    const averageSleepHours =
        sleepValues.length > 0
            ? Math.round((sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length) * 10) / 10
            : null

    const sortedWeights = input.bodyweightEntries
        .filter((entry) => isInRange(getTextField(entry, ['entry_date', 'date']), startDate, endDate))
        .slice()
        .sort((a, b) =>
            (getTextField(a, ['entry_date', 'date']) ?? '').localeCompare(getTextField(b, ['entry_date', 'date']) ?? '')
        )

    const firstWeight = sortedWeights[0] ? getNumberField(sortedWeights[0], ['weight_kg', 'weight']) : null
    const lastWeight = sortedWeights[sortedWeights.length - 1]
        ? getNumberField(sortedWeights[sortedWeights.length - 1], ['weight_kg', 'weight'])
        : null
    const weightDifference = firstWeight !== null && lastWeight !== null ? lastWeight - firstWeight : null
    const bodyweightTrend =
        weightDifference === null ? 'unknown' : Math.abs(weightDifference) < 0.1 ? 'flat' : weightDifference > 0 ? 'up' : 'down'

    const trainingConsistencyScore = scorePercent(workoutsCompleted, workoutTarget)
    const nutritionConsistencyScore = scorePercent(nutritionLoggedDays, 7)
    const schedulingConsistencyScore = scorePercent(schedulingCompletedDays, 7)
    const sleepConsistencyScore = averageSleepHours === null ? null : scorePercent(averageSleepHours, sleepTarget)

    const recommendations: CoachRecommendationLabel[] = []

    recommendations.push(trainingConsistencyScore >= 75 ? 'keep_going' : 'repeat_same_load')

    if (nutritionConsistencyScore < 60) {
        recommendations.push('calories_are_behind_target')
    }

    if (sleepConsistencyScore !== null && sleepConsistencyScore < 90) {
        recommendations.push('sleep_is_below_target')
    }

    if (sleepConsistencyScore !== null && sleepConsistencyScore < 70) {
        recommendations.push('consider_rest_recovery')
    }

    return {
        startDate,
        endDate,
        workoutsCompleted,
        nutritionLoggedDays,
        schedulingCompletedDays,
        averageSleepHours,
        trainingConsistencyScore,
        nutritionConsistencyScore,
        schedulingConsistencyScore,
        sleepConsistencyScore,
        bodyweightTrend,
        recommendations,
    }
}

export function detectStalledLift(performances: LiftPerformance[], exerciseName: string): StalledLiftSummary {
    const dailyBestScores = new Map<string, number>()

    for (const performance of performances) {
        if (performance.exerciseName.trim().toLowerCase() !== exerciseName.trim().toLowerCase()) {
            continue
        }

        const score = performance.weight * performance.reps
        const existingScore = dailyBestScores.get(performance.date) ?? 0
        dailyBestScores.set(performance.date, Math.max(existingScore, score))
    }

    const recentBestScores = Array.from(dailyBestScores.entries())
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .slice(0, 3)
        .map(([, score]) => score)

    const isStalled =
        recentBestScores.length >= 3 &&
        recentBestScores[0] <= recentBestScores[1] &&
        recentBestScores[1] <= recentBestScores[2]

    return {
        exerciseName,
        isStalled,
        recentBestScores,
    }
}
