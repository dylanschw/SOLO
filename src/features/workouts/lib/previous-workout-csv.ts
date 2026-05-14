import type { WeightUnit, WorkoutSetLoadType } from '../../../lib/supabase/types'

export type ParsedPreviousWorkoutCsvRow = {
    rowNumber: number
    workoutDate: string
    workoutName: string
    exerciseName: string
    setNumber: number
    loadType: WorkoutSetLoadType
    weight: number | null
    assistWeight: number | null
    addedWeight: number | null
    weightUnit: WeightUnit
    reps: number | null
    notes: string | null
    duplicateKey: string
}

export type PreviousWorkoutCsvPreview = {
    rows: ParsedPreviousWorkoutCsvRow[]
    warnings: string[]
    duplicateKeys: string[]
}

export const previousWorkoutCsvHeaders = [
    'workout_date',
    'workout_name',
    'exercise_name',
    'set_number',
    'load_type',
    'weight',
    'assist_weight',
    'added_weight',
    'weight_unit',
    'reps',
    'notes'
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

function parseOptionalNumber(value: string | undefined) {
    const cleaned = cleanText(value)

    if (!cleaned) {
        return null
    }

    const parsed = Number(cleaned)

    return Number.isFinite(parsed) ? parsed : null
}

function parseRequiredInteger(value: string | undefined, rowNumber: number, fieldName: string): number {
    const parsed = parseOptionalNumber(value)

    if (parsed === null || !Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Row ${rowNumber} needs a valid ${fieldName}.`)
    }

    return parsed
}

function parseWeightUnit(value: string | undefined): WeightUnit {
    return cleanText(value)?.toLowerCase() === 'kg' ? 'kg' : 'lb'
}

function parseLoadType(value: string | undefined): WorkoutSetLoadType {
    const cleaned = cleanText(value)
        ?.toLowerCase()
        .replaceAll('-', '_')
        .replaceAll(' ', '_')

    if (
        cleaned === 'bodyweight' ||
        cleaned === 'no_weight' ||
        cleaned === 'assisted' ||
        cleaned === 'assisted_weight' ||
        cleaned === 'added_weight'
    ) {
        return cleaned === 'assisted_weight' ? 'assisted' : cleaned
    }

    return 'weighted'
}

function isValidDate(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

    if (!match) {
        return false
    }

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const date = new Date(Date.UTC(year, month - 1, day))

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    )
}

export function parsePreviousWorkoutCsv(csvText: string): PreviousWorkoutCsvPreview {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    if (lines.length < 2) {
        throw new Error('CSV must include a header row and at least one workout set.')
    }

    const headers = splitCsvLine(lines[0])
    const missingHeaders = previousWorkoutCsvHeaders.filter((header) => !headers.includes(header))

    if (missingHeaders.length > 0) {
        throw new Error(`CSV is missing headers: ${missingHeaders.join(', ')}`)
    }

    const warnings: string[] = []
    const duplicateCounts = new Map<string, number>()

    const rows = lines.slice(1).map((line, index): ParsedPreviousWorkoutCsvRow => {
        const rowNumber = index + 2
        const values = splitCsvLine(line)
        const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? '']))
        const workoutDate = cleanText(row.workout_date)
        const exerciseName = cleanText(row.exercise_name)
        const workoutName = cleanText(row.workout_name) ?? 'Imported workout'
        const setNumber = parseRequiredInteger(row.set_number, rowNumber, 'set_number')
        const loadType = parseLoadType(row.load_type)
        const weight = parseOptionalNumber(row.weight)
        const assistWeight = parseOptionalNumber(row.assist_weight)
        const addedWeight = parseOptionalNumber(row.added_weight)
        const reps = parseOptionalNumber(row.reps)

        if (!workoutDate || !isValidDate(workoutDate)) {
            throw new Error(`Row ${rowNumber} needs workout_date as YYYY-MM-DD.`)
        }

        if (!exerciseName) {
            throw new Error(`Row ${rowNumber} needs exercise_name.`)
        }

        if (reps !== null && (!Number.isInteger(reps) || reps < 0)) {
            throw new Error(`Row ${rowNumber} has invalid reps.`)
        }

        if (loadType === 'weighted' && weight === null) {
            warnings.push(`Row ${rowNumber} is weighted but has no weight.`)
        }

        if (loadType === 'assisted' && assistWeight === null) {
            warnings.push(`Row ${rowNumber} is assisted but has no assist_weight.`)
        }

        if (loadType === 'added_weight' && addedWeight === null) {
            warnings.push(`Row ${rowNumber} is added_weight but has no added_weight.`)
        }

        const duplicateKey = [
            workoutDate,
            workoutName.trim().toLowerCase(),
            exerciseName.trim().toLowerCase(),
            setNumber
        ].join('|')

        duplicateCounts.set(duplicateKey, (duplicateCounts.get(duplicateKey) ?? 0) + 1)

        return {
            rowNumber,
            workoutDate,
            workoutName,
            exerciseName,
            setNumber,
            loadType,
            weight,
            assistWeight,
            addedWeight,
            weightUnit: parseWeightUnit(row.weight_unit),
            reps,
            notes: cleanText(row.notes),
            duplicateKey
        }
    })

    const duplicateKeys = Array.from(duplicateCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([key]) => key)

    return {
        rows,
        warnings,
        duplicateKeys
    }
}

export function groupPreviousWorkoutCsvRows(rows: ParsedPreviousWorkoutCsvRow[]) {
    return rows.reduce<Record<string, ParsedPreviousWorkoutCsvRow[]>>((groups, row) => {
        const groupKey = `${row.workoutDate} - ${row.workoutName}`
        const existingRows = groups[groupKey] ?? []
        existingRows.push(row)
        groups[groupKey] = existingRows

        return groups
    }, {})
}
