import type { ExerciseSetType } from '../../../lib/supabase/types'

export type ParsedWorkoutCsvRow = {
    programName: string
    rotationLengthDays: number
    programDescription: string | null
    dayNumber: number
    dayName: string
    isRestDay: boolean
    exerciseName: string | null
    muscleGroup: string | null
    equipment: string | null
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

export const workoutCsvHeaders = [
    'program_name',
    'rotation_length_days',
    'program_description',
    'day_number',
    'day_name',
    'is_rest_day',
    'exercise_name',
    'muscle_group',
    'equipment',
    'set_type',
    'sets',
    'min_reps',
    'max_reps',
    'rest_seconds',
    'target_rpe',
    'backoff_percent',
    'notes',
    'progression_rule',
    'deload_rule'
]

function splitCsvLine(line: string) {
    const values: string[] = []
    let current = ''
    let insideQuotes = false

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index]
        const nextChar = line[index + 1]

        if (char === '"' && nextChar === '"') {
            current += '"'
            index += 1
        } else if (char === '"') {
            insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
            values.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }

    values.push(current.trim())

    return values
}

function cleanText(value: string | undefined) {
    const trimmed = value?.trim()

    return trimmed ? trimmed : null
}

function parseNumber(value: string | undefined) {
    const cleaned = cleanText(value)

    if (!cleaned) {
        return null
    }

    const parsed = Number(cleaned)

    return Number.isFinite(parsed) ? parsed : null
}

function parseBoolean(value: string | undefined) {
    const cleaned = cleanText(value)?.toLowerCase()

    return cleaned === 'true' || cleaned === 'yes' || cleaned === '1'
}

function parseSetType(value: string | undefined): ExerciseSetType {
    const cleaned = cleanText(value)

    if (
        cleaned === 'straight' ||
        cleaned === 'top_set_backoff' ||
        cleaned === 'warmup' ||
        cleaned === 'custom'
    ) {
        return cleaned
    }

    return 'straight'
}

export function parseWorkoutCsv(csvText: string) {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    if (lines.length < 2) {
        throw new Error('CSV must include a header row and at least one data row.')
    }

    const headers = splitCsvLine(lines[0])

    const missingHeaders = workoutCsvHeaders.filter((header) => !headers.includes(header))

    if (missingHeaders.length > 0) {
        throw new Error(`CSV is missing headers: ${missingHeaders.join(', ')}`)
    }

    return lines.slice(1).map((line, index) => {
        const values = splitCsvLine(line)
        const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? '']))

        const programName = cleanText(row.program_name)
        const dayNumber = parseNumber(row.day_number)
        const dayName = cleanText(row.day_name)

        if (!programName) {
            throw new Error(`Row ${index + 2} is missing program_name.`)
        }

        if (!dayNumber) {
            throw new Error(`Row ${index + 2} is missing day_number.`)
        }

        if (!dayName) {
            throw new Error(`Row ${index + 2} is missing day_name.`)
        }

        return {
            programName,
            rotationLengthDays: parseNumber(row.rotation_length_days) ?? 7,
            programDescription: cleanText(row.program_description),
            dayNumber,
            dayName,
            isRestDay: parseBoolean(row.is_rest_day),
            exerciseName: cleanText(row.exercise_name),
            muscleGroup: cleanText(row.muscle_group),
            equipment: cleanText(row.equipment),
            setType: parseSetType(row.set_type),
            sets: parseNumber(row.sets) ?? 3,
            minReps: parseNumber(row.min_reps),
            maxReps: parseNumber(row.max_reps),
            restSeconds: parseNumber(row.rest_seconds),
            targetRpe: parseNumber(row.target_rpe),
            backoffPercent: parseNumber(row.backoff_percent),
            notes: cleanText(row.notes),
            progressionRule: cleanText(row.progression_rule),
            deloadRule: cleanText(row.deload_rule)
        } satisfies ParsedWorkoutCsvRow
    })
}