export type CanvasTaskType = 'assignment' | 'quiz' | 'exam'

export type ParsedCanvasTask = {
    id: string
    title: string
    courseName: string | null
    taskType: CanvasTaskType
    dueDate: string
    dueTime: string | null
    link: string | null
    sourceText: string
}

export type CanvasImportParseResult = {
    tasks: ParsedCanvasTask[]
    warnings: string[]
}

export type ExistingSchedulingTask = {
    id?: string
    task_date: string
    title: string
    category: string | null
    deleted_at?: string | null
}

export type CanvasTaskDuplicate = {
    taskId: string
    reasons: string[]
}

const monthLookup = new Map([
    ['jan', 0],
    ['january', 0],
    ['feb', 1],
    ['february', 1],
    ['mar', 2],
    ['march', 2],
    ['apr', 3],
    ['april', 3],
    ['may', 4],
    ['jun', 5],
    ['june', 5],
    ['jul', 6],
    ['july', 6],
    ['aug', 7],
    ['august', 7],
    ['sep', 8],
    ['sept', 8],
    ['september', 8],
    ['oct', 9],
    ['october', 9],
    ['nov', 10],
    ['november', 10],
    ['dec', 11],
    ['december', 11]
])

const ignoredTitlePatterns = [
    /^due\b/i,
    /^available\b/i,
    /^submitted\b/i,
    /^missing\b/i,
    /^points?\b/i,
    /^\d+(\.\d+)?\s*(pts?|points?)$/i,
    /^https?:\/\//i,
    /^assignments?$/i,
    /^quizzes?$/i,
    /^exams?$/i,
    /^grades?$/i,
    /^calendar$/i,
    /^to do$/i
]

function cleanLine(line: string) {
    return line.replace(/\s+/g, ' ').trim()
}

function formatDate(year: number, monthIndex: number, day: number) {
    const candidate = new Date(Date.UTC(year, monthIndex, day))

    if (
        candidate.getUTCFullYear() !== year ||
        candidate.getUTCMonth() !== monthIndex ||
        candidate.getUTCDate() !== day
    ) {
        return null
    }

    return candidate.toISOString().slice(0, 10)
}

function normalizeYear(
    rawYear: string | undefined,
    referenceDate: Date,
    monthIndex: number,
    day: number
) {
    if (rawYear) {
        const parsedYear = Number(rawYear)
        return parsedYear < 100 ? 2000 + parsedYear : parsedYear
    }

    let inferredYear = referenceDate.getFullYear()
    const currentMonth = referenceDate.getMonth()
    const currentDay = referenceDate.getDate()

    if (
        monthIndex < currentMonth ||
        (monthIndex === currentMonth && day < currentDay)
    ) {
        inferredYear += 1
    }

    return inferredYear
}

function normalizeTime(
    hourText: string | undefined,
    minuteText: string | undefined,
    meridiemText: string | undefined
) {
    if (!hourText) {
        return null
    }

    let hour = Number(hourText)
    const minute = minuteText ? Number(minuteText) : 0
    const meridiem = meridiemText?.toLowerCase()

    if (
        !Number.isInteger(hour) ||
        !Number.isInteger(minute) ||
        minute < 0 ||
        minute > 59
    ) {
        return null
    }

    if (meridiem) {
        if (hour < 1 || hour > 12) {
            return null
        }

        if (meridiem === 'pm' && hour !== 12) {
            hour += 12
        }

        if (meridiem === 'am' && hour === 12) {
            hour = 0
        }
    }

    if (hour < 0 || hour > 23) {
        return null
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function parseDueDate(line: string, referenceDate: Date) {
    const normalized = cleanLine(line)
    const monthDateMatch = normalized.match(
        /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,\s*(\d{2,4}))?(?:\s*(?:at|by|,)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i
    )

    if (monthDateMatch) {
        const monthIndex = monthLookup.get(
            monthDateMatch[1].toLowerCase().replace('.', '')
        )
        const day = Number(monthDateMatch[2])

        if (monthIndex === undefined || !Number.isInteger(day)) {
            return null
        }

        const year = normalizeYear(
            monthDateMatch[3],
            referenceDate,
            monthIndex,
            day
        )
        const dueDate = formatDate(year, monthIndex, day)

        if (!dueDate) {
            return null
        }

        return {
            dueDate,
            dueTime: normalizeTime(
                monthDateMatch[4],
                monthDateMatch[5],
                monthDateMatch[6]
            )
        }
    }

    const numericDateMatch = normalized.match(
        /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?(?:\s*(?:at|by|,)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i
    )

    if (numericDateMatch) {
        const monthIndex = Number(numericDateMatch[1]) - 1
        const day = Number(numericDateMatch[2])
        const year = normalizeYear(
            numericDateMatch[3],
            referenceDate,
            monthIndex,
            day
        )
        const dueDate = formatDate(year, monthIndex, day)

        if (!dueDate) {
            return null
        }

        return {
            dueDate,
            dueTime: normalizeTime(
                numericDateMatch[4],
                numericDateMatch[5],
                numericDateMatch[6]
            )
        }
    }

    return null
}

function isDueLine(line: string) {
    return /^due\b/i.test(line) || /\bdue\s*:?\s+/i.test(line)
}

function extractLink(lines: string[]) {
    const combined = lines.join(' ')
    const match = combined.match(/https?:\/\/[^\s)]+/i)

    return match ? match[0] : null
}

function stripLabel(line: string) {
    return line
        .replace(
            /^(assignment|quiz|exam|test|course|class|due|link)\s*:\s*/i,
            ''
        )
        .replace(/\s+-\s+due\b.*$/i, '')
        .trim()
}

function isIgnoredTitleLine(line: string) {
    return ignoredTitlePatterns.some((pattern) => pattern.test(line))
}

function detectTaskType(lines: string[], title: string): CanvasTaskType {
    const combined = `${title} ${lines.join(' ')}`.toLowerCase()

    if (/\b(exam|midterm|final|test)\b/.test(combined)) {
        return 'exam'
    }

    if (/\bquiz\b/.test(combined)) {
        return 'quiz'
    }

    return 'assignment'
}

function pickTitle(lines: string[], dueLineIndex: number) {
    for (let index = dueLineIndex - 1; index >= 0; index -= 1) {
        const candidate = stripLabel(lines[index])

        if (candidate && !isIgnoredTitleLine(candidate)) {
            return candidate
        }
    }

    for (let index = dueLineIndex + 1; index < lines.length; index += 1) {
        const candidate = stripLabel(lines[index])

        if (candidate && !isIgnoredTitleLine(candidate)) {
            return candidate
        }
    }

    return null
}

function pickCourseName(lines: string[], title: string) {
    const explicitCourse = lines
        .map((line) => line.match(/^(course|class)\s*:\s*(.+)$/i)?.[2]?.trim())
        .find((line): line is string => Boolean(line))

    if (explicitCourse) {
        return explicitCourse
    }

    const titleIndex = lines.findIndex((line) => stripLabel(line) === title)

    if (titleIndex > 0) {
        const candidate = stripLabel(lines[titleIndex - 1])

        if (
            candidate &&
            candidate !== title &&
            !isIgnoredTitleLine(candidate)
        ) {
            return candidate
        }
    }

    return null
}

function buildTaskId(task: Omit<ParsedCanvasTask, 'id'>, index: number) {
    return `${task.dueDate}-${normalizeTaskText(task.courseName ?? 'canvas')}-${normalizeTaskText(task.title)}-${index}`
}

export function parseCanvasAssignmentText(
    text: string,
    referenceDate = new Date()
): CanvasImportParseResult {
    const blocks = text
        .split(/\r?\n\s*\r?\n/)
        .map((block) => block.split(/\r?\n/).map(cleanLine).filter(Boolean))
        .filter((blockLines) => blockLines.length > 0)
    const lines = blocks.flat()
    const warnings: string[] = []

    if (lines.length === 0) {
        return {
            tasks: [],
            warnings: ['Paste Canvas assignment text to preview tasks.']
        }
    }

    const dueLineCount = lines.filter(isDueLine).length

    if (dueLineCount === 0) {
        return {
            tasks: [],
            warnings: [
                'No Canvas due-date lines were found. Include lines like "Due May 20 at 11:59pm".'
            ]
        }
    }

    let taskIndex = 0

    const tasks = blocks.flatMap((blockLines) => {
        const blockDueLineIndexes = blockLines
            .map((line, index) => ({ line, index }))
            .filter(({ line }) => isDueLine(line))
            .map(({ index }) => index)

        return blockDueLineIndexes
            .map((dueLineIndex, blockTaskIndex) => {
                const previousDueIndex =
                    blockDueLineIndexes[blockTaskIndex - 1] ?? -1
                const nextDueIndex =
                    blockDueLineIndexes[blockTaskIndex + 1] ?? blockLines.length
                const start = Math.max(previousDueIndex + 1, dueLineIndex - 6)
                const trailingLinkLines: string[] = []

                for (
                    let index = dueLineIndex + 1;
                    index < Math.min(nextDueIndex, dueLineIndex + 5);
                    index += 1
                ) {
                    const line = blockLines[index]

                    if (/^(link\s*:?\s*)?https?:\/\//i.test(line)) {
                        trailingLinkLines.push(line)
                        continue
                    }

                    break
                }

                const windowLines = [
                    ...blockLines.slice(start, dueLineIndex + 1),
                    ...trailingLinkLines
                ]
                const localDueLineIndex = dueLineIndex - start
                const dueDate = parseDueDate(
                    blockLines[dueLineIndex],
                    referenceDate
                )
                const title = pickTitle(windowLines, localDueLineIndex)

                if (!dueDate || !title) {
                    warnings.push(
                        'Skipped one Canvas item because title or due date was unclear.'
                    )
                    return null
                }

                const taskWithoutId: Omit<ParsedCanvasTask, 'id'> = {
                    title,
                    courseName: pickCourseName(windowLines, title),
                    taskType: detectTaskType(windowLines, title),
                    dueDate: dueDate.dueDate,
                    dueTime: dueDate.dueTime,
                    link: extractLink(windowLines),
                    sourceText: windowLines.join('\n')
                }

                const nextTaskIndex = taskIndex
                taskIndex += 1

                return {
                    id: buildTaskId(taskWithoutId, nextTaskIndex),
                    ...taskWithoutId
                }
            })
            .filter((task): task is ParsedCanvasTask => Boolean(task))
    })

    if (tasks.length === 0 && warnings.length === 0) {
        warnings.push('No importable Canvas tasks were found.')
    }

    return { tasks, warnings }
}

export function normalizeTaskText(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function getCanvasTaskDuplicateKey(
    task: Pick<ParsedCanvasTask, 'dueDate' | 'title' | 'courseName'>
) {
    return [
        task.dueDate,
        normalizeTaskText(task.courseName ?? 'canvas'),
        normalizeTaskText(task.title)
    ].join('|')
}

export function getSchedulingTaskDuplicateKey(task: ExistingSchedulingTask) {
    return [
        task.task_date,
        normalizeTaskText(task.category ?? 'canvas'),
        normalizeTaskText(task.title)
    ].join('|')
}

export function detectCanvasTaskDuplicates(
    tasks: ParsedCanvasTask[],
    existingTasks: ExistingSchedulingTask[]
): Map<string, CanvasTaskDuplicate> {
    const duplicateMap = new Map<string, CanvasTaskDuplicate>()
    const existingKeys = new Map<string, ExistingSchedulingTask>()

    existingTasks
        .filter((task) => !task.deleted_at)
        .forEach((task) => {
            existingKeys.set(getSchedulingTaskDuplicateKey(task), task)
        })

    const seenImportKeys = new Map<string, ParsedCanvasTask>()

    tasks.forEach((task) => {
        const key = getCanvasTaskDuplicateKey(task)
        const reasons: string[] = []

        if (existingKeys.has(key)) {
            reasons.push(
                'Already exists in Scheduling for the same date and course.'
            )
        }

        if (seenImportKeys.has(key)) {
            reasons.push('Duplicate row in this pasted Canvas text.')
        }

        if (reasons.length > 0) {
            duplicateMap.set(task.id, {
                taskId: task.id,
                reasons
            })
        }

        seenImportKeys.set(key, task)
    })

    return duplicateMap
}

export function buildCanvasTaskNotes(task: ParsedCanvasTask) {
    const details = [
        `Canvas ${task.taskType}`,
        task.dueTime ? `Due time: ${task.dueTime}` : null,
        task.link ? `Link: ${task.link}` : null
    ].filter((detail): detail is string => Boolean(detail))

    return details.join('\n')
}
