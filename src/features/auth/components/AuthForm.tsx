import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { signInWithPassword, signUpWithPassword, type AuthMode } from '../lib/auth-client'
import { protectedHomePath } from '../lib/redirects'

const authSchema = z.object({
    fullName: z.string().max(80, 'Name must be 80 characters or less').optional(),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters')
})

type AuthFormValues = z.infer<typeof authSchema>

export function AuthForm() {
    const [mode, setMode] = useState<AuthMode>('sign-in')
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const navigate = useNavigate()
    const location = useLocation()

    const form = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: ''
        }
    })

    const isSignUp = mode === 'sign-up'
    const isSubmitting = form.formState.isSubmitting

    async function onSubmit(values: AuthFormValues) {
        setStatusMessage(null)
        setErrorMessage(null)

        if (isSignUp) {
            const { data, error } = await signUpWithPassword({
                email: values.email,
                password: values.password,
                fullName: values.fullName
            })

            if (error) {
                setErrorMessage(error.message)
                return
            }

            if (!data.session) {
                setStatusMessage('Account created. Check your email to confirm your account, then sign in.')
                setMode('sign-in')
                form.reset({
                    fullName: '',
                    email: values.email,
                    password: ''
                })
                return
            }

            navigate(protectedHomePath, { replace: true })
            return
        }

        const { error } = await signInWithPassword({
            email: values.email,
            password: values.password
        })

        if (error) {
            setErrorMessage(error.message)
            return
        }

        const fromPath =
            typeof location.state === 'object' && location.state && 'from' in location.state
                ? String(location.state.from)
                : protectedHomePath

        navigate(fromPath, { replace: true })
    }

    return (
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-950">
                <button
                    type="button"
                    onClick={() => {
                        setMode('sign-in')
                        setErrorMessage(null)
                        setStatusMessage(null)
                    }}
                    className={`min-h-11 rounded-xl text-sm font-semibold transition ${mode === 'sign-in'
                            ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                >
                    Sign in
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setMode('sign-up')
                        setErrorMessage(null)
                        setStatusMessage(null)
                    }}
                    className={`min-h-11 rounded-xl text-sm font-semibold transition ${mode === 'sign-up'
                            ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                >
                    Create account
                </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 grid gap-4">
                {isSignUp ? (
                    <label className="grid gap-2">
                        <span className="text-sm font-semibold">Name</span>
                        <input
                            type="text"
                            autoComplete="name"
                            placeholder="John Smith"
                            className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                            {...form.register('fullName')}
                        />
                        {form.formState.errors.fullName ? (
                            <span className="text-sm text-red-600 dark:text-red-300">
                                {form.formState.errors.fullName.message}
                            </span>
                        ) : null}
                    </label>
                ) : null}

                <label className="grid gap-2">
                    <span className="text-sm font-semibold">Email</span>
                    <input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                        {...form.register('email')}
                    />
                    {form.formState.errors.email ? (
                        <span className="text-sm text-red-600 dark:text-red-300">
                            {form.formState.errors.email.message}
                        </span>
                    ) : null}
                </label>

                <label className="grid gap-2">
                    <span className="text-sm font-semibold">Password</span>
                    <input
                        type="password"
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        placeholder="At least 8 characters"
                        className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                        {...form.register('password')}
                    />
                    {form.formState.errors.password ? (
                        <span className="text-sm text-red-600 dark:text-red-300">
                            {form.formState.errors.password.message}
                        </span>
                    ) : null}
                </label>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                    <Mail className="size-4" />
                    {isSubmitting ? 'Working...' : isSignUp ? 'Create account' : 'Sign in'}
                </button>
            </form>

            {statusMessage ? (
                <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
                    {statusMessage}
                </p>
            ) : null}

            {errorMessage ? (
                <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
                    {errorMessage}
                </p>
            ) : null}
        </section>
    )
}