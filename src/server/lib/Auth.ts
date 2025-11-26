'use server'
import { cookies } from 'next/headers.js'
import * as Sessions from '@server/lib/Sessions'
import { TypedOperationResult } from '@lib/Operation'
import type { CurrentUser } from '@server/lib/Users'

/**
 * Get the current user
 * for when you want the user but should have been warned if not logged in
 * elsewhere.
 */
async function currentUser() : Promise<CurrentUser | null> {
    const cookieStore = await cookies()
    // const userCookie = cookieStore.get('username') ?? false
    const sessionIdCookie = cookieStore.get('sessionId')
    if (!sessionIdCookie) return null
    
    const sessionId = sessionIdCookie.value
    if (typeof sessionId != 'string' || sessionId == '' || sessionId.length < 10) {
        return null
    }

    const sessionVerification = await Sessions.verify(sessionId)
    if (!sessionVerification.status) {
        return null
    }
    const {user} = sessionVerification.data
    const returnInfo = {
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        sessionId: sessionId
    } as CurrentUser
    return returnInfo
}

async function getCurrentUser(): Promise<TypedOperationResult<CurrentUser>> {
    const opGetUser = {
        id: 'getCurrentUser',
        status: false,
        message: ''
    } as TypedOperationResult<CurrentUser>
    const cookieStore = await cookies()
    // const userCookie = cookieStore.get('username') ?? false
    const sessionIdCookie = cookieStore.get('sessionId')
    if (!sessionIdCookie) return opGetUser.message = 'Unauthorized: No session cookie', opGetUser
    
    const sessionId = sessionIdCookie.value
    if (typeof sessionId != 'string' || sessionId == '' || sessionId.length < 10) {
        return opGetUser.message = 'Unauthorized: Invalid session ID', opGetUser
    }

    const sessionVerification = await Sessions.verify(sessionId)
    if (!sessionVerification.status) {
        return opGetUser.message = 'Unauthorized: Session verification failed', opGetUser
    }
    const {user} = sessionVerification.data

    const returnInfo = {
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        sessionId: sessionId
    } as CurrentUser
    opGetUser.status = true
    opGetUser.message = 'User verified'
    opGetUser.data = returnInfo
    return opGetUser
}

export {
    currentUser,
    getCurrentUser
}