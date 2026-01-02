import { cookies } from 'next/headers.js'
import { cache } from 'react'
import * as Sessions from '@server/lib/Sessions'
import { TypedOperationResult } from '@lib/Operation'
import type { CurrentUser } from '@server/lib/Users'

/**
 * Get the current user (cached for request duration)
 * for when you want the user but should have been warned if not logged in
 * elsewhere.
 */
export const currentUser = cache(async () : Promise<CurrentUser | null> => {
    const cookieStore = await cookies()
    // const userCookie = cookieStore.get('username') ?? false
    const sessionIdCookie = cookieStore.get('sessionId')
    if (!sessionIdCookie) return null
    
    const sessionCookieId = sessionIdCookie.value
    if (typeof sessionCookieId != 'string' || sessionCookieId == '' || sessionCookieId.length < 10) {
        return null
    }

    const sessionVerification = await Sessions.verify(sessionCookieId)
    if (!sessionVerification.data) {
        return null
    }
    const {user,  sessionId} = sessionVerification.data
    const returnInfo = {
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        sessionId: sessionId
    } as CurrentUser
    return returnInfo
})

export const getCurrentUser = cache(async (): Promise<TypedOperationResult<CurrentUser>> => {
    const opGetUser = {
        id: 'getCurrentUser',
        status: false,
        message: ''
    } as TypedOperationResult<CurrentUser>
    const cookieStore = await cookies()
    // const userCookie = cookieStore.get('username') ?? false
    const sessionIdCookie = cookieStore.get('sessionId')
    if (!sessionIdCookie) return opGetUser.message = 'Unauthorized: No session cookie', opGetUser
    
    const sessionCookieId = sessionIdCookie.value
    if (typeof sessionCookieId != 'string' || sessionCookieId == '' || sessionCookieId.length < 10) {
        return opGetUser.message = 'Unauthorized: Invalid session ID', opGetUser
    }

    const sessionVerification = await Sessions.verify(sessionCookieId)
    if (!sessionVerification.data) {
        return opGetUser.message = 'Unauthorized: Session verification failed', opGetUser
    }
    const {user,sessionId} = sessionVerification.data

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
})