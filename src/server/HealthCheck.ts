'use server'

import { readFileSync } from 'fs'
import { db, check } from '@server/db/Database'
import * as Users from '@server/lib/Users'

import { redirect } from 'next/navigation'
import { OperationResult } from '@lib/Operation'

declare interface Result {
    status: boolean
    message: string
}

export async function dbReady() : Promise<Result> {
    const r = await check()
    if (r) {
        return {
            status: true,
            message: 'Database is ready.'
        }
    }
    return {
        status: false,
        message: 'Database is not initialized.'
    }
}
export async function initializeDatabase() : Promise<Result> {
    try {
        const r = await check()
        if (r) {
            return {
                status: true,
                message: 'Database is ready.'
            }
        }
        const sqlInstall = readFileSync('./sql/core.sql', 'utf-8')
        const commands = sqlInstall.split(/;\s*$/m).map(cmd => cmd.trim()).filter(cmd => cmd.length > 0)

        for (const sql of commands) {
            const r = await db.run(sql)
            if (!r) {
                return {
                    status: false,
                    message: 'Database initialization failed while executing SQL command\n' + sql
                }
            }
            console.log(sql, 'OK')
        }
        return dbReady()
    } catch (err) {
        console.error('Error initializing database:', err)
        if (typeof err != 'object' || (!(err instanceof Error)) || !err.message) {
            return {
                status: false,
                message: 'Unknown error during database initialization.'
            }
        }
        return {
            status: false,
            message: err.message
        }
    }
}

interface UserVerification extends Result {
    nUsers: number
}

export async function verifyUsers() : Promise<UserVerification> {
    const userList = await Users.list()
    if (!userList.data) return {
        status: false,
        nUsers: 0,
        message: userList.message
    }
    return {
        status: true,
        nUsers: userList.data.length,
        message: 'Users found'
    }
}

// Server action. must return Result, void or redirect.
export async function createFirstUser(formData: FormData) : Promise<OperationResult> {
    const op = { id: 'createFirstUser', status: false, message: 'Unknown error' }

    if (!formData || !(formData instanceof FormData)) {
        return op.message = 'Invalid form data', op
    }
    if (!formData.has('firstName') || !formData.has('lastName') || !formData.has('email') || !formData.has('username')) {
        return op.message = 'Missing required form fields', op
    }
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const username = formData.get('username') as string

    for (let field of ['firstName','lastName','email','username']) {
        const value = formData.get(field) as string
        if (typeof value != 'string' || value.trim().length == 0) {
            return op.message = `Invalid value for ${field}`, op
        }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return op.message = 'Invalid email address', op
    }

    const res = await Users.create(
        username,
        firstName,
        lastName,
        email
    )
    if (!res.status) {
        return op.message = res.message, op
    }
    return op.message = 'User created successfully', { ...op, status: true }
}
