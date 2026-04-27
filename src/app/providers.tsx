import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applySystemTheme = () => {
      document.documentElement.classList.toggle('dark', mediaQuery.matches)
    }

    applySystemTheme()
    mediaQuery.addEventListener('change', applySystemTheme)

    return () => mediaQuery.removeEventListener('change', applySystemTheme)
  }, [])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
