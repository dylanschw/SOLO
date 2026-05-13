import {
    CalendarCheck,
    CheckCircle,
    Pencil,
    Plus,
    RotateCcw,
    Save,
    SkipForward,
    Trash2,
    X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
    useArchiveRoutineItem,
    useCarryUnfinishedTasksToToday,
    useCreateDailyTask,
    useCreateRoutineItem,
    useDailyTasks,
    useDeleteDailyTask,
    useGenerateTodayTasksFromRoutine,
    useRoutineItems,
    useUpdateDailyTask,
    useUpdateDailyTaskStatus,
    useUpdateRoutineItem
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
    const today = todayDate()

    const [activeSection, setActiveSection] = useState<SchedulingSection>('today')
    const [taskDate, setTaskDate] = useState(today)
    const [taskTitle, setTaskTitle] = useState('')
    const [taskCategory, setTaskCategory] = useState('')
    const [taskNotes, setTaskNotes] = useState('')
    const [routineTitle, setRoutineTitle] = useState('')
    const [routineCategory, setRoutineCategory] = useState('')
    const [routineNotes, setRoutineNotes] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
    const [editingTaskTitle, setEditingTaskTitle] = useState('')
    const [editingTaskCategory, setEditingTaskCategory] = useState('')
    const [editingTaskNotes, setEditingTaskNotes] = useState('')
    const [editingTaskDate, setEditingTaskDate] = useState(today)

    const [editingRoutineItemId, setEditingRoutineItemId] = useState<string | null>(null)
    const [editingRoutineTitle, setEditingRoutineTitle] = useState('')
    const [editingRoutineCategory, setEditingRoutineCategory] = useState('')
    const [editingRoutineNotes, setEditingRoutineNotes] = useState('')

    const routineItemsQuery = useRoutineItems()
    const todayTasksQuery = useDailyTasks(today)
    const allTasksQuery = useDailyTasks()

    const createTask = useCreateDailyTask()
    const createRoutineItem = useCreateRoutineItem()
    const updateTaskStatus = useUpdateDailyTaskStatus()
    const deleteTask = useDeleteDailyTask()
    const archiveRoutineItem = useArchiveRoutineItem()
    const generateTodayTasks = useGenerateTodayTasksFromRoutine()
    const updateTask = useUpdateDailyTask()
    const updateRoutineItem = useUpdateRoutineItem()
    const carryUnfinishedTasks = useCarryUnfinishedTasksToToday()

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

    const tasksGroupedByDate = useMemo(() => {
        return allTasks.reduce<Record<string, typeof allTasks>>((groups, task) => {
            const group = groups[task.task_date] ?? []
            group.push(task)
            groups[task.task_date] = group
            return groups
        }, {})
    }, [allTasks])

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
                taskDate,
                title: taskTitle,
                category: taskCategory,
                notes: taskNotes,
                sortOrder: todayTasks.length + 1
            })

            setTaskTitle('')
            setTaskCategory('')
            setTaskNotes('')
            setTaskDate(today)
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

    async function handleCarryUnfinishedTasks() {
        setErrorMessage(null)
        setStatusMessage(null)

        try {
            const copiedTasks = await carryUnfinishedTasks.mutateAsync(today)

            setStatusMessage(
                copiedTasks.length === 0
                    ? 'No unfinished tasks to carry forward.'
                    : `Copied ${copiedTasks.length} unfinished tasks to today.`
            )
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not carry tasks forward.')
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

    function startEditingTask(task: {
        id: string
        task_date: string
        title: string
        category: string | null
        notes: string | null
    }) {
        setEditingTaskId(task.id)
        setEditingTaskDate(task.task_date)
        setEditingTaskTitle(task.title)
        setEditingTaskCategory(task.category ?? '')
        setEditingTaskNotes(task.notes ?? '')
    }

    function cancelEditingTask() {
        setEditingTaskId(null)
        setEditingTaskDate(today)
        setEditingTaskTitle('')
        setEditingTaskCategory('')
        setEditingTaskNotes('')
    }

    async function handleUpdateTask(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)
        setStatusMessage(null)

        if (!editingTaskId) {
            return
        }

        if (!editingTaskTitle.trim()) {
            setErrorMessage('Enter a task title.')
            return
        }

        try {
            await updateTask.mutateAsync({
                taskId: editingTaskId,
                taskDate: editingTaskDate,
                title: editingTaskTitle,
                category: editingTaskCategory,
                notes: editingTaskNotes
            })

            cancelEditingTask()
            setStatusMessage('Task updated.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not update task.')
        }
    }

    function startEditingRoutineItem(item: {
        id: string
        title: string
        category: string | null
        notes: string | null
    }) {
        setEditingRoutineItemId(item.id)
        setEditingRoutineTitle(item.title)
        setEditingRoutineCategory(item.category ?? '')
        setEditingRoutineNotes(item.notes ?? '')
    }

    function cancelEditingRoutineItem() {
        setEditingRoutineItemId(null)
        setEditingRoutineTitle('')
        setEditingRoutineCategory('')
        setEditingRoutineNotes('')
    }

    async function handleUpdateRoutineItem(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)
        setStatusMessage(null)

        if (!editingRoutineItemId) {
            return
        }

        if (!editingRoutineTitle.trim()) {
            setErrorMessage('Enter a routine item.')
            return
        }

        try {
            await updateRoutineItem.mutateAsync({
                routineItemId: editingRoutineItemId,
                title: editingRoutineTitle,
                category: editingRoutineCategory,
                notes: editingRoutineNotes
            })

            cancelEditingRoutineItem()
            setStatusMessage('Routine item updated.')
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Could not update routine item.')
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
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                            <div>
                                <h2 className="text-xl font-bold">Today checklist</h2>
                                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{today}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={handleGenerateTodayTasks}
                                    disabled={generateTodayTasks.isPending}
                                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                >
                                    <RotateCcw className="size-4" />
                                    Routine
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCarryUnfinishedTasks}
                                    disabled={carryUnfinishedTasks.isPending}
                                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                >
                                    Carry over
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateTask} className="mt-5 grid gap-3">
                            <label className="grid gap-2">
                                <span className="text-sm font-semibold">Task date</span>
                                <input
                                    type="date"
                                    value={taskDate}
                                    onChange={(event) => setTaskDate(event.target.value)}
                                    className="min-h-12 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                />
                            </label>

                            <input
                                value={taskTitle}
                                onChange={(event) => setTaskTitle(event.target.value)}
                                placeholder="Add a task"
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
                                    {editingTaskId === task.id ? (
                                        <form onSubmit={handleUpdateTask} className="grid gap-3">
                                            <input
                                                type="date"
                                                value={editingTaskDate}
                                                onChange={(event) => setEditingTaskDate(event.target.value)}
                                                className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                            />

                                            <input
                                                value={editingTaskTitle}
                                                onChange={(event) => setEditingTaskTitle(event.target.value)}
                                                className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                            />

                                            <input
                                                value={editingTaskCategory}
                                                onChange={(event) => setEditingTaskCategory(event.target.value)}
                                                placeholder="Category"
                                                className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                            />

                                            <input
                                                value={editingTaskNotes}
                                                onChange={(event) => setEditingTaskNotes(event.target.value)}
                                                placeholder="Notes"
                                                className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                            />

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={updateTask.isPending}
                                                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
                                                >
                                                    <Save className="size-4" />
                                                    Save
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={cancelEditingTask}
                                                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold dark:border-neutral-800"
                                                >
                                                    <X className="size-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-bold">{task.title}</p>
                                                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                                        {task.task_date} · {task.category || 'General'} · {task.status}
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

                                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
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
                                                    onClick={() => startEditingTask(task)}
                                                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold transition hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                                >
                                                    <Pencil className="size-4" />
                                                    Edit
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
                                        </>
                                    )}
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
                                className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                            >
                                {editingRoutineItemId === item.id ? (
                                    <form onSubmit={handleUpdateRoutineItem} className="grid gap-3">
                                        <input
                                            value={editingRoutineTitle}
                                            onChange={(event) => setEditingRoutineTitle(event.target.value)}
                                            className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                        />

                                        <input
                                            value={editingRoutineCategory}
                                            onChange={(event) => setEditingRoutineCategory(event.target.value)}
                                            placeholder="Category"
                                            className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                        />

                                        <input
                                            value={editingRoutineNotes}
                                            onChange={(event) => setEditingRoutineNotes(event.target.value)}
                                            placeholder="Notes"
                                            className="min-h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-500 dark:border-neutral-700 dark:bg-neutral-950"
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="submit"
                                                disabled={updateRoutineItem.isPending}
                                                className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
                                            >
                                                <Save className="size-4" />
                                                Save
                                            </button>

                                            <button
                                                type="button"
                                                onClick={cancelEditingRoutineItem}
                                                className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold dark:border-neutral-800"
                                            >
                                                <X className="size-4" />
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between gap-3">
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

                                        <div className="flex shrink-0 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => startEditingRoutineItem(item)}
                                                className="grid size-11 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-neutral-900 dark:hover:text-stone-50"
                                                aria-label="Edit routine item"
                                            >
                                                <Pencil className="size-5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleArchiveRoutineItem(item.id)}
                                                className="grid size-11 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-red-600 dark:text-stone-400 dark:hover:bg-neutral-900"
                                                aria-label="Remove routine item"
                                            >
                                                <Trash2 className="size-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
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

                        {Object.entries(tasksGroupedByDate).map(([groupDate, tasks]) => (
                            <div
                                key={groupDate}
                                className="rounded-xl border border-stone-200 p-4 dark:border-neutral-800"
                            >
                                <h3 className="font-bold">{groupDate}</h3>

                                <div className="mt-3 grid gap-2">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="rounded-xl bg-stone-50 p-3 dark:bg-neutral-900"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-bold">{task.title}</p>
                                                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                                        {task.category || 'General'}
                                                    </p>
                                                </div>

                                                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-neutral-950 dark:text-stone-300">
                                                    {task.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            ) : null}
        </section>
    )
}