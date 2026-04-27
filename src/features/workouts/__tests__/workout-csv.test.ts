import { describe, expect, it } from 'vitest'
import { parseWorkoutCsv } from '../lib/workout-csv'

describe('workout csv parser', () => {
    it('parses workout csv rows', () => {
        const csv = `program_name,rotation_length_days,program_description,day_number,day_name,is_rest_day,exercise_name,muscle_group,equipment,set_type,sets,min_reps,max_reps,rest_seconds,target_rpe,backoff_percent,notes,progression_rule,deload_rule
Workout Program Name,8,Program description,1,Workout Day Name,false,Exercise Name,Muscle Group,Equipment,straight,3,8,12,120,8,,Exercise notes,Dynamic double progression,Deload rule`

        const rows = parseWorkoutCsv(csv)

        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            programName: 'Workout Program Name',
            rotationLengthDays: 8,
            dayNumber: 1,
            dayName: 'Workout Day Name',
            exerciseName: 'Exercise Name',
            sets: 3,
            minReps: 8,
            maxReps: 12
        })
    })

    it('throws when required headers are missing', () => {
        expect(() => parseWorkoutCsv('program_name\nTest')).toThrow(/missing headers/i)
    })
})