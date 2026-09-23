export interface User {
    id: number
    email: string
    roles: string[]
}

export interface LoginCredentials {
    email: string
    password: string
}