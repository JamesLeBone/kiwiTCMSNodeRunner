'use server'
import * as lib from './lib/Users'
import { serverMessagePromise, ServerReply } from '@lib/ServerMessages'
import * as Auth from './Auth'

const list = async () : serverMessagePromise => lib.list()
    .then(operation => ServerReply.fromOperation(operation))
const verifyToken = async (userId:number, accessToken:string): serverMessagePromise => {
    const res = await lib.verifyToken(userId, accessToken)
    return ServerReply.fromOperation(res)
}

const resetPassword = async (username:string) : serverMessagePromise => {
    const result = await lib.resetPassword(username)
    .then(operation => ServerReply.fromOperation(operation))
    
    if (result.status) {
        // No need to return eveything, just the messageId
        result.data = result.data.messageId
    }
    console.debug('resetPassword result', result)
    return result
}

const setPassword = async (userId:number, password:string, accessToken:string) : serverMessagePromise => {
    const vfUser = await lib.verifyToken(userId, accessToken)
    if (!vfUser.status) {
        console.debug('setPassword: failed to verify user', vfUser)
        return ServerReply.fromOperation(vfUser)
    }
    const username = vfUser.data.username

    const resultOp = await lib.setPassword(username, password)
    .then(operation => ServerReply.fromOperation(operation))
    
    const credential = {username, password}
    await Auth.login(credential)

    return resultOp
}

declare type CreateUserParams = {
    lastName: string,
    firstName: string,
    email: string,
    username: string
}

const create = (user: CreateUserParams) : serverMessagePromise => {
    return lib.create(user.username,user.firstName, user.lastName, user.email)
    .then(operation => ServerReply.fromOperation(operation))
}
const update = (userId:number, lastName:string, firstName:string, email:string, username:string|null) : serverMessagePromise => lib.update(userId, lastName, firstName, email, username)
    .then(operation => ServerReply.fromOperation(operation))

const promptPasswordReset = (userId:number) : serverMessagePromise => lib.promptPasswordReset(userId)
    .then(operation => ServerReply.fromOperation(operation))
export {
    list,
    verifyToken,
    setPassword,
    resetPassword,
    promptPasswordReset,
    create,
    update
}

