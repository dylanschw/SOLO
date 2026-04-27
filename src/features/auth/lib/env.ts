type AppEnv = {
    supabaseUrl: string
    supabaseAnonKey: string
}

function readEnv(): AppEnv {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables. Check .env.local')
    }

    return {
        supabaseUrl,
        supabaseAnonKey
    }
}

export const env = readEnv()