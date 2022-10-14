import Router from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";

import { setCookie, parseCookies, destroyCookie } from 'nookies'

import { api } from "../services/api";


type SignInCredentials = {
    email: string       // diego@rocketseat.team
    password: string    // 123456
}

type AuthContextData = {
    user: User
    signIn: (credentials: SignInCredentials) => Promise<void>
    // signOut: () => void
    isAuthenticated: boolean        
}

type AuthProviderProps = {
    children: ReactNode
}

type User = {
    email: string
    permissions: string[]
    roles: string[]
}

export const AuthContext = createContext({} as AuthContextData)

// let authChannel: BroadcastChannel

export function signOut() {
    destroyCookie(undefined, 'nextauth.token')
    destroyCookie(undefined, 'nextauth.refreshToken')
    
    // authChannel.postMessage('signOut') // sends a message
    Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>()
    const isAuthenticated = !!user

    useEffect(() => {
        // returns a list with all the cookies
        const { 'nextauth.token': token } = parseCookies() 

        if (token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data

                setUser({ email, permissions, roles })
            })
            .catch(() => {
                signOut()
            })
        }
    }, []) // only once

    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('sessions', {
                email,
                password,
            })

            const { token, refreshToken, permissions, roles } = response.data

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 7, // life time: 7 days
                path: '/'
            })

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 7, // life time: 7 days
                path: '/'
            })

            setUser({
                email,
                permissions,
                roles,
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            Router.push('/dashboard')
        } catch (err) {
            console.log(err)
        }
        
    }
    return (
        <AuthContext.Provider value={{ user , signIn, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    )
}