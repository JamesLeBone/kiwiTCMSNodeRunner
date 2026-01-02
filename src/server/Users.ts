'use server'
import * as lib from './lib/Users'
import * as Auth from './Auth'
import { TypedOperationResult } from '@lib/Operation'

export async function verifyToken(userId:number, accessToken:string) {
    return lib.verifyToken(userId, accessToken)
}

export async function resetPassword(email:string) {
    return lib.resetPassword(email)
}

export async function setPassword(userId:number, password:string, verifyPassword:string, accessToken:string) : Promise<TypedOperationResult<lib.verifiedUser>> {
    const vfUser = await lib.verifyToken(userId, accessToken)
    if (!vfUser.status || vfUser.data == null) {
        return {
            id: 'setPassword',
            status: false,
            message: 'Invalid access token'
        }
    }
    if (password !== verifyPassword) {
        return {
            id: 'setPassword',status: false,message: 'Passwords do not match'
        }
    }

    const username = vfUser.data.username

    const op = await lib.setPassword(username, password)
    
    const credential = {username, password}
    await Auth.login(credential)
    return op
}

type CreateUserParams = {
    lastName: string,
    firstName: string,
    email: string,
    username: string
}

export async function create(user: CreateUserParams) {
    return lib.create(user.username,user.firstName, user.lastName, user.email)
}

export async function update(userId:number, lastName:string, firstName:string, email:string, username:string|null) {
    return lib.update(userId, lastName, firstName, email, username)
}

export async function promptPasswordReset(userId:number) {
    return lib.promptPasswordReset(userId)
}

