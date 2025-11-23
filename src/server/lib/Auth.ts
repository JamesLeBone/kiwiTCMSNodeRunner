'use server'
import { cookies } from 'next/headers.js'
import * as Sessions from '@server/lib/Sessions'
import { Operation } from './Operation'

export declare type CurrentUser = {
    userId: number,
    username: string,
    firstName: string,
    lastName: string,
    email?: string,
    sessionId: string
}

async function getCurrentUser(): Promise<Operation> {
    const opGetUser = new Operation('getCurrentUser')
    const cookieStore = await cookies()
    // const userCookie = cookieStore.get('username') ?? false
    const sessionIdCookie = cookieStore.get('sessionId')
    if (!sessionIdCookie) return opGetUser.setError('Unauthorized: No session')
    
    const sessionId = sessionIdCookie.value
    if (typeof sessionId != 'string' || sessionId == '' || sessionId.length < 10) {
        return opGetUser.setError('Unauthorized: Invalid session ID')
    }

    const sessionVerification = await Sessions.verify(sessionId)
    if (!sessionVerification.status) {
        return opGetUser.setError('Unauthorized: Session verification failed')
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
    
    opGetUser.setSuccess('User verified', returnInfo)
    return opGetUser
}

export {
    getCurrentUser
}