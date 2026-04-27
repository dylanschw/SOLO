import type { ExerciseSetType } from '../../../lib/supabase/types'

export type ParsedWorkoutTextExercise = {
    id: string
    name: string
    setType: ExerciseSetType
    sets: number
    minReps: number | null
    maxReps: number | null
    restSeconds: number | null
    targetRpe: number | null
    backoffPercent: number | null
    notes: string | null
    progressionRule: string | null
    deloadRule: string | null
}

export type ParsedWorkoutTextDay = {
    id: string
    dayNumber: number
    name: string
    isRestDay: boolean
    notes: string | null
    exercises: ParsedWorkoutTextExercise[]
}

export type ParsedWorkoutTextProgram = {
    name: string
    description: string | null
    rotationLengthDays: number
    days: ParsedWorkoutTextDay[]
}

function createDraftId() {
    return crypto.randomUUID()
}

function cleanLine(line: string) {
    return line.trim().replace(/\s+/g, ' ')
}

function isRestLine(line: string) {
    return /^day\s+\d+\s*[:.-]?\s*rest$/i.test(line) || /^rest$/i.test(line)
}

function parseDayHeader(line: string) {
    const match = line.match(/^day\s+(\d+)\s*[:.-]?\s*(.+)$/i)

    if (!match) {
        return null
    }

    const dayNumber = Number(match[1])
    const rawName = match[2]?.trim() || `Day ${dayNumber}`
    const isRestDay = /rest/i.test(rawName)

    return {
        dayNumber,
        name: rawName,
        isRestDay
    }
}

function parseSetsAndReps(line: string) {
    const match = line.match(/(\d+)\s*x\s*(\d+)(?:\s*[-–]\s*(\d+))?/i)

    if (!match) {
        return {
            sets: 3,
            minReps: null,
            maxReps: null
        }
    }

    const sets = Number(match[1])
    const minReps = Number(match[2])
    const maxReps = match[3] ? Number(match[3]) : minReps

    return {
        sets,
        minReps,
        maxReps
    }
}

function parseRpe(line: string) {
    const match = line.match(/\brpe\s*(\d+(?:\.\d+)?)\b/i)

    if (!match) {
        return null
    }

    return Number(match[1])
}

function parseRestSeconds(line: string) {
    const minuteMatch = line.match(/\b(\d+(?:\.\d+)?)\s*min(?:ute)?s?\s*rest\b/i)

    if (minuteMatch) {
        return Math.round(Number(minuteMatch[1]) * 60)
    }

    const secondMatch = line.match(/\b(\d+)\s*(?:s|sec|secs|second|seconds)\s*rest\b/i)

    if (secondMatch) {
        return Number(secondMatch[1])
    }

    return null
}

function parseBackoffPercent(line: string) {
    const match = line.match(/\bback\s*off\s*(?:by|at)?\s*(\d+(?:\.\d+)?)\s*%/i)

    if (!match) {
        return null
    }

    return Number(match[1])
}

function detectSetType(line: string): ExerciseSetType {
    if (/top\s*set|back\s*off/i.test(line)) {
        return 'top_set_backoff'
    }

    if (/warm\s*up/i.test(line)) {
        return 'warmup'
    }

    return 'straight'
}

function stripExerciseName(line: string) {
    return line
        .replace(/^\s*[-•*]\s*/g, '')
        .replace(/\d+\s*x\s*\d+(?:\s*[-–]\s*\d+)?/gi, '')
        .replace(/\brpe\s*\d+(?:\.\d+)?\b/gi, '')
        .replace(/\b\d+(?:\.\d+)?\s*min(?:ute)?s?\s*rest\b/gi, '')
        .replace(/\b\d+\s*(?:s|sec|secs|second|seconds)\s*rest\b/gi, '')
        .replace(/\bback\s*off\s*(?:by|at)?\s*\d+(?:\.\d+)?\s*%/gi, '')
        .replace(/\btop\s*set\b/gi, '')
        .replace(/\bback\s*off\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function parseExerciseLine(line: string): ParsedWorkoutTextExercise {
    const setsAndReps = parseSetsAndReps(line)
    const name = stripExerciseName(line) || 'Exercise Name'
    const setType = detectSetType(line)

    return {
        id: createDraftId(),
        name,
        setType,
        sets: setsAndReps.sets,
        minReps: setsAndReps.minReps,
        maxReps: setsAndReps.maxReps,
        restSeconds: parseRestSeconds(line),
        targetRpe: parseRpe(line),
        backoffPercent: parseBackoffPercent(line),
        notes: null,
        progressionRule: null,
        deloadRule: null
    }
}

export function parseWorkoutPlainText(text: string): ParsedWorkoutTextProgram {
    const lines = text
        .split(/\r?\n/)
        .map(cleanLine)
        .filter(Boolean)

    if (lines.length === 0) {
        throw new Error('Paste a workout routine first.')
    }

    const days: ParsedWorkoutTextDay[] = []
    let currentDay: ParsedWorkoutTextDay | null = null

    for (const line of lines) {
        const dayHeader = parseDayHeader(line)

        if (dayHeader) {
            currentDay = {
                id: createDraftId(),
                dayNumber: dayHeader.dayNumber,
                name: dayHeader.name,
                isRestDay: dayHeader.isRestDay,
                notes: null,
                exercises: []
            }

            days.push(currentDay)
            continue
        }

        if (isRestLine(line)) {
            const nextDayNumber = days.length + 1

            currentDay = {
                id: createDraftId(),
                dayNumber: nextDayNumber,
                name: 'Rest',
                isRestDay: true,
                notes: null,
                exercises: []
            }

            days.push(currentDay)
            continue
        }

        if (!currentDay) {
            currentDay = {
                id: createDraftId(),
                dayNumber: 1,
                name: 'Workout Day Name',
                isRestDay: false,
                notes: null,
                exercises: []
            }

            days.push(currentDay)
        }

        if (!currentDay.isRestDay) {
            currentDay.exercises.push(parseExerciseLine(line))
        }
    }

    const rotationLengthDays = Math.max(days.length, 1)

    return {
        name: 'Workout Program Name',
        description: 'Imported from plain text',
        rotationLengthDays,
        days
    }
}