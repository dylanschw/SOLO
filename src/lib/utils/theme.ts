export type AppTheme = 'light' | 'dark'

const themeStorageKey = 'solo-theme-preference'

export function applyTheme(theme: AppTheme) {
    const root = document.documentElement

    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    localStorage.setItem(themeStorageKey, theme)
}

export function getStoredTheme(): AppTheme {
    const storedTheme = localStorage.getItem(themeStorageKey)

    return storedTheme === 'dark' ? 'dark' : 'light'
}