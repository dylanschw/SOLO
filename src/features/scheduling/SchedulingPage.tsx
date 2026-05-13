import { CalendarCheck, CheckCircle, Plus, RotateCcw, SkipForward, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
    useArchiveRoutineItem,
    useCreateDailyTask,
    useCreateRoutineItem,
    useDailyTasks,
    useDeleteDailyTask,
    useGenerateTodayTasksFromRoutine,
    useRoutineItems,
    useUpdateDailyTaskStatus
} from './hooks/useScheduling'

type SchedulingSection = 'today' | 'routine' | 'history'

const schedulingSections: Array<{
    id: SchedulingSection
    label: string
}> = [
        { id: 'today', label: 'Today' },
        { id: 'routine', label: 'Routine' },
        { id: 'history', label: 'History' }
    ]

function todayDate() {
    return new Date().toISOString().slice(0, 10)
}

export function SchedulingPage() {
    const [activeSection, setActiveSection] = useState<SchedulingSection>('today')
    const [taskTitle, setTaskTitle] = useState('')
    const [taskCategory, setTaskCategory] = useState('')
    const [taskNotes, setTaskNotes] = useState('')
    const [routineTitle, setRoutineTitle] = useState('')
    const [routineCategory, setRoutineCategory] = useState('')
    const [routineNotes, setRoutineNotes] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)

    const today = todayDate()
    const routineItemsQuery = useRoutineItems()
    const todayTasksQuery = useDailyTasks(today)
    const allTasksQuery = useDailyTasks()

    const createTask = useCreateDailyTask()
    const createRoutineItem = useCreateRoutineItem()
    const updateTaskStatus = useUpdateDailyTaskStatus()
    const deleteTask = useDeleteDailyTask()
    const archiveRoutineItem = useArchiveRoutineItem()
    const generateTodayTasks = useGenerateTodayTasksFromRoutine()

    const routineItems = routineItemsQuery.data ?? []
    const todayTasks = todayTasksQuery.data ?? []
    const allTasks = allTasksQuery.data ?? []

    const completionSummary = useMemo(() => {
        const completed = todayTasks.filter((task) => task.status === 'completed').length
        const skipped = todayTasks.filter((task) => task.status === 'skipped').length
        const pending = todayTasks.filter((task) => task.status === 'pending').length

        return {
            completed,
            skipped,
            pending,
            total: todayTasks.length
        }
    }, [todayTasks])

    async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)
        setStatusMessage(null)

        if (!taskTitle.trim()) {
            setErrorMessage('Enter a task title.')
            return
        }

        try {
            await createTask.mutateAsync({
                taskDate: today,
                title: taskTitle,
                category: taskCategory,
                notes: taskNotes,
                sortOrder: todayTasks.length + 1
            })

            setTaskTitle('')
            setTaskCategory('')
            setTaskNotes('')
            setStatusMessage('Task added.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not add task.')
        }
    }

    async function handleCreateRoutineItem(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)
        setStatusMessage(null)

        if (!routineTitle.trim()) {
            setErrorMessage('Enter a routine item.')
            return
        }

        try {
            await createRoutineItem.mutateAsync({
                title: routineTitle,
                category: routineCategory,
                notes: routineNotes,
                sortOrder: routineItems.length + 1
            })

            setRoutineTitle('')
            setRoutineCategory('')
            setRoutineNotes('')
            setStatusMessage('Routine item added.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not add routine item.')
        }
    }

    async function handleGenerateTodayTasks() {
        setErrorMessage(null)
        setStatusMessage(null)

        try {
            const createdTasks = await generateTodayTasks.mutateAsync(today)
            setStatusMessage(
                createdTasks.length === 0
                    ? 'Today already has routine tasks.'
                    : `Added ${createdTasks.length} routine tasks for today.`
            )
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not generate routine tasks.')
        }
    }

    async function handleUpdateTaskStatus(taskId: string, status: 'pending' | 'completed' | 'skipped') {
        setErrorMessage(null)

        try {
            await updateTaskStatus.mutateAsync({ taskId, status })
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not update task.')
        }
    }

    async function handleDeleteTask(taskId: string) {
        const confirmed = window.confirm('Delete this task?')

        if (!confirmed) {
            return
        }

        try {
            await deleteTask.mutateAsync(taskId)
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not delete task.')
        }
    }

    async function handleArchiveRoutineItem(routineItemId: string) {
        const confirmed = window.confirm('Remove this routine item?')

        if (!confirmed) {
            return
        }

        try {
            await archiveRoutineItem.mutateAsync(routineItemId)
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not remove routine item.')
        }
    }

    return (
        <section>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Personal dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Scheduling</h1>

            <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-stone-200 bg-stone-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                {schedulingSections.map((section) => (
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

            {activeSection === 'today' ? (
                <>
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Complete</p>
                            <p className="mt-2 text-2xl font-bold">{completionSummary.completed}</p>
                        </article>

                        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Pending</p>
                            <p className="mt-2 text-2xl font-bold">{completionSummary.pending}</p>
                        </article>

                        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Skipped</p>
                            <p className="mt-2 text-2xl font-bold">{completionSummary.skipped}</p>
                        </article>

                        <article className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                            <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Total</p>
                            <p className="mt-2 text-2xl font-bold">{completionSummary.total}</p>
                        </article>
                    </div>

                    <article className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold">Today checklist</h2>
                                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{today}</p>
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerateTodayTasks}
                                disabled={generateTodayTasks.isPending}
                                className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-900"
                            >
                                <RotateCcw className="size-4" />
                                Routine
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="mt-5 grid gap-3">
                            <input
                                value={taskTitle}
                                onChange={(event) => setTaskTitle(event.target.value)}
                                placeholder="Add a task for today"
                                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <input
                                    value={taskCategory}
                                    onChange={(event) => setTaskCategory(event.target.value)}
                                    placeholder="Category"
                                    className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />

                                <input
                                    value={taskNotes}
                                    onChange={(event) => setTaskNotes(event.target.value)}
                                    placeholder="Notes"
                                    className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={createTask.isPending}
                                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                                <Plus className="size-4" />
                                Add task
                            </button>
                        </form>

                        <div className="mt-5 grid gap-3">
                            {todayTasks.length === 0 ? (
                                <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
                                    No tasks yet. Add a task or generate today’s checklist from your routine.
                                </p>
                            ) : null}

                            {todayTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-bold">{task.title}</p>
                                            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                                {task.category || 'General'} · {task.status}
                                            </p>
                                            {task.notes ? (
                                                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                                                    {task.notes}
                                                </p>
                                            ) : null}
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${task.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900'
                                                    : task.status === 'skipped'
                                                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900'
                                                        : 'bg-stone-100 text-stone-600 dark:bg-neutral-900 dark:text-stone-300'
                                                }`}
                                        >
                                            {task.status}
                                        </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                        >
                                            <CheckCircle className="size-4" />
                                            Done
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                        >
                                            Pending
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleUpdateTaskStatus(task.id, 'skipped')}
                                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                        >
                                            <SkipForward className="size-4" />
                                            Skip
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-neutral-800 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="size-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>
                </>
            ) : null}

            {activeSection === 'routine' ? (
                <article className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="flex items-center gap-3">
                        <CalendarCheck className="size-5 text-emerald-600" />
                        <h2 className="text-xl font-bold">Daily routine</h2>
                    </div>

                    <form onSubmit={handleCreateRoutineItem} className="mt-5 grid gap-3">
                        <input
                            value={routineTitle}
                            onChange={(event) => setRoutineTitle(event.target.value)}
                            placeholder="Add routine item"
                            className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                        />

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input
                                value={routineCategory}
                                onChange={(event) => setRoutineCategory(event.target.value)}
                                placeholder="Category"
                                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />

                            <input
                                value={routineNotes}
                                onChange={(event) => setRoutineNotes(event.target.value)}
                                placeholder="Notes"
                                className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={createRoutineItem.isPending}
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                            <Plus className="size-4" />
                            Add routine item
                        </button>
                    </form>

                    <div className="mt-5 grid gap-3">
                        {routineItems.length === 0 ? (
                            <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
                                No routine items yet.
                            </p>
                        ) : null}

                        {routineItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                            >
                                <div className="min-w-0">
                                    <p className="font-bold">{item.title}</p>
                                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                        {item.category || 'General'} · daily
                                    </p>
                                    {item.notes ? (
                                        <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                                            {item.notes}
                                        </p>
                                    ) : null}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleArchiveRoutineItem(item.id)}
                                    className="grid size-11 shrink-0 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-red-600 dark:text-stone-400 dark:hover:bg-neutral-900"
                                    aria-label="Remove routine item"
                                >
                                    <Trash2 className="size-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </article>
            ) : null}

            {activeSection === 'history' ? (
                <article className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                    <h2 className="text-xl font-bold">Task history</h2>

                    <div className="mt-4 grid gap-3">
                        {allTasks.length === 0 ? (
                            <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
                                Task history will appear here.
                            </p>
                        ) : null}

                        {allTasks.map((task) => (
                            <div
                                key={task.id}
                                className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-bold">{task.title}</p>
                                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                            {task.task_date} · {task.category || 'General'}
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-neutral-900 dark:text-stone-300">
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            ) : null}
        </section>
    )
}