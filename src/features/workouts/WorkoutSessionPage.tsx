import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { WorkoutSessionLogger } from './components/WorkoutSessionLogger'
import { useWorkoutDays } from './hooks/useWorkouts'
import { useWorkoutSessions } from './hooks/useWorkoutSessions'

export function WorkoutSessionPage() {
    const navigate = useNavigate()
    const { sessionId } = useParams()
    const sessionsQuery = useWorkoutSessions()

    const sessions = sessionsQuery.data ?? []
    const session = sessions.find((currentSession) => currentSession.id === sessionId) ?? null

    const daysQuery = useWorkoutDays(session?.program_id ?? null)
    const days = daysQuery.data ?? []
    const workoutDay = session
        ? days.find((day) => day.id === session.workout_day_id) ?? null
        : null

    if (sessionsQuery.isLoading) {
        return (
            <section>
                <div className="flex min-h-64 items-center justify-center">
                    <div className="flex items-center gap-3 text-sm font-semibold text-stone-500 dark:text-stone-400">
                        <Loader2 className="size-5 animate-spin" />
                        Loading workout session...
                    </div>
                </div>
            </section>
        )
    }

    if (!session) {
        return (
            <section>
                <Link
                    to="/app/workouts"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                    <ArrowLeft className="size-4" />
                    Back to workouts
                </Link>

                <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                    <h1 className="text-2xl font-bold">Workout not found</h1>
                    <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        This workout session could not be found. It may have been completed, deleted, or created under a different account.
                    </p>
                </div>
            </section>
        )
    }

    return (
        <section>
            <Link
                to="/app/workouts"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
                <ArrowLeft className="size-4" />
                Back to workouts
            </Link>

            <WorkoutSessionLogger
                session={session}
                workoutDay={workoutDay}
                onCompleted={() => {
                    navigate('/app/workouts')
                }}
            />
        </section>
    )
}