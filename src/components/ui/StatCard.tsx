import type { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: string
  detail: string
  icon: ReactNode
}

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between text-stone-500 dark:text-stone-400">
        <span className="text-sm font-medium">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-semibold tracking-normal text-stone-950 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{detail}</p>
    </article>
  )
}

