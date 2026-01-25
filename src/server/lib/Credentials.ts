import { db } from '../db/Database'
import { Operation } from '@lib/Operation'
import ncrypt from 'ncrypt-js'
import { getUser } from './Users'

type credentialField = {
    type: string,
    value?: string|number
}
export type credentialFieldSet = { [ key:string ]: credentialField }

export type userCredentialList = {
    userCredentialId: number
    description: string
}[]
export type decryptedCredentialDetails = {
    userCredentialId: number
    description: string
    credential: credentialFieldSet
    productId?: number
    categoryId?: number
    scriptPrefix: string
}

const decryptCredential = (encrypted:string, secret:string) : credentialFieldSet|false => {
    let creds: credentialFieldSet
    try {
        const encrptor = new ncrypt(secret)
        const credentialString = encrptor.decrypt(encrypted) as string
        creds = JSON.parse(credentialString)
    } catch (e) {
        console.debug(e)
        console.error('Error decrypting credentials', e)
        return false
    }
    return creds
}

const encrypt = async (data:credentialFieldSet, userId:number) : Promise<string|false> => {
    const user = await getUser(userId)
    if (!user) return false
    
    const secret = user.secret
    if (!secret) return false
    const encrptor = new ncrypt(secret)
    const credentialString = JSON.stringify(data)
    const encrypted = encrptor.encrypt(credentialString)
    return encrypted
}

export async function addCredential(userId:number,credential:credentialFieldSet,credentialTypeId:number = 1) : Promise<Operation> {
    const op = {
        id: 'addCredential',
        status: false,
        message: ''
    }

    try {
        const encrypted = await encrypt(credential, userId)
        if (!encrypted) return op.message = 'Error encrypting credentials', op

        const set = await db.insert('credentials',
            {userId, credentialTypeId, credential:encrypted}
        )
        if (set.length == 0) {
            op.message = 'Could not add credential'
        } else {
            op.status = true
            op.message = 'Added'
        }
    } catch (e) {
        console.error('Error setting credential', e)
        op.message = 'Error'
    }
    return op
}
export async function getOwner(userCredentialId:number) : Promise<number|null> {
    const cred = await db.get('credentials', userCredentialId, 'user_credential_id')
    if (!cred) return null
    return cred.userId
}

type updateCredentialTuple = {
    credential: string
    productId?: number|null
    categoryId?: number|null
}

export async function update(userCredentialId:number, credential:credentialFieldSet, productId?: number, categoryId?: number) : Promise<Operation> {
    const op = {
        id: 'updateCredentials',
        status: false,
        message: ''
    }
    const uc = await db.get('credentials', userCredentialId, 'user_credential_id')
    if (!uc) return op.message = 'User credential not found', op
    const userId = uc.userId
    try {
        const encrypted = await encrypt(credential, userId)
        if (!encrypted) return op.message = 'Error encrypting credentials', op

        const dataSet: updateCredentialTuple = {credential:encrypted}
        if (productId !== undefined) dataSet['productId'] = productId
        if (categoryId !== undefined) dataSet['categoryId'] = categoryId

        const updated = await db.update(
            'credentials',
            userCredentialId,
            dataSet,
            'user_credential_id'
        )
        if (!updated) 
            op.message = 'Could not update'
        else  {
            op.status = true
            op.message = 'Updated'
        }
    } catch (e) {
        console.error('Error updating credentials', e)
        op.message = 'Error updating'
    }
    return op
}
export async function deleteCredential(userCredentialId:number) : Promise<void> {
    await db.run(`DELETE FROM credentials WHERE user_credential_id = ?`, [userCredentialId])
}

type CredentialType = {
    credentialTypeId: number
    description: string
    fields: credentialFieldSet
    productId?: number
    categoryId?: number
    scriptPrefix: string
}
export async function fetchType(credentialTypeId:number) : Promise<CredentialType|null> {
    const sql = `SELECT * FROM credential_types WHERE credential_type_id = ?`
    const rows = await db.fetch(sql, [credentialTypeId])
    if (rows.length == 0) return null
    const ct:CredentialType = {
        credentialTypeId: rows[0].credentialTypeId,
        description: rows[0].description,
        fields: JSON.parse(rows[0].fields) as credentialFieldSet,
        productId: rows[0].productId,
        categoryId: rows[0].categoryId,
        scriptPrefix: rows[0].scriptPrefix ?? ''
    }
    return ct
}

async function queryCredential(userId:number, fieldName:string, value:number|null) {
    let sql = `SELECT 
        c.user_credential_id
        , ct.description
        , ct.fields
        , ct.product_id
        , ct.category_id
        , ct.script_prefix
        , c.credential
        , users.secret
    FROM credentials c
        JOIN credential_types ct ON ct.credential_type_id = c.credential_type_id
        JOIN users on users.user_id = c.user_id
    WHERE c.user_id = ?`
    const params = [userId]

    if (value !== null) {
        sql += ` AND ${fieldName} = ?`
        params.push(value)
    } else {
        sql += ` AND ${fieldName} IS NULL`
    }
    const creds = await db.fetch(sql,params)
    if (creds.length == 0) return null
    const dbRow = creds[0]

    try {
        const decrypted = decryptCredential(dbRow.credential, dbRow.secret)
        const credential:credentialFieldSet = decrypted || {} as credentialFieldSet

        const uc:decryptedCredentialDetails = {
            userCredentialId: dbRow.userCredentialId,
            description: dbRow.description,
            credential,
            productId: dbRow.productId,
            categoryId: dbRow.categoryId,
            scriptPrefix: dbRow.scriptPrefix ?? ''
        }
        return uc
    } catch (e) {
        console.error('Error parsing credential type', e)
        return null
    }
}

export async function find(userId:number, credentialId:number) : Promise<decryptedCredentialDetails|null> {
    return queryCredential(userId, 'c.user_credential_id', credentialId)
}

export async function getCredentialByCategory(userId:number, categoryId:number) : Promise<decryptedCredentialDetails|null> {
    return queryCredential(userId, 'ct.category_id', categoryId)
}

export async function getCredential(userId:number, productId?:number, categoryId?:number) {
    if (typeof productId === 'undefined' && typeof categoryId === 'undefined') {
        return queryCredential(userId, 'ct.product_id', null) // Kiwi Credentials
    }
    if (typeof categoryId !== 'undefined') {
        return queryCredential(userId, 'ct.category_id', categoryId) // Category-specific Credentials
    }
    if (typeof productId === 'undefined') {
        return queryCredential(userId, 'ct.product_id', null) // Kiwi Credentials
    }
    return queryCredential(userId, 'ct.product_id', productId) // Product-specific, Category-generic Credentials
}

/**
 * This is the server-internal function to get credentials for the current user
 * and services
 * @returns Decrypted credential details or null
 */
export async function getFirstCredentialOfType(userId:number, credentialTypeId:number) : Promise<decryptedCredentialDetails|null> {
    return queryCredential(userId, 'c.credential_type_id', credentialTypeId)
}

export async function list(userId:number) : Promise<userCredentialList> {
    const params = [userId]
    const creds = await db.fetch(`SELECT user_credential_id, description
        FROM credentials c
        JOIN credential_types ct ON ct.credential_type_id = c.credential_type_id
        WHERE c.user_id = ?`, params)
    
    return creds
}
