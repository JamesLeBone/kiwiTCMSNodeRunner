'use server'
import * as lib from './lib/Users'
import { operation2Message } from './lib/ServerMessages'
import * as Auth from './Auth'

const list = async () => lib.list()
    .then(operation => operation2Message(operation, 'User list retrieved'))
const verifyToken = async (userId:number, accessToken:string) => lib.verifyToken(userId, accessToken)
    .then(operation => operation2Message(operation, 'User verified'))

const resetPassword = async (username:string) => {
    const result = await lib.resetPassword(username)
    .then(operation => operation2Message(operation))
    
    if (result.status) {
        // No need to return eveything, just the messageId
        result.data = result.data.messageId
    }
    console.debug('resetPassword result', result)
    return result
}

const setPassword = async (userId:number, password:string, accessToken:string) => {
    const vfUser = await lib.verifyToken(userId, accessToken)
    if (!vfUser.status) {
        console.debug('setPassword: failed to verify user', vfUser)
        return false
    }
    const username = vfUser.data.username

    const resultOp = lib.setPassword(username, password)
    const result = operation2Message(resultOp, 'Password set')
    
    const credential = {username, password}
    await Auth.login(credential)
    console.debug('setPassword result', result)

    return result
}

declare type CreateUserParams = {
    lastName: string,
    firstName: string,
    email: string,
    username: string
}

const create = (user: CreateUserParams) => {
    lib.create(user.username,user.firstName, user.lastName, user.email)
    .then(operation => operation2Message(operation))
}
const update = (userId:number, lastName:string, firstName:string, email:string, username:string|null) => lib.update(userId, lastName, firstName, email, username)
    .then(operation => operation2Message(operation))

const promptPasswordReset = (userId:number) => lib.promptPasswordReset(userId)
    .then(operation => operation2Message(operation, 'Password reset prompt sent'))

export {
    list,
    verifyToken,
    setPassword,
    resetPassword,
    promptPasswordReset,
    create,
    update
}

