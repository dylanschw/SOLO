import { Dumbbell, Plus, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { WorkoutCsvImport } from './components/WorkoutCsvImport'
import type { FormEvent } from 'react'
import type { ExerciseSetType } from '../../lib/supabase/types'
import {
  useActiveWorkoutProgram,
  useAddPlannedExercise,
  useCreateExercise,
  useCreateWorkoutDay,
  useCreateWorkoutProgram,
  useExercises,
  usePlannedExercises,
  useSetActiveWorkoutProgram,
  useWorkoutDays,
  useWorkoutPrograms
} from './hooks/useWorkouts'
import { getExerciseName, getPlannedExercisesForDay, sortWorkoutDays } from './lib/workout-view'

function optionalNumberFromInput(value: string) {
  if (!value.trim()) {
    return null
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return null
  }

  return numberValue
}

function integerFromInput(value: string, fallback: number) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue)) {
    return fallback
  }

  return numberValue
}

export function WorkoutsPage() {
  const programsQuery = useWorkoutPrograms()
  const activeProgramQuery = useActiveWorkoutProgram()
  const createProgram = useCreateWorkoutProgram()
  const setActiveProgram = useSetActiveWorkoutProgram()
  const createDay = useCreateWorkoutDay()
  const exercisesQuery = useExercises()
  const createExercise = useCreateExercise()
  const addPlannedExercise = useAddPlannedExercise()

  const programs = programsQuery.data ?? []
  const activeProgram = activeProgramQuery.data ?? programs.find((program) => program.is_active) ?? null

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const currentProgramId = selectedProgramId ?? activeProgram?.id ?? programs[0]?.id ?? null
  const currentProgram = programs.find((program) => program.id === currentProgramId) ?? activeProgram

  const daysQuery = useWorkoutDays(currentProgramId)
  const days = useMemo(() => sortWorkoutDays(daysQuery.data ?? []), [daysQuery.data])
  const dayIds = useMemo(() => days.map((day) => day.id), [days])
  const plannedExercisesQuery = usePlannedExercises(dayIds)
  const plannedExercises = plannedExercisesQuery.data ?? []
  const exercises = exercisesQuery.data ?? []

  const [programName, setProgramName] = useState('')
  const [programDescription, setProgramDescription] = useState('')
  const [rotationLengthDays, setRotationLengthDays] = useState('8')

  const [dayNumber, setDayNumber] = useState('1')
  const [dayName, setDayName] = useState('')
  const [dayNotes, setDayNotes] = useState('')
  const [isRestDay, setIsRestDay] = useState(false)

  const [exerciseName, setExerciseName] = useState('')
  const [exerciseMuscleGroup, setExerciseMuscleGroup] = useState('')
  const [exerciseEquipment, setExerciseEquipment] = useState('')
  const [exerciseNotes, setExerciseNotes] = useState('')

  const [selectedDayId, setSelectedDayId] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [sortOrder, setSortOrder] = useState('1')
  const [setType, setSetType] = useState<ExerciseSetType>('straight')
  const [plannedSets, setPlannedSets] = useState('3')
  const [minReps, setMinReps] = useState('8')
  const [maxReps, setMaxReps] = useState('12')
  const [restSeconds, setRestSeconds] = useState('120')
  const [targetRpe, setTargetRpe] = useState('8')
  const [backoffPercent, setBackoffPercent] = useState('')
  const [plannedNotes, setPlannedNotes] = useState('')
  const [progressionRule, setProgressionRule] = useState('Dynamic double progression')
  const [deloadRule, setDeloadRule] = useState('Drop weight to 60 to 70 percent, use RPE 6 to 7, keep rest times, reduce to 2 sets')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleCreateProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    const rotationLength = integerFromInput(rotationLengthDays, 8)

    if (!programName.trim()) {
      setErrorMessage('Enter a program name.')
      return
    }

    if (rotationLength < 1 || rotationLength > 31) {
      setErrorMessage('Rotation length must be between 1 and 31 days.')
      return
    }

    try {
      const createdProgram = await createProgram.mutateAsync({
        name: programName,
        description: programDescription,
        rotationLengthDays: rotationLength
      })

      setSelectedProgramId(createdProgram.id)
      setProgramName('')
      setProgramDescription('')
      setRotationLengthDays('8')
      setStatusMessage('Program created.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create program.')
    }
  }

  async function handleSetActive(programId: string) {
    setStatusMessage(null)
    setErrorMessage(null)

    try {
      await setActiveProgram.mutateAsync(programId)
      setSelectedProgramId(programId)
      setStatusMessage('Active program updated.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not set active program.')
    }
  }

  async function handleCreateDay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    if (!currentProgramId) {
      setErrorMessage('Create or select a program first.')
      return
    }

    const parsedDayNumber = integerFromInput(dayNumber, 1)

    if (!dayName.trim()) {
      setErrorMessage('Enter a workout day name.')
      return
    }

    try {
      const createdDay = await createDay.mutateAsync({
        programId: currentProgramId,
        dayNumber: parsedDayNumber,
        name: dayName,
        notes: dayNotes,
        isRestDay
      })

      setSelectedDayId(createdDay.id)
      setDayNumber(String(parsedDayNumber + 1))
      setDayName('')
      setDayNotes('')
      setIsRestDay(false)
      setStatusMessage('Workout day created.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create workout day.')
    }
  }

  async function handleCreateExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    if (!exerciseName.trim()) {
      setErrorMessage('Enter an exercise name.')
      return
    }

    try {
      const createdExercise = await createExercise.mutateAsync({
        name: exerciseName,
        muscleGroup: exerciseMuscleGroup,
        equipment: exerciseEquipment,
        notes: exerciseNotes
      })

      setSelectedExerciseId(createdExercise.id)
      setExerciseName('')
      setExerciseMuscleGroup('')
      setExerciseEquipment('')
      setExerciseNotes('')
      setStatusMessage('Exercise created.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create exercise.')
    }
  }

  async function handleAddPlannedExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    if (!selectedDayId) {
      setErrorMessage('Choose a workout day.')
      return
    }

    if (!selectedExerciseId) {
      setErrorMessage('Choose an exercise.')
      return
    }

    try {
      await addPlannedExercise.mutateAsync({
        workoutDayId: selectedDayId,
        exerciseId: selectedExerciseId,
        sortOrder: integerFromInput(sortOrder, 1),
        setType,
        plannedSets: integerFromInput(plannedSets, 3),
        minReps: optionalNumberFromInput(minReps),
        maxReps: optionalNumberFromInput(maxReps),
        restSeconds: optionalNumberFromInput(restSeconds),
        targetRpe: optionalNumberFromInput(targetRpe),
        backoffPercent: optionalNumberFromInput(backoffPercent),
        notes: plannedNotes,
        progressionRule,
        deloadRule
      })

      setSortOrder(String(integerFromInput(sortOrder, 1) + 1))
      setPlannedNotes('')
      setStatusMessage('Exercise added to workout day.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not add exercise to day.')
    }
  }

  return (
    <section>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Train</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Workouts</h1>

      {statusMessage ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
          {errorMessage}
        </p>
      ) : null}

      <article className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          <Dumbbell className="size-5 text-emerald-600" />
          <h2 className="text-xl font-bold">Current program</h2>
        </div>

        {currentProgram ? (
          <div className="mt-4 rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
            <p className="text-lg font-bold">{currentProgram.name}</p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              {currentProgram.rotation_length_days} day rotation
            </p>
            {currentProgram.description ? (
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                {currentProgram.description}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
            Create your first program below. Your 8 day hypertrophy rotation is supported by this structure.
          </p>
        )}

        <div className="mt-4 grid gap-3">
          {programs.map((program) => (
            <button
              key={program.id}
              type="button"
              onClick={() => setSelectedProgramId(program.id)}
              className={`rounded-xl border p-4 text-left transition ${currentProgramId === program.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900'
                }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{program.name}</p>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {program.rotation_length_days} days
                  </p>
                </div>

                {program.is_active ? (
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-neutral-900 dark:text-stone-300">
                    Select
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {currentProgramId ? (
          <button
            type="button"
            onClick={() => handleSetActive(currentProgramId)}
            disabled={setActiveProgram.isPending}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
          >
            <Star className="size-4" />
            {setActiveProgram.isPending ? 'Updating...' : 'Set selected as active'}
          </button>
        ) : null}
      </article>

      <WorkoutCsvImport
        onImported={() => {
          programsQuery.refetch()
          activeProgramQuery.refetch()
          exercisesQuery.refetch()
          daysQuery.refetch()
          plannedExercisesQuery.refetch()
        }}
      />

      <form
        onSubmit={handleCreateProgram}
        className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <h2 className="text-xl font-bold">Create program</h2>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Program name</span>
            <input
              value={programName}
              onChange={(event) => setProgramName(event.target.value)}
              placeholder="Workout Program Name"
              className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Rotation length</span>
            <input
              type="number"
              inputMode="numeric"
              value={rotationLengthDays}
              onChange={(event) => setRotationLengthDays(event.target.value)}
              className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Description</span>
            <textarea
              value={programDescription}
              onChange={(event) => setProgramDescription(event.target.value)}
              placeholder="Describe your workout program"
              rows={3}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <button
            type="submit"
            disabled={createProgram.isPending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus className="size-4" />
            {createProgram.isPending ? 'Creating...' : 'Create program'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleCreateDay}
        className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <h2 className="text-xl font-bold">Create workout day</h2>

        <div className="mt-5 grid gap-4">
          <div className="grid grid-cols-[90px_1fr] gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Day</span>
              <input
                type="number"
                inputMode="numeric"
                value={dayNumber}
                onChange={(event) => setDayNumber(event.target.value)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Name</span>
              <input
                value={dayName}
                onChange={(event) => setDayName(event.target.value)}
                placeholder="Workout Day Name"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>
          </div>

          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 px-4 dark:border-neutral-700">
            <input
              type="checkbox"
              checked={isRestDay}
              onChange={(event) => setIsRestDay(event.target.checked)}
            />
            <span className="text-sm font-semibold">Rest day</span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Notes</span>
            <textarea
              value={dayNotes}
              onChange={(event) => setDayNotes(event.target.value)}
              placeholder="Optional day notes"
              rows={3}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <button
            type="submit"
            disabled={createDay.isPending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus className="size-4" />
            {createDay.isPending ? 'Creating...' : 'Create day'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleCreateExercise}
        className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <h2 className="text-xl font-bold">Create exercise</h2>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Exercise name</span>
            <input
              value={exerciseName}
              onChange={(event) => setExerciseName(event.target.value)}
              placeholder="Exercise Name"
              className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Muscle group</span>
              <input
                value={exerciseMuscleGroup}
                onChange={(event) => setExerciseMuscleGroup(event.target.value)}
                placeholder="Muscle Group"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Equipment</span>
              <input
                value={exerciseEquipment}
                onChange={(event) => setExerciseEquipment(event.target.value)}
                placeholder="Equipment"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Notes</span>
            <textarea
              value={exerciseNotes}
              onChange={(event) => setExerciseNotes(event.target.value)}
              placeholder="Exercise Notes"
              rows={3}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <button
            type="submit"
            disabled={createExercise.isPending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus className="size-4" />
            {createExercise.isPending ? 'Creating...' : 'Create exercise'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleAddPlannedExercise}
        className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <h2 className="text-xl font-bold">Add exercise to day</h2>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Workout day</span>
            <select
              value={selectedDayId}
              onChange={(event) => setSelectedDayId(event.target.value)}
              className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="">Choose day</option>
              {days.map((day) => (
                <option key={day.id} value={day.id}>
                  Day {day.day_number}: {day.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Exercise</span>
            <select
              value={selectedExerciseId}
              onChange={(event) => setSelectedExerciseId(event.target.value)}
              className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="">Choose exercise</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Order</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Set type</span>
              <select
                value={setType}
                onChange={(event) => setSetType(event.target.value as ExerciseSetType)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              >
                <option value="straight">Straight</option>
                <option value="top_set_backoff">Top set/backoff</option>
                <option value="warmup">Warmup</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Sets</span>
              <input
                type="number"
                value={plannedSets}
                onChange={(event) => setPlannedSets(event.target.value)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">RPE</span>
              <input
                type="number"
                value={targetRpe}
                onChange={(event) => setTargetRpe(event.target.value)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Min reps</span>
              <input
                type="number"
                value={minReps}
                onChange={(event) => setMinReps(event.target.value)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Max reps</span>
              <input
                type="number"
                value={maxReps}
                onChange={(event) => setMaxReps(event.target.value)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Rest seconds</span>
              <input
                type="number"
                value={restSeconds}
                onChange={(event) => setRestSeconds(event.target.value)}
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Backoff percent</span>
              <input
                type="number"
                value={backoffPercent}
                onChange={(event) => setBackoffPercent(event.target.value)}
                placeholder="Optional"
                className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Progression rule</span>
            <textarea
              value={progressionRule}
              onChange={(event) => setProgressionRule(event.target.value)}
              rows={2}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Deload rule</span>
            <textarea
              value={deloadRule}
              onChange={(event) => setDeloadRule(event.target.value)}
              rows={3}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Notes</span>
            <textarea
              value={plannedNotes}
              onChange={(event) => setPlannedNotes(event.target.value)}
              placeholder="Optional notes"
              rows={3}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>

          <button
            type="submit"
            disabled={addPlannedExercise.isPending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus className="size-4" />
            {addPlannedExercise.isPending ? 'Adding...' : 'Add exercise to day'}
          </button>
        </div>
      </form>

      <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-xl font-bold">Program days</h2>

        {days.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
            No days yet. Create Day 1, Day 2, and so on above.
          </p>
        ) : null}

        <div className="mt-4 grid gap-4">
          {days.map((day) => {
            const dayPlannedExercises = getPlannedExercisesForDay(day.id, plannedExercises)

            return (
              <div key={day.id} className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      Day {day.day_number}: {day.name}
                    </p>
                    {day.notes ? (
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{day.notes}</p>
                    ) : null}
                  </div>

                  {day.is_rest_day ? (
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-neutral-900 dark:text-stone-300">
                      Rest
                    </span>
                  ) : null}
                </div>

                {dayPlannedExercises.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {dayPlannedExercises.map((plannedExercise) => (
                      <div key={plannedExercise.id} className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                        <p className="font-semibold">
                          {plannedExercise.sort_order}. {getExerciseName(plannedExercise.exercise_id, exercises)}
                        </p>
                        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                          {plannedExercise.planned_sets} sets
                          {plannedExercise.min_reps && plannedExercise.max_reps
                            ? ` x ${plannedExercise.min_reps}-${plannedExercise.max_reps} reps`
                            : ''}
                          {plannedExercise.target_rpe ? `, RPE ${plannedExercise.target_rpe}` : ''}
                          {plannedExercise.rest_seconds ? `, ${plannedExercise.rest_seconds}s rest` : ''}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                          {plannedExercise.set_type.replaceAll('_', ' ')}
                        </p>
                        {plannedExercise.notes ? (
                          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                            {plannedExercise.notes}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                    No exercises added yet.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </article>
    </section>
  )
}