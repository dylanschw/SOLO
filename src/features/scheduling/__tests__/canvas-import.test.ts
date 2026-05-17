import { describe, expect, it } from 'vitest'
import {
    buildCanvasTaskNotes,
    detectCanvasTaskDuplicates,
    getCanvasTaskDuplicateKey,
    parseCanvasAssignmentText
} from '../lib/canvas-import'

const referenceDate = new Date('2026-05-17T12:00:00Z')

describe('Canvas scheduling import utilities', () => {
    it('parses assignments, quizzes, exams, courses, dates, times, and links', () => {
        const result = parseCanvasAssignmentText(
            `
Biology 101
Lab report draft
Due May 20, 2026 at 11:59pm
https://canvas.example.edu/courses/1/assignments/10

Course: History 220
Quiz: Reconstruction reading check
Due: 5/21/2026 at 8:00 AM

Math 150
Final exam
Due Jun 1 at 2pm
`,
            referenceDate
        )

        expect(result.warnings).toEqual([])
        expect(result.tasks).toHaveLength(3)
        expect(result.tasks[0]).toMatchObject({
            title: 'Lab report draft',
            courseName: 'Biology 101',
            taskType: 'assignment',
            dueDate: '2026-05-20',
            dueTime: '23:59',
            link: 'https://canvas.example.edu/courses/1/assignments/10'
        })
        expect(result.tasks[1]).toMatchObject({
            title: 'Reconstruction reading check',
            courseName: 'History 220',
            taskType: 'quiz',
            dueDate: '2026-05-21',
            dueTime: '08:00'
        })
        expect(result.tasks[2]).toMatchObject({
            title: 'Final exam',
            courseName: 'Math 150',
            taskType: 'exam',
            dueDate: '2026-06-01',
            dueTime: '14:00'
        })
    })

    it('infers next year for month/day dates that already passed', () => {
        const result = parseCanvasAssignmentText(
            `
English 101
Reflection paper
Due Jan 12 at 11:59pm
`,
            referenceDate
        )

        expect(result.tasks[0]?.dueDate).toBe('2027-01-12')
    })

    it('keeps adjacent tasks separated when pasted without blank lines', () => {
        const result = parseCanvasAssignmentText(
            `
Course: Biology 101
Assignment: Lab report draft
Due May 20, 2026 at 11:59pm
Course: History 220
Quiz: Reconstruction reading check
Due May 21, 2026 at 8am
`,
            referenceDate
        )

        expect(result.tasks[0]).toMatchObject({
            title: 'Lab report draft',
            courseName: 'Biology 101',
            taskType: 'assignment'
        })
        expect(result.tasks[1]).toMatchObject({
            title: 'Reconstruction reading check',
            courseName: 'History 220',
            taskType: 'quiz'
        })
    })

    it('detects duplicates against existing scheduling tasks and inside the paste', () => {
        const result = parseCanvasAssignmentText(
            `
Biology 101
Lab report draft
Due May 20, 2026 at 11:59pm

Biology 101
Lab report draft
Due May 20, 2026 at 10pm
`,
            referenceDate
        )

        const duplicates = detectCanvasTaskDuplicates(result.tasks, [
            {
                id: 'existing-task',
                task_date: '2026-05-20',
                title: 'Lab report draft',
                category: 'Biology 101'
            }
        ])

        expect(duplicates.get(result.tasks[0].id)?.reasons).toContain(
            'Already exists in Scheduling for the same date and course.'
        )
        expect(duplicates.get(result.tasks[1].id)?.reasons).toEqual([
            'Already exists in Scheduling for the same date and course.',
            'Duplicate row in this pasted Canvas text.'
        ])
    })

    it('builds stable duplicate keys and import notes', () => {
        const result = parseCanvasAssignmentText(
            `
Course: Chemistry
Assignment: Problem set 4
Due: May 22, 2026 at 9pm
https://canvas.example.edu/problem-set-4
`,
            referenceDate
        )
        const task = result.tasks[0]

        expect(getCanvasTaskDuplicateKey(task)).toBe(
            '2026-05-22|chemistry|problem set 4'
        )
        expect(buildCanvasTaskNotes(task)).toBe(
            'Canvas assignment\nDue time: 21:00\nLink: https://canvas.example.edu/problem-set-4'
        )
    })

    it('returns a helpful warning when no due lines are found', () => {
        const result = parseCanvasAssignmentText(
            'Biology 101\nLab report draft',
            referenceDate
        )

        expect(result.tasks).toEqual([])
        expect(result.warnings[0]).toContain('No Canvas due-date lines')
    })
})
