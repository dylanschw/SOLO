import { Navigate, Outlet } from 'react-router-dom'
import { protectedHomePath } from '../lib/redirects'
import { useAuth } from '../hooks/useAuth'

export function PublicOnlyRoute() {
    const { status } = useAuth()

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
                <div className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">SOLO</p>
                    <p className="mt-2 text-lg font-bold">Checking your session...</p>
                </div>
            </div>
        )
    }

    if (status === 'authenticated') {
        return <Navigate to={protectedHomePath} replace />
    }

    return <Outlet />
}