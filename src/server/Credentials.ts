'use server'

import * as credentials from './lib/Credentials'
import * as credentialTypes from './lib/CredentialTypes'
import type { credentialFieldSet } from './lib/Credentials'
import { getCurrentUser } from '@server/lib/Auth'

import { Operation, StatusOperation, TypedOperationResult, unauthorised } from '@lib/Operation'
import { credentialType } from './lib/CredentialTypes'

// Exported
const addCredential = async (credential:credentialFieldSet, credentialTypeId:number = 1) : Promise<Operation> => {
    const login = await getCurrentUser()
    if (!login.data) return unauthorised
    const userId = login.data.userId

    return credentials.addCredential(userId, credential, credentialTypeId)
}

const updateCredential = async (userCredentialId:number, credential:credentialFieldSet) : Promise<Operation> => {
    const login = await getCurrentUser()
    if (!login.data) return unauthorised
    const userId = login.data.userId

    const owner = await credentials.getOwner(userCredentialId)
    if (owner !== userId) return {
        id: 'unauthorised',
        status: false,
        message: 'You do not own this credential'
    }
    
    return credentials.update(userCredentialId,credential)
}

const deleteCredential = async (userCredentialId:number) : Promise<Operation> => {
    const login = await getCurrentUser()
    if (!login.data) return unauthorised
    const userId = login.data.userId

    const owner = await credentials.getOwner(userCredentialId)
    if (owner !== userId) return {
        id: 'unauthorised',
        status: false,
        message: 'You do not own this credential'
    }
    await credentials.deleteCredential(userCredentialId)
    return {
        id: 'deleteCredential',
        status: true,
        message: 'Credential deleted'
    }
}

const getCredentials = async (userCredentialId:number) : Promise<TypedOperationResult<credentials.decryptedCredentialDetails>> => {
    const login = await getCurrentUser()
    if (!login.data) return unauthorised
    const userId = login.data.userId

    const creds = await credentials.find(userId,userCredentialId)

    const operation = {
        id: 'getCredentials',
        status: false,
        message: ''
    }
    
    if (!creds) return operation.message = 'No credentials found', operation
    return {
        ...operation,
        status: true,
        message: 'Credentials found',
        data: creds
    }
}
const getFirstCredentialOfType = async (credentialTypeId:number) : Promise<credentials.decryptedCredentialDetails | null> => {
    const login = await getCurrentUser()
    if (!login.data) return null
    const userId = login.data.userId
    return await credentials.getFirstCredentialOfType(userId, credentialTypeId)
}

const listUserCredentials = async () : Promise<TypedOperationResult<credentials.userCredentialList>> => {
    const login = await getCurrentUser()
    if (!login.data) return unauthorised
    const userId = login.data.userId

    const list = await credentials.list(userId)
    const op = {
        id: 'listUserCredentials',
        status: false,
        message: ''
    } as TypedOperationResult<credentials.userCredentialList>

    if (list.length == 0) {
        return op.message = 'No credentials found', op
    }
    op.status = true
    op.data = list
    op.message = 'Credentials retrieved'
    return op
}

const getCredentialTypes = async () : Promise<credentialType[]> => {
    const login = await getCurrentUser()
    if (!login.data) return []
    return credentialTypes.getTypes()
}

const addNewType = async (description:string, fields:credentialFieldSet) : Promise<StatusOperation> => {
    const login = await getCurrentUser()
    if (!login.data) return { ...unauthorised, statusType: 'error' }
    return credentialTypes.addType(description, fields)
}
const deleteType = async (credentialTypeId:number) : Promise<Operation> => {
    const login = await getCurrentUser()
    if (!login.data) return unauthorised
    return credentialTypes.deleteType(credentialTypeId)
}

export {
    // Export to frontend call
    addCredential,
    updateCredential,
    deleteCredential,
    getCredentials,
    getFirstCredentialOfType,
    listUserCredentials,
    // Type management
    getCredentialTypes,
    addNewType,
    deleteType
}

