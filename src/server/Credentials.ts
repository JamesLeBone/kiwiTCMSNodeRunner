'use server'

import * as credentials from './lib/Credentials'
import * as credentialTypes from './lib/CredentialTypes'
import type { credentialFieldSet } from './lib/Credentials'
import { getCurrentUser } from '@server/lib/Auth'
import { Category, fetchCategory } from './kiwi/Category'

import { Operation, prepareStatus, StatusOperation, TypedOperationResult, unauthorised, updateOpError, updateOpSuccess } from '@lib/Operation'
import { credentialType } from './lib/CredentialTypes'
import type { ProductWithClassificationName } from './kiwi/Product'
import { fetch as fetchProduct } from './kiwi/Product'

// Exported
export async function addCredential(credential:credentialFieldSet, credentialTypeId:number = 1) : Promise<Operation> {
    const login = await getCurrentUser()
    if (!login.data) return unauthorised
    const userId = login.data.userId

    return credentials.addCredential(userId, credential, credentialTypeId)
}

export async function updateCredential(userCredentialId:number, credential:credentialFieldSet, productId?: number, categoryId?: number) : Promise<StatusOperation> {
    const login = await getCurrentUser()
    if (!login.data) return unauthorised
    const op = prepareStatus('updateCredential')
    const userId = login.data.userId

    const owner = await credentials.getOwner(userCredentialId)
    if (owner !== userId) {
        updateOpError(op, 'You do not own this credential')
        return op
    }

    if (categoryId !== undefined) {
        const category = await fetchCategory(categoryId) 
        if (!category) {
            updateOpError(op, 'Invalid category selected')
            return op
        }
        if (productId === undefined) {
            productId = category.product
        } else if (productId !== category.product) {
            const productName = category.productRecord ? category.productRecord.name : 'the selected product'
            updateOpError(op, category.name+' does not belong to '+productName)
            return op
        }
    } else if (productId !== undefined) {
        const product = await fetchProduct(productId)
        if (!product) {
            updateOpError(op, 'Invalid product selected')
            return op
        }
    }
    
    const result = await credentials.update(userCredentialId,credential, productId, categoryId)
    if (result) {
        updateOpSuccess(op, 'Credential updated')
    } else {
        updateOpError(op, 'Failed to update credential')
    }
    return op
}

export async function deleteCredential(userCredentialId:number) : Promise<Operation> {
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

export type credentialDetails = {
    credentials: credentials.decryptedCredentialDetails
    category?: Category
    product?: ProductWithClassificationName
}

export async function getCredentials(userCredentialId:number) : Promise<TypedOperationResult<credentialDetails>> {
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

    const returnData:credentialDetails = {
        credentials: creds
    }

    if (creds.categoryId) {
        const category = await fetchCategory(creds.categoryId)
        if (category) returnData.category = category
    }

    if (creds.productId) {
        const product = await fetchProduct(creds.productId)
        if (product) returnData.product = product
    }

    return {
        ...operation,
        status: true,
        message: 'Credentials found',
        data: returnData
    }
}
export async function getFirstCredentialOfType(credentialTypeId:number) : Promise<credentials.decryptedCredentialDetails | null> {
    const login = await getCurrentUser()
    if (!login.data) return null
    const userId = login.data.userId
    return await credentials.getFirstCredentialOfType(userId, credentialTypeId)
}

export async function listUserCredentials() : Promise<TypedOperationResult<credentials.userCredentialList>> {
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

export async function getCredentialTypes() : Promise<credentialType[]> {
    const login = await getCurrentUser()
    if (!login.data) return []
    return credentialTypes.getTypes()
}

export async function addNewType(description:string, fields:credentialFieldSet) : Promise<StatusOperation> {
    const login = await getCurrentUser()
    if (!login.data) return { ...unauthorised, statusType: 'error' }
    return credentialTypes.addType(description, fields)
}
export async function deleteType(credentialTypeId:number) : Promise<Operation> {
    const login = await getCurrentUser()
    if (!login.data) return unauthorised
    return credentialTypes.deleteType(credentialTypeId)
}

