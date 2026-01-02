import { sha256 } from 'js-sha256' //= require('js-sha256')
import { db } from '../db/Database'

import * as email from './Email'
// import * as sessions from './Sessions.js'
import { v4 as genuuid } from 'uuid' //= require('uuid')
import { Operation, TypedOperationResult, StatusOperation } from '@lib/Operation'

export declare interface dbUserRecord {
    userId: number
    username: string
    firstName?: string
    lastName?: string
    email: string
    secret: string
}
/**
 * The current logged in user details
 * Includes sessionId from cookie
 */
export declare interface CurrentUser extends dbUserRecord {
    sessionId: number
}
/**
 * A verified user record
 * Does not contain session information
 * and can refer to another user.
 * Does not contain sensitive information.
 */
export declare interface verifiedUser {
    userId: number
    username: string
    firstName?: string
    lastName?: string
    email: string
}

function rawDbRow2User(row:any) : dbUserRecord {
    return {
        userId: row.userId,
        username: row.username,
        firstName: row.firstName == null ? undefined : row.firstName,
        lastName: row.lastName == null ? undefined : row.lastName,
        email: row.email,
        secret: row.secret
    } as dbUserRecord
}

export async function getUserByUsername(username:string) : Promise<dbUserRecord | null> {
    const sql = `SELECT * FROM users WHERE username = ?`;
    const userReply = await db.fetchOne(sql,[username])
    if (!userReply) return null
    return rawDbRow2User(userReply)
}
export async function getUser(userId:number) : Promise<dbUserRecord | null> {
    const sql = `SELECT * FROM users WHERE user_id = ?`;
    const userReply = await db.fetchOne(sql,[userId])
    if (!userReply) return null
    return rawDbRow2User(userReply)
}

// export async function getNumUsers() : Promise<number> {

// }

class ResetToken {
    value:string
    expiry:number
    constructor(value:string) {
        this.value = value
        this.expiry = Date.now() + 1000*60*60
    }
    setExpiry(expiry:number) {
        this.expiry = expiry
    }
}

const validEmail = (email:string) => {
    if (email == null) return false
    if (email.length == 0) return false
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) != null
}

const encrypt = (text:string) => sha256(text)

/**
 * Server-to-Sever function, login
 * @returns ServerMessages.Operation
 */
export async function login(username:string,password:string) : Promise<TypedOperationResult<verifiedUser>> {
    const op = {
        id: 'login',
        status: false,
        message: 'Invalid login credentials'
    } as TypedOperationResult<verifiedUser>
    const user = await getUserByUsername(username)
    if (!user) {
        console.log('No user found with username', username)
        return op
    }

    const encPassword = encrypt(password)
    const verifyPassword = await db.get('logins', user.userId, 'user_id')
    if (!verifyPassword) {
        return op
    }

    if (verifyPassword.password == null || encPassword != verifyPassword.password) {
        console.log('Password does not match for user', username)
        return op
    }
    op.status = true
    op.message = 'User logged in successfully'
    const { secret, ...vfUser } = user
    op.data = vfUser as verifiedUser
    return op
}

export async function hasLogin(userId:number) {
    const login = await db.get('logins', userId, 'user_id')
    if (!login) return false
    return true
}

export async function create(username:string,firstName:string,lastName:string,email:string) : Promise<TypedOperationResult<verifiedUser>> {
    const op = {
        id: 'createUser',
        status: false,
        message: 'User creation failed'
    } as TypedOperationResult<verifiedUser>

    const existingUser = await getUserByUsername(username)
    if (existingUser) return op.message ='Username already exists',op
    if (!validEmail(email)) return op.message = 'Invalid email address', op
    if (username.length < 4) return op.message = 'Username must be at least 4 characters', op
    const insert = await db.insert('users', {
        username,
        firstName,
        lastName,
        email,
        secret: genuuid()
    })
    if (!insert || insert.length === 0) return op.message = 'Database interface failed', op
    const newUser = rawDbRow2User(insert[0])
    await db.insert('logins', {userId:newUser.userId, username})

    op.status = true
    op.message = 'User created successfully'
    const { secret , ...vfUser } = newUser
    op.data = vfUser as verifiedUser
    return op
}

export async function update(userId:number,lastName:string,firstName:string,email:string,username:string|null) : Promise<TypedOperationResult<verifiedUser>> {
    const op = {
        id: 'updateUser',
        status: false,
        message: 'User update failed'
    } as TypedOperationResult<verifiedUser>

    const existingUser = getUser(userId)
    if (!existingUser) return op.message = 'User not found', op
    if (!validEmail(email)) return op.message = 'Invalid email address', op

    if (username != null) {
        if (username.length < 4) return op.message = 'Username must be at least 4 characters', op
        const setusername = await db.update('users', userId, {username}, 'user_id')
        if (!setusername) return op.message = 'Database interface failed', op
    }

    const updatedUser = await db.update('users', userId, {firstName,lastName,email}, 'user_id')
    if (!updatedUser) return op.message = 'Database interface failed', op
    op.status = true
    const { secret, ...vfUser } = updatedUser
    op.data = vfUser as verifiedUser
    op.message = 'User updated successfully'
    return op
}

export async function setPassword(username:string,password:string) : Promise<TypedOperationResult<verifiedUser>> {
    const op = {
        id: 'setPassword',
        status: false,
        message: 'Set password failed'
    } as TypedOperationResult<verifiedUser>
    if (password.length < 8) {
        return op.message = 'Password must be at least 8 characters', op
    }
    console.log('Setting new password for', username)
    const user = await getUserByUsername(username)
    if (!user) return op.message = 'User not found', op
    password = encrypt(password)

    const login = await db.update('logins', user.userId,
        {password,promptPasswordReset:0,passwordResetToken:null},
        'user_id'
    )
    if (!login) return op.message = 'Database interface failed', op
    op.status = true
    op.message = `Password set for ${user.firstName} ${user.lastName}`
    const { secret, ...vfUser } = user
    op.data = vfUser as verifiedUser
    return op
}
export async function resetPassword(email:string) : Promise<StatusOperation> {
    const op = {
        id: 'resetPassword',
        status: false,
        message: 'Password reset failed',
        statusType: 'error'
    } as StatusOperation

    const sql = `SELECT * FROM users WHERE email = ?`;
    const userReply = await db.fetchOne(sql,[email])
    if (!userReply) return op
    const user = rawDbRow2User(userReply)

    return sendPasswordResetEmail(user)
}

export async function list() : Promise<TypedOperationResult<verifiedUser[]>> {
    const users = await db.fetchProps('users', ['userId','firstName','lastName','email','username'])
    return {
        id: 'listUsers',
        status: true,
        message: 'User list retrieved',
        data: users
    } as TypedOperationResult<dbUserRecord[]>
}

const setPasswordResetToken = async (userId:number, token:Object) : Promise<boolean> => {
    const props = {
        password: null,
        passwordResetToken: JSON.stringify(token),
        promptPasswordReset: 1
    }
    const res = await db.update('logins', userId, props, 'user_id')
    return res ? true : false
}

export async function sendPasswordResetEmail(user: dbUserRecord) : Promise<StatusOperation> {
    const op = {
        id: 'sendPasswordResetEmail',
        status: false,
        message: 'Send password reset email failed',
        statusType: 'error'
    } as StatusOperation
    if (!user.email) return op.message = 'User has no email address', op
    const hasValidEmail = validEmail(user.email)
    if (!hasValidEmail) return op.message = 'Invalid email address', op

    const token = new ResetToken(genuuid())
    const reset = await setPasswordResetToken(user.userId, token)
    if (!reset) {
        return op.message = 'Unable to generate reset token', op
    }
    console.debug('Password reset token set for user', reset)

    const params = new URLSearchParams()
    params.set('accessToken',token.value)
    params.set('userId', user.userId+'')
    const host = process.env.TOOLBOX_HOST
    const url = host+`/passwordReset?`+params.toString()

    const body = `To ${user.firstName} ${user.lastName},

    A password reset has been triggered for your login on Dragon Toolbox.
    
    To reset your password, click the following link:
    <a href="${url}">${url}</a>

    If this link does not work, copy and paste the following URL into your browser:
    ${url}
    `
    const html = `<html><body>
    <p>To ${user.firstName} ${user.lastName},</p>
    <p>A password reset has been triggered for your login on Dragon Toolbox.</p>
    <p>To reset your password, click the following link:</p>
    <p><a href="${url}">here</a></p>
    <p>If this link does not work, copy and paste the following URL into your browser:</p>
    <pre>${url}</pre>
    <p>If you did not request this, please ignore this email.</p>
    <p>Regards,<br>Dragon Toolbox Team</p>
    </body></html>
    `

    const sendTo = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email
    }

    const sendResult = await email.send(
        sendTo,
        process.env.APP_TITLE + ' - Password reset',
        body,
        html,
        sendTo
    )
    if (!sendResult.success) {
        console.info(sendResult)
        return op.message = sendResult.message, op
    }
    op.status = true
    op.message = 'Password reset email sent'
    op.statusType = 'success'

    // console.info(op)
    return op
}

const getToken = async (userId:number) : Promise<string | false> => {
    const login = await db.get('logins', userId, 'user_id')
    if (!login) return false
    return login.passwordResetToken
}
/**
 * Verify a password reset token for a user.
 */
export async function verifyToken(userId:number,accessToken:string): Promise<TypedOperationResult<verifiedUser>> {
    const operation = {
        id: 'verifyToken',
        status: false,
        message: 'Token not verified'
    } as TypedOperationResult<verifiedUser>

    const token = await getToken(userId)
    if (!token) {
        operation.message = 'No token found for user'
        return operation 
    }

    let rt:ResetToken;
    try {
        const {value,expiry} = JSON.parse(token)
        rt = new ResetToken(value)
        rt.setExpiry(expiry)
        // console.debug('verifyToken: reconstructed token', rt)
    } catch (e) {
        console.error('Error parsing token',token,e)
        return operation.message = 'Invalid token format', operation
    }

    if (rt.value != accessToken) {
        console.debug('setPassword: failed to verify token', rt.value, accessToken)
        return operation.message = 'Invalid token', operation   
    }
    if (rt.expiry < Date.now()) {
        return operation.message = 'Token expired', operation
    }
    const user = await getUser(userId)
    if (!user) return operation.message = 'User not found for token', operation
    const { secret, ...vfUser } = user
    operation.status = true
    operation.data = vfUser as verifiedUser
    operation.message = 'Token verified'
    return operation
}

export async function promptPasswordReset(userId:number) {
    const op = {
        id: 'promptPasswordReset',
        status: false,
        message: 'Prompt password reset check failed'
    } as Operation
    if (!userId) return op.message = 'User ID is required', op
    const login = await db.get('logins', userId, 'user_id')
    if (!login) return op.message = 'User not found', op

    if (login.promptPasswordReset) {
        return op.message = 'Prompt password reset is enabled', op
    }
    return op.message = 'Prompt password reset is disabled', op
}

