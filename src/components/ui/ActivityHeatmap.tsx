import type { ActivityHeatmapWeek } from '../../features/dashboard/lib/activity-heatmap'

type ActivityHeatmapProps = {
    weeks: ActivityHeatmapWeek[]
    label: string
}

const levelClasses = [
    'bg-stone-100 dark:bg-neutral-900',
    'bg-emerald-100 dark:bg-emerald-950',
    'bg-emerald-300 dark:bg-emerald-800',
    'bg-emerald-500 dark:bg-emerald-600',
    'bg-emerald-700 dark:bg-emerald-400',
]

export function ActivityHeatmap({ weeks, label }: ActivityHeatmapProps) {
    return (
        <div aria-label={label} className="w-full min-w-0">
            <div className="grid grid-flow-col grid-rows-7 gap-1 [grid-auto-columns:minmax(0,1fr)]">
                {weeks.flatMap((week) =>
                    week.days.map((day) => (
                        <span
                            key={day.date}
                            title={`${day.date}: ${day.count}`}
                            className={`block aspect-square w-full rounded-[3px] ${levelClasses[day.level]}`}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
