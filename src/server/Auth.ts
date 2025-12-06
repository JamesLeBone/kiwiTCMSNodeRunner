'use server'
import { cookies } from 'next/headers.js'
import * as Users from './lib/Users'
import * as Sessions from './lib/Sessions'
import { getCurrentUser } from '@server/lib/Auth'
import { cache } from 'react'

// Use this
import { Operation, TypedOperationResult } from '../lib/Operation'

async function logout() : Promise<Operation> {
    const cookieStore = await cookies()
    // cookieStore.clear() // Clear all cookies
    cookieStore.delete('sessionId')
    cookieStore.delete('username')

    // Find a way to delete from db
    // if (sessionId && username) {
    //     Sessions.clear(username.value, sessionId.value)
    // }

    return {
        id: 'logout',
        status: true,
        message: 'Logged out'
    }
}

export type loginCredentails = {
    username: string,
    password: string
}

async function login({ username, password }: loginCredentails) {
    const op = {
        id: 'login',
        status: false,
        message: ''
    } as TypedOperationResult<Users.verifiedUser>
    if (typeof username == 'undefined' || typeof password == 'undefined') {
        return op.message = 'missing username and password', op
    }

    const cookieStore = await cookies()

    const loginEvent = await Users.login(username,password)
    if (loginEvent.data == null) {
        return loginEvent
    }
    const user = loginEvent.data
    
    const session = await Sessions.createSession(user.userId)
    if (!session) {
        return op.message = 'Failed to create session', op
    }

    cookieStore.set('sessionId',session.secret, {expires: session.expiresAt})
    cookieStore.set('username',username)

    console.debug('User', username, 'logged in with session', session)

    op.status = true
    op.message = 'Login successful'
    op.data = user
    return op
}

// Cache the current user for the duration of the request
const currentUser = cache(async () => getCurrentUser())
// Get the current user ID for the duration of the request
const getUserId = cache(async () => {
    const u = await getCurrentUser()
    if (!u.data) return null
    return u.data.userId
})

export {
    login,
    logout,
    currentUser,
    getUserId
}

