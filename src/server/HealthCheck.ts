'use server'

import { readFileSync } from 'fs'
import { db, check } from '@server/db/Database'
import * as Users from '@server/lib/Users'
import { emailRecipient, send } from '@server/lib/Email'

import { Operation, StatusOperation, TypedOperationResult } from '@lib/Operation'

export async function dbReady() : Promise<Operation> {
    const r = await check()
    if (r) {
        return {
            id: 'dbReady',
            status: true,
            message: 'Database is ready.'
        }
    }
    return {
        id: 'dbReady',
        status: false,
        message: 'Database is not initialized.'
    }
}
export async function initializeDatabase() : Promise<Operation> {
    const op = {
        id: 'initializeDatabase',
        status: false,
        message: 'Unknown error',
        statusType:'error'
    } as Operation

    try {
        const r = await check()
        if (r) {
            op.statusType = 'success'
            return op.status=true,op.message='Database is already initialized', op
        }
        const sqlInstall = readFileSync('./sql/core.sql', 'utf-8')
        const commands = sqlInstall.split(/;\s*$/m).map(cmd => cmd.trim()).filter(cmd => cmd.length > 0)

        for (const sql of commands) {
            const r = await db.run(sql)
            if (!r) {
                op.message = 'Database initialization failed while executing SQL command\n' + sql
                return op
            }
            console.log(sql, 'OK')
        }
        return dbReady()
    } catch (err) {
        console.error('Error initializing database:', err)
        if (typeof err != 'object' || (!(err instanceof Error)) || !err.message) {
            op.message = 'Unknown error during database initialization.'
            return op
        }
        op.message = err.message
        return op
    }
}

export async function verifyUsers() : Promise<TypedOperationResult<number>> {
    const op = {
        id: 'verifyUsers',
        status: false,
        message: 'Unknown error',
        data: 0
    }
    const userList = await Users.list()
    if (!userList.data) return {
        ...op,
        message: userList.message
    }
    return {
        ...op,
        status: true,
        data: userList.data.length,
        message: 'Users found'
    }
}

// Server actions
export async function createFirstUser(formData: FormData) : Promise<StatusOperation> {
    const op = { 
        id: 'createFirstUser',
        status: false,
        message: 'Unknown error',
        statusType: 'error'
    } as StatusOperation

    // First, check if a user already exists
    const verify = await verifyUsers()
    if (verify.data && verify.data > 0) {
        op.message = 'At least 1 user already exists in the system'
        op.statusType = 'success'
        return op
    }

    // Validation
    if (!formData) {
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
    // Passed, create the user

    const res = await Users.create(
        username,
        firstName,
        lastName,
        email
    )
    if (!res.status) {
        return op.message = res.message, op
    }
    op.statusType = 'success'
    op.message = 'User created successfully'
    op.status = true
    return op
}

export async function sendEmail(recipient: emailRecipient) : Promise<StatusOperation> {
    const op = { id: 'sendEmail', status: false, message: 'Unknown error', statusType: 'error' } as StatusOperation

    const res = await send(
        recipient,
        'Test Email from '+process.env.APP_TITLE,
        `This is a test email sent from ${process.env.APP_TITLE} to verify SMTP configuration.`
    )
    op.status = res.success
    op.message = res.message
    op.statusType = res.success ? 'success' : 'error'

    return op
}
