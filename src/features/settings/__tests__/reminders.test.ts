import { describe, expect, it } from 'vitest'
import { getReminderOption, normalizeReminderTime } from '../lib/reminders'

describe('reminder utilities', () => {
    it('normalizes valid reminder times', () => {
        expect(normalizeReminderTime('08:30')).toBe('08:30')
    })

    it('rejects invalid reminder times', () => {
        expect(normalizeReminderTime('8:30')).toBeNull()
        expect(normalizeReminderTime('')).toBeNull()
    })

    it('finds reminder option metadata', () => {
        expect(getReminderOption('sleep').label).toBe('Sleep')
    })
})
