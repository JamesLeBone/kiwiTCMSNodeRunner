'use server'
import { cookies } from 'next/headers.js'
import * as Users from './lib/Users'
import * as Sessions from './lib/Sessions'
import { getCurrentUser } from '@server/lib/Auth'

// Use this
import * as ServerMessages from './lib/ServerMessages'

async function logout() {
    const cookieStore = await cookies()
    // cookieStore.clear() // Clear all cookies
    cookieStore.delete('sessionId')
    cookieStore.delete('username')

    // Find a way to delete from db
    // if (sessionId && username) {
    //     Sessions.clear(username.value, sessionId.value)
    // }

    return ServerMessages.success('Logged out')
}

export type loginCredentails = {
    username: string,
    password: string
}

async function login({ username, password }: loginCredentails) {
    if (typeof username == 'undefined' || typeof password == 'undefined') {
        console.error('Missing username or password')
        return ServerMessages.error('missing username and password')
    }

    const cookieStore = await cookies()

    const loginEvent = await Users.login(username,password)
    if (loginEvent.isError) {
        return ServerMessages.error(loginEvent.message)
    }
    const user = loginEvent.data

    if (user === false) {
        return ServerMessages.error('Invalid username or password')
    }
    // console.debug(user, 'logged in')
    
    const session = await Sessions.createSession(user.userId)
    if (!session) {
        console.error('Failed to create session')
        return ServerMessages.error('Failed to create session')
    }

    cookieStore.set('sessionId',session.secret, {expires: session.expiresAt})
    cookieStore.set('username',username)

    console.debug('User', username, 'logged in with session', session)

    const returnValue = {
        username,
        firstName: user.firstName,
        lastName: user.lastName,
    }
    const resp = ServerMessages.success('User logged in', returnValue)
    console.info('User logged in', returnValue)
    return resp
}

async function currentUser() {
    return await getCurrentUser()
}
async function getUserId() { 
    const u = await getCurrentUser()
    return u.isSuccess ? u.data.userId : null
}

export {
    login,
    logout,
    currentUser,
    getUserId
}

