import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const themeStorageKey = 'solo-theme'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(themeStorageKey, theme)
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem(themeStorageKey)

        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    const nextTheme = theme === 'dark' ? 'light' : 'dark'

    return (
        <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
        >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
    )
}