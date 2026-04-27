export const protectedHomePath = '/app/dashboard'
export const publicHomePath = '/'

export function getAuthCallbackUrl() {
    return `${window.location.origin}/auth/callback`
}

export function getPostAuthRedirectPath() {
    return protectedHomePath
}

export function shouldRedirectSignedInUser(pathname: string) {
    return pathname === publicHomePath
}

export function shouldRedirectSignedOutUser(pathname: string) {
    return pathname.startsWith('/app')
}