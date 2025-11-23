'use server'

import { success , error, ServerReply } from './lib/ServerMessages'

import * as credentials from './lib/Credentials'
import * as credentialTypes from './lib/CredentialTypes'
import type { credentialFieldSet, decryptedCredentialDetails } from './lib/Credentials'
import { getCurrentUser } from '@server/lib/Auth'

// Exported
const addCredential = async (credential:credentialFieldSet, credentialTypeId:number = 1) : Promise<ServerReply> => {
    const login = await getCurrentUser()
    if (!login) return ServerReply.fromOperation(login)
    const userId = login.data.userId

    const addOp = await credentials.addCredential(userId, credential, credentialTypeId)
    return ServerReply.fromOperation(addOp)
}

const updateCredential = async (userCredentialId:number, credential:credentialFieldSet) : Promise<ServerReply> => {
    const login = await getCurrentUser()
    if (!login) return ServerReply.fromOperation(login)
    const userId = login.data.userId

    const owner = await credentials.getOwner(userCredentialId)
    if (owner !== userId) return error('You do not own this credential')
    
    const update = await credentials.update(userCredentialId,credential)
    return ServerReply.fromOperation(update)
}

const deleteCredential = async (userCredentialId:number) : Promise<ServerReply> => {
    const login = await getCurrentUser()
    if (!login) return ServerReply.fromOperation(login)
    const userId = login.data.userId

    const owner = await credentials.getOwner(userCredentialId)
    if (owner !== userId) return error('You do not own this credential')

    await credentials.deleteCredential(userCredentialId)
    return success('Credential deleted')
}

const getCredentials = async (remoteServiceDescription:string) : Promise<ServerReply> => {
    const login = await getCurrentUser()
    if (!login) return ServerReply.fromOperation(login)
    const userId = login.data.userId

    const creds = await credentials.find(userId,remoteServiceDescription)
    // console.debug('getCredentials', remoteService, op)
    if (!creds) return error('No credentials found for user and remote service')
    return success('Credentials found', creds)
}

const listUserCredentials = async () : Promise<ServerReply> => {
    const login = await getCurrentUser()
    if (!login) return ServerReply.fromOperation(login)
    const userId = login.data.userId

    const list = await credentials.list(userId)
    const reply = new ServerReply(true, list)

    if (list.length == 0) {
        reply.message = 'No credentials found'
    } else {
        reply.message = list.length + ' credentials found'
    }
    return reply
}

const getCredentialTypes = async () : Promise<ServerReply> => {
    const list = await credentialTypes.getTypes()
    return success('Credential types retrieved', list)
}
const addNewType = async (description:string, fields:credentialFieldSet) : Promise<ServerReply> => {
    const op = await credentialTypes.addType(description, fields)
    return ServerReply.fromOperation(op)
}
const deleteType = async (credentialTypeId:number) : Promise<ServerReply> => {
    const op = await credentialTypes.deleteType(credentialTypeId)
    return ServerReply.fromOperation(op)
}

export {
    // Export to frontend call
    addCredential,
    updateCredential,
    deleteCredential,
    getCredentials,
    listUserCredentials,
    // Type management
    getCredentialTypes,
    addNewType,
    deleteType
}

