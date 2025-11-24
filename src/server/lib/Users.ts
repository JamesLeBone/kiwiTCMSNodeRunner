import { sha256 } from 'js-sha256' //= require('js-sha256')
import { db } from '../db/Database'

import * as email from './Email'
// import * as sessions from './Sessions.js'
import { v4 as genuuid } from 'uuid' //= require('uuid')
import { Operation } from '@lib/Operation'

const ops = {
    notFound: Operation.error('userNotFound', 'User not found'),
    dbFailure: Operation.error('userDbError', 'Database interface failed'),
    inputValdiationError: {
        username: Operation.error('userInputError', 'Username must be at least 4 characters'),
        email: Operation.error('userInputError', 'Invalid email address'),
        password: Operation.error('userInputError', 'Password must be at least 8 characters'),
    },
}

declare interface dbUserRecord {
    userId: number,
    username: string | null,
    firstName: string | null,
    lastName: string | null,
    email: string | null,
    secret: string | null
}

const getUserByUsername = async (username:string) => {
    const sql = `SELECT * FROM users WHERE username = ?`;
    const userReply = await db.fetchOne(sql,[username])
    if (!userReply) return null
    return userReply as any as dbUserRecord
}
const getUser = async (userId:number) : Promise<dbUserRecord | null> => {
    const sql = `SELECT * FROM users WHERE user_id = ?`;
    const reply = await db.fetchOne(sql,[userId])
    if (!reply) return null
    return reply as any as dbUserRecord
}

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
async function login(username:string,password:string) {
    const op = new Operation('login')
    const user = await getUserByUsername(username)
    if (!user) {
        console.log('No user found with username', username)
        return op.setError('Invalid login credentials')
    }

    const encPassword = encrypt(password)
    const verifyPassword = await db.get('logins', user.userId, 'user_id')
    if (!verifyPassword) {
        await db.insert('logins', {userId:user.userId, username})
        console.log('No login record found for user, created', user.userId)
        return op.setError('Invalid login credentials')
    }

    if (verifyPassword.password == null || encPassword != verifyPassword.password) {
        console.log('Password does not match for user', username)
        return op.setError('Invalid login credentials')
    }
    
    return op.setSuccess('User logged in', user)
}

async function get(username:string) {
    return getUserByUsername(username)
}

async function create(username:string,firstName:string,lastName:string,email:string) {
    const op = new Operation('createUser')

    const existingUser = await getUserByUsername(username)
    if (existingUser) return op.setError('Username already exists')
    if (!validEmail(email)) return ops.inputValdiationError.email
    if (username.length < 4) return ops.inputValdiationError.username
    const secret  = genuuid()
    const insert = await db.insert('users', {
        username,
        firstName,
        lastName,
        email,
        secret
    })
    if (!insert || insert.length === 0) return ops.dbFailure
    const newUser = insert[0]
    await db.insert('logins', {userId:newUser.userId, username})
    op.setSuccess('User created', newUser)
    return op
}

async function update(userId:number,lastName:string,firstName:string,email:string,username:string|null) {
    const op = new Operation('updateUser')

    const existingUser = getUser(userId)
    if (!existingUser) return ops.notFound

    if (username != null) {
        if (username.length < 4) return ops.inputValdiationError.username
        const setusername = await db.update('users', userId, {username}, 'user_id')
        if (!setusername) return ops.dbFailure
    }

    const updatedUser = await db.update('users', userId, {firstName,lastName,email}, 'user_id')
    if (!updatedUser) return ops.dbFailure
    return op.setSuccess('User updated')
}

async function setPassword(username:string,password:string) {
    if (password.length < 8) {
        return ops.inputValdiationError.password
    }
    console.debug('Setting password for', username)
    const user = await getUserByUsername(username)
    if (!user) return ops.notFound
    password = encrypt(password)

    const login = await db.update('logins', user.userId,
        {password,promptPasswordReset:0,passwordResetToken:null},
        'user_id'
    )
    if (!login) return ops.dbFailure
    const op = new Operation('setPassword')
    const successMessage = `Password set for ${user.firstName} ${user.lastName}`
    op.setSuccess(successMessage)
    return op
}
async function resetPassword(username:string) {
    const user = await getUserByUsername(username)
    if (!user) return ops.notFound
    return sendPasswordResetEmail(user)
}

async function list() {
    const users = await db.fetchProps('users', ['userId','firstName','lastName','email','username'])
    return Operation.success('listUsers', 'List obtained', users)
}

const setPasswordResetToken = async (userId:number, token:Object) => {
    const props = {
        password: null,
        passwordResetToken: JSON.stringify(token),
        promptPasswordReset: 1
    }
    const res = await db.update('logins', userId, props, 'user_id')
    return res ? true : false
}

async function sendPasswordResetEmail(user: dbUserRecord) : Promise<Operation> {
    if (!user.email) return ops.inputValdiationError.email
    const hasValidEmail = validEmail(user.email)
    if (!hasValidEmail) return ops.inputValdiationError.email

    const operation = new Operation('sendPasswordResetEmail')

    const token = new ResetToken(genuuid())
    const reset = await setPasswordResetToken(user.userId, token)
    if (!reset) {
        operation.setError('Unable to generate reset token')
        return operation
    }
    console.debug('Password reset token set for user', reset)

    const params = new URLSearchParams()
    params.set('accessToken',token.value)
    params.set('userId', user.userId+'')
    const host = process.env.TOOLBOX_HOST || 'http://dragon.ftg.sil0.net:8084'
    const url = host+`/uac?`+params.toString()

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

    const sendResult = await email.send(sendTo, 'Dragon Toolbox - Password reset', body, html)
    if (!sendResult.success) {
        operation.setError(sendResult.message)
        return operation
    }
    const transporterId = await email.getTransporterId()
    if (transporterId === 'ethereal') {
        console.debug('Email sent via ethereal.  Here is the url:', url)
    }
    operation.setSuccess('Password reset email sent')
    return operation
}

const getToken = async (userId:number) => {
    const login = await db.get('logins', userId, 'user_id')
    if (!login) return false
    return login.passwordResetToken
}

async function verifyToken(userId:number,accessToken:string): Promise<Operation> {
    const operation = new Operation('verifyToken')
    operation.setError('Token not valid')

    const token = await getToken(userId)
    if (!token) return operation.setError('No token found for user')

    let rt:ResetToken;
    try {
        const {value,expiry} = JSON.parse(token)
        rt = new ResetToken(value)
        rt.setExpiry(expiry)
        console.debug('verifyToken: reconstructed token', rt)
    } catch (e) {
        console.error('Error parsing token',token,e)
        return operation.setError('Invalid Token stored')
    }

    if (rt.value != accessToken) {
        console.debug('setPassword: failed to verify token', rt.value, accessToken)
        return operation.setError('Token mismatch')
    }
    if (rt.expiry < Date.now()) {
        return operation.setError('Token expired')
    }
    const user = await getUser(userId)
    if (!user) return operation.setError('User not found for token')
    return operation.setSuccess('Token verified', user)
}

const promptPasswordReset = async (userId:number) => {
    const op = new Operation('getPromptPasswordReset')
    if (!userId) return op.setError('User ID is required')
    const login = await db.get('logins', userId, 'user_id')
    if (!login) return op.setError('User not found')

    if (login.promptPasswordReset) {
        return op.setSuccess('Prompt password reset is enabled', true)
    }
    return op.setSuccess('Prompt password reset is disabled', false)
}

export {
    verifyToken,
    sendPasswordResetEmail,
    list,
    setPassword,
    resetPassword,
    update,
    create,
    get,
    login,
    getUser,
    promptPasswordReset
}

