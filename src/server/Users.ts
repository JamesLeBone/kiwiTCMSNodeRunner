'use server'
import * as lib from './lib/Users'
import * as Auth from './Auth'
import { TypedOperationResult } from '@lib/Operation'

const verifyToken = async (userId:number, accessToken:string) => lib.verifyToken(userId, accessToken)

const resetPassword = (email:string) => lib.resetPassword(email)

const setPassword = async (userId:number, password:string, verifyPassword:string, accessToken:string) : Promise<TypedOperationResult<lib.verifiedUser>> => {
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

const create = (user: CreateUserParams) => lib.create(user.username,user.firstName, user.lastName, user.email)

const update = (userId:number, lastName:string, firstName:string, email:string, username:string|null) => lib.update(userId, lastName, firstName, email, username)

const promptPasswordReset = (userId:number) => lib.promptPasswordReset(userId)
export {
    verifyToken,
    setPassword,
    resetPassword,
    promptPasswordReset,
    create,
    update
}

