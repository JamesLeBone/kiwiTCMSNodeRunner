import { config } from 'dotenv'
import * as Users from '@server/lib/Users'
import { db } from '@server/db/Database'

config()

const verifyAuth = request => {
    const key = process.env.ADMIN_KEY
    const authKey = request.headers.get('authkey')
    if (key != authKey) {
        return new Response('Unauthorised', {status: 401})
    }
    return true
}

const verifyJson = async request => {
    const authCheck = verifyAuth(request)
    if (authCheck instanceof Response) {
        return authCheck
    }
    
    const headers = request.headers
    if (!headers.has('Content-Type') || headers.get('Content-Type') != 'application/json') {
        console.debug('Invalid content type', headers.get('Content-Type'))
        return new Response('Invalid content type', {status: 415})
    }

    try {
        let {action, params} = await request.json()
        if (action == null) return new Response('Invalid JSON', {status: 400})

        if (typeof action != 'string') {
            console.debug('Invalid action')
            return new Response('Invalid action', {status: 400})
        }
        if (params == null || typeof params != 'object') {
            params = {}
        }
        return {action,params}
    } catch (e) {
        return new Response('Invalid JSON', {status: 400})
    }
}


export async function GET(request) {
    const authCheck = verifyAuth(request)
    if (authCheck instanceof Response) {
        return authCheck
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    // const userId = url.searchParams.getAll('userId')

    try {
        if (action == 'users') {
            const list = await Users.list()
            if (list.length == 0) {
                return new Response('No users found', {status: 404})
            }
            return new Response(JSON.stringify(list), {status: 200})
        }
        if (action == 'logins') {
            const list = await db.fetch('SELECT * FROM logins')
            if (list.length == 0) {
                return new Response('No logins found', {status: 404})
            }
            return new Response(JSON.stringify(list), {status: 200})
        }
    } catch (e) {
        return new Response(e.message, {status: 500})
    }

    return new Response('Unknown action', {status: 200})
}

export async function PUT(request) {
    const parseResult = await verifyJson(request)
    if (parseResult instanceof Response) {
        // If the result is a Response, it means there was an error in parsing
        return parseResult
    }

    const {action, params} = parseResult
    console.debug('Admin action', action, params)

    try {
        if (action == 'addUser') {
            const {username, password, firstName, lastName, email} = params
            if (!username || !password || !firstName || !lastName || !email) {
                return new Response('Missing parameters', {status: 400})
            }
            const userCreated = await Users.create(username, firstName, lastName, email)
            if (userCreated.isError) {
                return new Response(userCreated.message, {status: 500})
            }
            const user = userCreated.data
            console.debug('User created', user)
            await Users.setPassword(username, password, false)
            return new Response('User added successfully', {status: 200})
        }
    } catch (e) {
        console.error('Error processing admin action', e)
        return new Response('Internal server error', {status: 500})
    }

    return new Response('Unknown action', {status: 200})
}

export async function POST(request) {
    const parseResult = await verifyJson(request)
    if (parseResult instanceof Response) {
        // If the result is a Response, it means there was an error in parsing
        return parseResult
    }

    const {action, params} = parseResult
    console.debug('Admin action', action, params)

    try {
        if (action == 'login') {
            const {username, password} = params
            if (!username || !password) {
                return new Response('Missing parameters', {status: 400})
            }
            const user = await Users.login(username, password)
            console.debug('User login result', user)
            return new Response('OK', {status: 200})
        }
    } catch (e) {
        console.error('Error processing admin action', e)
        return new Response('Internal server error', {status: 500})
    }

    return new Response('Unknown action', {status: 200})
}

export async function DELETE(request) {
    const parseResult = await verifyJson(request)
    if (parseResult instanceof Response) {
        // If the result is a Response, it means there was an error in parsing
        return parseResult
    }

    const {action, params} = parseResult
    console.debug('Admin action', action, params)

    const del = (table,id) => db.run(`DELETE FROM ${table} WHERE user_id = ?`, [id])

    try {
        if (action == 'users') {
            const {userId} = params
            if (!userId) {
                return new Response('Missing parameters', {status: 400})
            }
            const tally = {users: 0, logins: 0, sessions: 0}

            await db.run('BEGIN')
            for (let id of userId) {
                console.debug('Deleting user with ID:', id)
                tally.sessions += await del('sessions', id)
                tally.logins += await del('logins',id)
                tally.users += await del('users', id)
            }
            if (tally.users + tally.logins + tally.sessions == 0) {
                await db.run('ROLLBACK')
                return new Response('Nothing deleted', {status: 404})
            }
            await db.run('COMMIT')

            return new Response(JSON.stringify(tally,null,4), {status: 200, 
                headers: {'Content-Type': 'application/json'}}
            )
        }
    } catch (e) {
        console.error('Error processing admin action', e)
        return new Response('Internal server error', {status: 500})
    }

    return new Response('Unknown action', {status: 200})
}


