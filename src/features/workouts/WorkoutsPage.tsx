import { Archive, Dumbbell, Pencil, Play, Plus, Save, Star, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { ExerciseSetType } from '../../lib/supabase/types'
import { WorkoutCsvImport } from './components/WorkoutCsvImport'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildExerciseHistory } from './lib/exercise-history';
import { useProfile } from '../profile/hooks/useProfile';
import { WorkoutTextImportWizard } from './components/WorkoutTextImportWizard'
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
  useArchiveWorkoutProgram,
  useDeletePlannedExercise,
  useDeleteWorkoutDay,
  useUpdatePlannedExercise,
  useUpdateWorkoutDay,
  useUpdateWorkoutProgram,
  useWorkoutPrograms
} from './hooks/useWorkouts'
import {
  useAllWorkoutSets,
  useDeleteWorkoutSession,
  useStartWorkoutSession,
  useWorkoutSessions
} from './hooks/useWorkoutSessions';
import { getExerciseName, getPlannedExercisesForDay, sortWorkoutDays } from './lib/workout-view'
import type { WorkoutDay } from './lib/workouts'
import type { WorkoutSession } from './lib/workout-sessions'

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

type WorkoutPageSection = 'start' | 'build' | 'import' | 'edit' | 'progress' | 'history'

const workoutPageSections: Array<{
  id: WorkoutPageSection
  label: string
}> = [
    { id: 'start', label: 'Start' },
    { id: 'build', label: 'Build' },
    { id: 'import', label: 'Import' },
    { id: 'edit', label: 'Edit' },
    { id: 'progress', label: 'Progress' },
    { id: 'history', label: 'History' }
  ]

export function WorkoutsPage() {
  const deleteWorkoutSession = useDeleteWorkoutSession();
  const navigate = useNavigate()
  const programsQuery = useWorkoutPrograms()
  const activeProgramQuery = useActiveWorkoutProgram()
  const createProgram = useCreateWorkoutProgram()
  const profileQuery = useProfile();
  const allWorkoutSetsQuery = useAllWorkoutSets();
  const setActiveProgram = useSetActiveWorkoutProgram()
  const createDay = useCreateWorkoutDay()
  const exercisesQuery = useExercises()
  const createExercise = useCreateExercise()
  const addPlannedExercise = useAddPlannedExercise()
  const updateProgram = useUpdateWorkoutProgram()
  const archiveProgram = useArchiveWorkoutProgram()
  const updateDay = useUpdateWorkoutDay()
  const deleteDay = useDeleteWorkoutDay()
  const updatePlannedExercise = useUpdatePlannedExercise()
  const deletePlannedExercise = useDeletePlannedExercise()
  const startSession = useStartWorkoutSession()
  const sessionsQuery = useWorkoutSessions()
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
  const recentSessions = sessionsQuery.data ?? []

  const preferredUnit = profileQuery.data?.preferred_weight_unit ?? 'lb';
  const allWorkoutSets = allWorkoutSetsQuery.data ?? [];

  const exerciseHistory = useMemo(
    () =>
      buildExerciseHistory({
        sets: allWorkoutSets,
        exercises,
        unit: preferredUnit,
      }),
    [allWorkoutSets, exercises, preferredUnit]
  );

  const inProgressSessions = recentSessions.filter((session) => session.status === 'in_progress')

  const currentProgramInProgressSessions = inProgressSessions.filter(
    (session) => session.program_id === currentProgramId
  )

  const currentResumeSession = currentProgramInProgressSessions[0] ?? null

  const currentResumeDay = currentResumeSession
    ? days.find((day) => day.id === currentResumeSession.workout_day_id) ?? null
    : null

  const [activeSection, setActiveSection] = useState<WorkoutPageSection>('start')
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null)
  const [editingProgramName, setEditingProgramName] = useState('')
  const [editingProgramDescription, setEditingProgramDescription] = useState('')
  const [editingProgramRotationLength, setEditingProgramRotationLength] = useState('8')

  const [editingDayId, setEditingDayId] = useState<string | null>(null)
  const [editingDayNumber, setEditingDayNumber] = useState('1')
  const [editingDayName, setEditingDayName] = useState('')
  const [editingDayNotes, setEditingDayNotes] = useState('')
  const [editingDayIsRestDay, setEditingDayIsRestDay] = useState(false)

  const [editingPlannedExerciseId, setEditingPlannedExerciseId] = useState<string | null>(null)
  const [editingPlannedSortOrder, setEditingPlannedSortOrder] = useState('1')
  const [editingPlannedSetType, setEditingPlannedSetType] = useState<ExerciseSetType>('straight')
  const [editingPlannedSets, setEditingPlannedSets] = useState('3')
  const [editingPlannedMinReps, setEditingPlannedMinReps] = useState('')
  const [editingPlannedMaxReps, setEditingPlannedMaxReps] = useState('')
  const [editingPlannedRestSeconds, setEditingPlannedRestSeconds] = useState('')
  const [editingPlannedTargetRpe, setEditingPlannedTargetRpe] = useState('')
  const [editingPlannedBackoffPercent, setEditingPlannedBackoffPercent] = useState('')
  const [editingPlannedNotes, setEditingPlannedNotes] = useState('')
  const [editingPlannedProgressionRule, setEditingPlannedProgressionRule] = useState('')
  const [editingPlannedDeloadRule, setEditingPlannedDeloadRule] = useState('')

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

  function refetchWorkoutData() {
    programsQuery.refetch()
    activeProgramQuery.refetch()
    exercisesQuery.refetch()
    daysQuery.refetch()
    plannedExercisesQuery.refetch()
    sessionsQuery.refetch()
  }

  function startEditingProgram() {
    if (!currentProgram) {
      return
    }

    setEditingProgramId(currentProgram.id)
    setEditingProgramName(currentProgram.name)
    setEditingProgramDescription(currentProgram.description ?? '')
    setEditingProgramRotationLength(String(currentProgram.rotation_length_days))
  }

  function cancelEditingProgram() {
    setEditingProgramId(null)
    setEditingProgramName('')
    setEditingProgramDescription('')
    setEditingProgramRotationLength('8')
  }


  async function handleDeleteWorkoutSession(sessionId: string) {
    setStatusMessage(null);
    setErrorMessage(null);

    const confirmed = window.confirm('Delete this workout from history?');

    if (!confirmed) {
      return;
    }

    try {
      await deleteWorkoutSession.mutateAsync(sessionId);
      setStatusMessage('Workout deleted from history.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not delete workout.');
    }
  }

  async function handleUpdateProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    if (!editingProgramId) {
      return
    }

    const rotationLength = integerFromInput(editingProgramRotationLength, 8)

    if (!editingProgramName.trim()) {
      setErrorMessage('Program name is required.')
      return
    }

    try {
      await updateProgram.mutateAsync({
        programId: editingProgramId,
        name: editingProgramName,
        description: editingProgramDescription,
        rotationLengthDays: rotationLength
      })

      cancelEditingProgram()
      setStatusMessage('Program updated.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update program.')
    }
  }

  async function handleArchiveProgram() {
    setStatusMessage(null)
    setErrorMessage(null)

    if (!currentProgramId) {
      return
    }

    const confirmed = window.confirm('Archive this program? It will be hidden from your active program list.')

    if (!confirmed) {
      return
    }

    try {
      await archiveProgram.mutateAsync(currentProgramId)
      setSelectedProgramId(null)
      setStatusMessage('Program archived.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not archive program.')
    }
  }

  function startEditingDay(day: WorkoutDay) {
    setEditingDayId(day.id)
    setEditingDayNumber(String(day.day_number))
    setEditingDayName(day.name)
    setEditingDayNotes(day.notes ?? '')
    setEditingDayIsRestDay(day.is_rest_day)
  }

  function cancelEditingDay() {
    setEditingDayId(null)
    setEditingDayNumber('1')
    setEditingDayName('')
    setEditingDayNotes('')
    setEditingDayIsRestDay(false)
  }

  async function handleUpdateDay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    if (!editingDayId) {
      return
    }

    if (!editingDayName.trim()) {
      setErrorMessage('Workout day name is required.')
      return
    }

    try {
      await updateDay.mutateAsync({
        dayId: editingDayId,
        dayNumber: integerFromInput(editingDayNumber, 1),
        name: editingDayName,
        notes: editingDayNotes,
        isRestDay: editingDayIsRestDay
      })

      cancelEditingDay()
      setStatusMessage('Workout day updated.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update workout day.')
    }
  }

  async function handleDeleteDay(dayId: string) {
    setStatusMessage(null)
    setErrorMessage(null)

    const confirmed = window.confirm('Delete this workout day? Its planned exercises will be hidden with it.')

    if (!confirmed) {
      return
    }

    try {
      await deleteDay.mutateAsync(dayId)
      setStatusMessage('Workout day deleted.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not delete workout day.')
    }
  }

  function startEditingPlannedExercise(plannedExercise: {
    id: string
    sort_order: number
    set_type: ExerciseSetType
    planned_sets: number
    min_reps: number | null
    max_reps: number | null
    rest_seconds: number | null
    target_rpe: number | null
    backoff_percent: number | null
    notes: string | null
    progression_rule: string | null
    deload_rule: string | null
  }) {
    setEditingPlannedExerciseId(plannedExercise.id)
    setEditingPlannedSortOrder(String(plannedExercise.sort_order))
    setEditingPlannedSetType(plannedExercise.set_type)
    setEditingPlannedSets(String(plannedExercise.planned_sets))
    setEditingPlannedMinReps(plannedExercise.min_reps?.toString() ?? '')
    setEditingPlannedMaxReps(plannedExercise.max_reps?.toString() ?? '')
    setEditingPlannedRestSeconds(plannedExercise.rest_seconds?.toString() ?? '')
    setEditingPlannedTargetRpe(plannedExercise.target_rpe?.toString() ?? '')
    setEditingPlannedBackoffPercent(plannedExercise.backoff_percent?.toString() ?? '')
    setEditingPlannedNotes(plannedExercise.notes ?? '')
    setEditingPlannedProgressionRule(plannedExercise.progression_rule ?? '')
    setEditingPlannedDeloadRule(plannedExercise.deload_rule ?? '')
  }

  function cancelEditingPlannedExercise() {
    setEditingPlannedExerciseId(null)
    setEditingPlannedSortOrder('1')
    setEditingPlannedSetType('straight')
    setEditingPlannedSets('3')
    setEditingPlannedMinReps('')
    setEditingPlannedMaxReps('')
    setEditingPlannedRestSeconds('')
    setEditingPlannedTargetRpe('')
    setEditingPlannedBackoffPercent('')
    setEditingPlannedNotes('')
    setEditingPlannedProgressionRule('')
    setEditingPlannedDeloadRule('')
  }

  async function handleUpdatePlannedExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage(null)
    setErrorMessage(null)

    if (!editingPlannedExerciseId) {
      return
    }

    try {
      await updatePlannedExercise.mutateAsync({
        plannedExerciseId: editingPlannedExerciseId,
        sortOrder: integerFromInput(editingPlannedSortOrder, 1),
        setType: editingPlannedSetType,
        plannedSets: integerFromInput(editingPlannedSets, 3),
        minReps: optionalNumberFromInput(editingPlannedMinReps),
        maxReps: optionalNumberFromInput(editingPlannedMaxReps),
        restSeconds: optionalNumberFromInput(editingPlannedRestSeconds),
        targetRpe: optionalNumberFromInput(editingPlannedTargetRpe),
        backoffPercent: optionalNumberFromInput(editingPlannedBackoffPercent),
        notes: editingPlannedNotes,
        progressionRule: editingPlannedProgressionRule,
        deloadRule: editingPlannedDeloadRule
      })

      cancelEditingPlannedExercise()
      setStatusMessage('Planned exercise updated.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update planned exercise.')
    }
  }

  async function handleDeletePlannedExercise(plannedExerciseId: string) {
    setStatusMessage(null)
    setErrorMessage(null)

    const confirmed = window.confirm('Remove this exercise from the workout day?')

    if (!confirmed) {
      return
    }

    try {
      await deletePlannedExercise.mutateAsync(plannedExerciseId)
      setStatusMessage('Planned exercise removed.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not remove planned exercise.')
    }
  }

  function handleResumeWorkout(session: WorkoutSession) {
    setStatusMessage(null)
    setErrorMessage(null)

    const workoutDay = days.find((day) => day.id === session.workout_day_id) ?? null

    if (!workoutDay) {
      setErrorMessage('Could not find the workout day for this session. Try selecting the matching program first.')
      return
    }

    setActiveSection('start')
    setStatusMessage('Workout resumed.')
    navigate(`/app/workouts/session/${session.id}`)
  }

  async function handleStartWorkout(day: WorkoutDay) {
    setStatusMessage(null)
    setErrorMessage(null)

    if (!currentProgramId) {
      setErrorMessage('Choose a program first.')
      return
    }

    if (day.is_rest_day) {
      setErrorMessage('Choose a training day, not a rest day.')
      return
    }

    try {
      const session = await startSession.mutateAsync({
        programId: currentProgramId,
        workoutDayId: day.id
      })

      setActiveSection('start')
      setStatusMessage('Workout started.')
      navigate(`/app/workouts/session/${session.id}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not start workout.')
    }
  }

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
      <div className="mt-5 grid grid-cols-5 gap-1 rounded-2xl border border-stone-200 bg-stone-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {workoutPageSections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`min-h-11 rounded-xl px-2 text-xs font-semibold transition ${activeSection === section.id
              ? 'bg-white text-stone-950 shadow-sm dark:bg-neutral-950 dark:text-stone-50'
              : 'text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-50'
              }`}
          >
            {section.label}
          </button>
        ))}
      </div>
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



      {activeSection === 'start' ? (
        <>
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
                Create your first program below.
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={startEditingProgram}
                disabled={!currentProgram}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                <Pencil className="size-4" />
                Edit program
              </button>

              <button
                type="button"
                onClick={handleArchiveProgram}
                disabled={!currentProgramId || archiveProgram.isPending}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-red-950/30"
              >
                <Archive className="size-4" />
                Archive
              </button>
            </div>

            {editingProgramId ? (
              <form onSubmit={handleUpdateProgram} className="mt-4 grid gap-4 rounded-xl border border-stone-200 p-4 dark:border-neutral-800">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Program name</span>
                  <input
                    value={editingProgramName}
                    onChange={(event) => setEditingProgramName(event.target.value)}
                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Rotation length (days)</span>
                  <input
                    type="number"
                    value={editingProgramRotationLength}
                    onChange={(event) => setEditingProgramRotationLength(event.target.value)}
                    className="min-h-12 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Description</span>
                  <textarea
                    value={editingProgramDescription}
                    onChange={(event) => setEditingProgramDescription(event.target.value)}
                    rows={3}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={updateProgram.isPending}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Save className="size-4" />
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditingProgram}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold dark:border-neutral-800"
                  >
                    <X className="size-4" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

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

          {currentResumeSession ? (
            <article className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Workout in progress
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-stone-950 dark:text-stone-50">
                    {currentResumeDay ? currentResumeDay.name : 'Saved workout session'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                    Started{' '}
                    {currentResumeSession.started_at
                      ? new Date(currentResumeSession.started_at).toLocaleString()
                      : currentResumeSession.session_date}
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-neutral-950 dark:text-emerald-300 dark:ring-emerald-900">
                  Active
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleResumeWorkout(currentResumeSession)}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Resume workout
              </button>
            </article>
          ) : null}

          <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-xl font-bold">Start workout</h2>
            {currentResumeSession ? (
              <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                Finish or resume your current workout before starting another workout from this program.
              </p>
            ) : null}

            {days.filter((day) => !day.is_rest_day).length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                Create workout days and add exercises before starting a workout.
              </p>
            ) : null}

            <div className="mt-4 grid gap-3">
              {days
                .filter((day) => !day.is_rest_day)
                .map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleStartWorkout(day)}
                    disabled={startSession.isPending || Boolean(currentResumeSession)}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                  >
                    <span className="font-semibold">
                      Day {day.day_number}: {day.name}
                    </span>
                    <Play className="size-4" />
                  </button>
                ))}
            </div>
          </article>
        </>
      ) : null}

      {
        activeSection === 'import' ? (
          <>
            <WorkoutCsvImport onImported={refetchWorkoutData} />

            <WorkoutTextImportWizard onImported={refetchWorkoutData} />
          </>
        ) : null
      }
      {
        activeSection === 'build' ? (
          <>
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
                  <span className="text-sm font-semibold">Rotation length (days)</span>
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
                    placeholder="Program description"
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[90px_1fr]">
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    placeholder="Exercise notes"
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          </>
        ) : null}

      {
        activeSection === 'edit' ? (
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
                const isEditingThisDay = editingDayId === day.id

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

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => startEditingDay(day)}
                        className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                      >
                        <Pencil className="size-4" />
                        Edit day
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDay(day.id)}
                        disabled={deleteDay.isPending}
                        className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </button>
                    </div>

                    {isEditingThisDay ? (
                      <form onSubmit={handleUpdateDay} className="mt-4 grid gap-4 rounded-xl bg-stone-50 p-4 dark:bg-neutral-900">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[90px_1fr]">
                          <label className="grid min-w-0 gap-2">
                            <span className="text-sm font-semibold">Day</span>
                            <input
                              type="number"
                              value={editingDayNumber}
                              onChange={(event) => setEditingDayNumber(event.target.value)}
                              className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                          </label>

                          <label className="grid min-w-0 gap-2">
                            <span className="text-sm font-semibold">Name</span>
                            <input
                              value={editingDayName}
                              onChange={(event) => setEditingDayName(event.target.value)}
                              className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                          </label>
                        </div>

                        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 dark:border-neutral-700 dark:bg-neutral-950">
                          <input
                            type="checkbox"
                            checked={editingDayIsRestDay}
                            onChange={(event) => setEditingDayIsRestDay(event.target.checked)}
                          />
                          <span className="text-sm font-semibold">Rest day</span>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold">Notes</span>
                          <textarea
                            value={editingDayNotes}
                            onChange={(event) => setEditingDayNotes(event.target.value)}
                            rows={3}
                            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                          />
                        </label>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="submit"
                            disabled={updateDay.isPending}
                            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <Save className="size-4" />
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditingDay}
                            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold dark:border-neutral-800 dark:bg-neutral-950"
                          >
                            <X className="size-4" />
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {dayPlannedExercises.length > 0 ? (
                      <div className="mt-4 grid gap-3">
                        {dayPlannedExercises.map((plannedExercise) => {
                          const isEditingThisExercise = editingPlannedExerciseId === plannedExercise.id

                          return (
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

                              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                  type="button"
                                  onClick={() => startEditingPlannedExercise(plannedExercise)}
                                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                                >
                                  <Pencil className="size-4" />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePlannedExercise(plannedExercise.id)}
                                  disabled={deletePlannedExercise.isPending}
                                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 className="size-4" />
                                  Remove
                                </button>
                              </div>

                              {isEditingThisExercise ? (
                                <form onSubmit={handleUpdatePlannedExercise} className="mt-4 grid gap-4 rounded-xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <label className="grid min-w-0 gap-2">
                                      <span className="text-sm font-semibold">Order</span>
                                      <input
                                        type="number"
                                        value={editingPlannedSortOrder}
                                        onChange={(event) => setEditingPlannedSortOrder(event.target.value)}
                                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                      />
                                    </label>

                                    <label className="grid min-w-0 gap-2">
                                      <span className="text-sm font-semibold">Set type</span>
                                      <select
                                        value={editingPlannedSetType}
                                        onChange={(event) => setEditingPlannedSetType(event.target.value as ExerciseSetType)}
                                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                      >
                                        <option value="straight">Straight</option>
                                        <option value="top_set_backoff">Top set/backoff</option>
                                        <option value="warmup">Warmup</option>
                                        <option value="custom">Custom</option>
                                      </select>
                                    </label>

                                    <label className="grid min-w-0 gap-2">
                                      <span className="text-sm font-semibold">Sets</span>
                                      <input
                                        type="number"
                                        value={editingPlannedSets}
                                        onChange={(event) => setEditingPlannedSets(event.target.value)}
                                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                      />
                                    </label>

                                    <label className="grid min-w-0 gap-2">
                                      <span className="text-sm font-semibold">RPE target</span>
                                      <input
                                        type="number"
                                        value={editingPlannedTargetRpe}
                                        onChange={(event) => setEditingPlannedTargetRpe(event.target.value)}
                                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                      />
                                    </label>

                                    <label className="grid min-w-0 gap-2">
                                      <span className="text-sm font-semibold">Min reps</span>
                                      <input
                                        type="number"
                                        value={editingPlannedMinReps}
                                        onChange={(event) => setEditingPlannedMinReps(event.target.value)}
                                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                      />
                                    </label>

                                    <label className="grid min-w-0 gap-2">
                                      <span className="text-sm font-semibold">Max reps</span>
                                      <input
                                        type="number"
                                        value={editingPlannedMaxReps}
                                        onChange={(event) => setEditingPlannedMaxReps(event.target.value)}
                                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                      />
                                    </label>

                                    <label className="grid min-w-0 gap-2">
                                      <span className="text-sm font-semibold">Rest seconds</span>
                                      <input
                                        type="number"
                                        value={editingPlannedRestSeconds}
                                        onChange={(event) => setEditingPlannedRestSeconds(event.target.value)}
                                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                      />
                                    </label>

                                    <label className="grid min-w-0 gap-2">
                                      <span className="text-sm font-semibold">Backoff percent</span>
                                      <input
                                        type="number"
                                        value={editingPlannedBackoffPercent}
                                        onChange={(event) => setEditingPlannedBackoffPercent(event.target.value)}
                                        className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                      />
                                    </label>
                                  </div>

                                  <label className="grid gap-2">
                                    <span className="text-sm font-semibold">Progression rule</span>
                                    <textarea
                                      value={editingPlannedProgressionRule}
                                      onChange={(event) => setEditingPlannedProgressionRule(event.target.value)}
                                      rows={2}
                                      className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                    />
                                  </label>

                                  <label className="grid gap-2">
                                    <span className="text-sm font-semibold">Deload rule</span>
                                    <textarea
                                      value={editingPlannedDeloadRule}
                                      onChange={(event) => setEditingPlannedDeloadRule(event.target.value)}
                                      rows={3}
                                      className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                    />
                                  </label>

                                  <label className="grid gap-2">
                                    <span className="text-sm font-semibold">Notes</span>
                                    <textarea
                                      value={editingPlannedNotes}
                                      onChange={(event) => setEditingPlannedNotes(event.target.value)}
                                      rows={3}
                                      className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                    />
                                  </label>

                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <button
                                      type="submit"
                                      disabled={updatePlannedExercise.isPending}
                                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                      <Save className="size-4" />
                                      Save
                                    </button>

                                    <button
                                      type="button"
                                      onClick={cancelEditingPlannedExercise}
                                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold dark:border-neutral-800"
                                    >
                                      <X className="size-4" />
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : null}
                            </div>
                          )
                        })}
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
        ) : null
      }

      {activeSection === 'progress' ? (
        <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-xl font-bold">Exercise progress</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
            See recent sets, best weights, and estimated strength trends from your workout history.
          </p>

          {exerciseHistory.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-300">
              Log workout sets to start building exercise history.
            </p>
          ) : null}

          <div className="mt-4 grid gap-4">
            {exerciseHistory.map((exercise) => (
              <div
                key={exercise.exerciseId}
                className="rounded-2xl border border-stone-200 p-4 dark:border-neutral-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold">{exercise.exerciseName}</h3>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      {exercise.totalSets} logged sets
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
                    {exercise.latestSet?.weight ?? '--'} {preferredUnit}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      Best weight
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {exercise.bestWeightSet?.weight ?? '--'} {preferredUnit}
                    </p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      {exercise.bestWeightSet?.reps ? `${exercise.bestWeightSet.reps} reps` : 'No reps logged'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      Best estimated 1RM
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {exercise.bestEstimatedOneRepMaxSet?.estimatedOneRepMax ?? '--'} {preferredUnit}
                    </p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      Estimate from weight and reps
                    </p>
                  </div>
                </div>

                {exercise.chartPoints.length >= 2 ? (
                  <div className="mt-4 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={exercise.chartPoints} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} width={34} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="estimatedOneRepMax"
                          strokeWidth={3}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-2">
                  {exercise.recentSets.map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-3 text-sm dark:bg-neutral-900"
                    >
                      <span className="font-semibold">
                        {set.weight ?? '--'} {preferredUnit} x {set.reps ?? '--'}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {new Date(set.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {
        activeSection === 'history' ? (

          <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-xl font-bold">Workout history</h2>

            {recentSessions.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
                Completed and in progress workouts will appear here.
              </p>
            ) : null}

            <div className="mt-4 grid gap-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800">
                  <p className="font-semibold">{session.session_date}</p>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Status: {session.status.replaceAll('_', ' ')}
                  </p>
                  {session.notes ? (
                    <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{session.notes}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleDeleteWorkoutSession(session.id)}
                    disabled={deleteWorkoutSession.isPending}
                    className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="size-4" />
                    Delete workout
                  </button>
                </div>
              ))}
            </div>
          </article>
        ) : null
      }
    </section >
  )
}