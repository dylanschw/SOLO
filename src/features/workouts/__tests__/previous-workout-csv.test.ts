import { describe, expect, it } from 'vitest'
import { groupPreviousWorkoutCsvRows, parsePreviousWorkoutCsv } from '../lib/previous-workout-csv'

describe('previous workout csv parser', () => {
    it('parses completed workout rows for preview', () => {
        const csv = `workout_date,workout_name,exercise_name,set_number,load_type,weight,assist_weight,added_weight,weight_unit,reps,notes
2026-05-01,Push Day,Incline Press,1,weighted,65,,,lb,10,solid
2026-05-01,Push Day,Assisted Pull-up,1,assisted,,60,,lb,8,`

        const preview = parsePreviousWorkoutCsv(csv)

        expect(preview.rows).toHaveLength(2)
        expect(preview.rows[0]).toMatchObject({
            workoutDate: '2026-05-01',
            workoutName: 'Push Day',
            exerciseName: 'Incline Press',
            loadType: 'weighted',
            weight: 65,
            reps: 10
        })
        expect(preview.rows[1]).toMatchObject({
            loadType: 'assisted',
            assistWeight: 60
        })
        expect(preview.warnings).toHaveLength(0)
    })

    it('detects duplicate sets inside the preview', () => {
        const csv = `workout_date,workout_name,exercise_name,set_number,load_type,weight,assist_weight,added_weight,weight_unit,reps,notes
2026-05-01,Push Day,Incline Press,1,weighted,65,,,lb,10,
2026-05-01,Push Day,Incline Press,1,weighted,65,,,lb,9,`

        const preview = parsePreviousWorkoutCsv(csv)

        expect(preview.duplicateKeys).toHaveLength(1)
    })

    it('accepts common load type labels', () => {
        const csv = `workout_date,workout_name,exercise_name,set_number,load_type,weight,assist_weight,added_weight,weight_unit,reps,notes
2026-05-01,Core,Knee Raise,1,no weight,,,,lb,15,
2026-05-01,Pull,Pull-up,1,assisted-weight,,60,,lb,8,`

        const preview = parsePreviousWorkoutCsv(csv)

        expect(preview.rows.map((row) => row.loadType)).toEqual(['no_weight', 'assisted'])
    })

    it('rejects impossible dates', () => {
        const csv = `workout_date,workout_name,exercise_name,set_number,load_type,weight,assist_weight,added_weight,weight_unit,reps,notes
2026-02-31,Push Day,Incline Press,1,weighted,65,,,lb,10,`

        expect(() => parsePreviousWorkoutCsv(csv)).toThrow(/YYYY-MM-DD/)
    })

    it('groups preview rows by workout date and name', () => {
        const csv = `workout_date,workout_name,exercise_name,set_number,load_type,weight,assist_weight,added_weight,weight_unit,reps,notes
2026-05-01,Push Day,Incline Press,1,weighted,65,,,lb,10,
2026-05-02,Pull Day,Row,1,weighted,100,,,lb,12,`

        const preview = parsePreviousWorkoutCsv(csv)
        const groups = groupPreviousWorkoutCsvRows(preview.rows)

        expect(Object.keys(groups)).toEqual(['2026-05-01 - Push Day', '2026-05-02 - Pull Day'])
    })

    it('throws for missing required headers', () => {
        expect(() => parsePreviousWorkoutCsv('workout_date\n2026-05-01')).toThrow(/missing headers/i)
    })
})
