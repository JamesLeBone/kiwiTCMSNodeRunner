import { db } from '../db/Database'
import { Operation } from '@lib/Operation'
import ncrypt from 'ncrypt-js'
import { getUser } from './Users'
import { getCurrentUser } from '@server/lib/Auth'

type credentialField = {
    type: string,
    value?: string|number
}
export type credentialFieldSet = { [ key:string ]: credentialField }

export declare type userCredentialList = {
    userCredentialId: number
    description: string
}[]
export declare type decryptedCredentialDetails = {
    userCredentialId: number
    description: string
    credential: credentialFieldSet
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
export async function update(userCredentialId:number, credential:credentialFieldSet) : Promise<Operation> {
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
        const updated = await db.update(
            'credentials',
            userCredentialId,
            {credential:encrypted},
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

async function getCredential(userId:number, fieldName:string, value:number) {
    const sql = `SELECT 
        c.user_credential_id
        , ct.description
        , ct.fields
        , c.credential
        , users.secret
    FROM credentials c
        JOIN credential_types ct ON ct.credential_type_id = c.credential_type_id
        JOIN users on users.user_id = c.user_id
    WHERE c.user_id = ?
    AND c.${fieldName} = ?`
    const creds = await db.fetch(sql,
        [userId, value]
    )
    if (creds.length == 0) return null
    const dbRow = creds[0]

    try {
        const decrypted = decryptCredential(dbRow.credential, dbRow.secret)

        const uc = {
            userCredentialId: dbRow.userCredentialId,
            description: dbRow.description,
            credential: decrypted
        } as decryptedCredentialDetails
        return uc
    } catch (e) {
        console.error('Error parsing credential type', e)
        return null
    }
}

export async function find(userId:number, credentialId:number) : Promise<decryptedCredentialDetails|null> {
    return getCredential(userId, 'user_credential_id', credentialId)
}

/**
 * This is the server-internal function to get credentials for the current user
 * and services
 * @returns Decrypted credential details or null
 */
export async function getFirstCredentialOfType(userId:number, credentialTypeId:number) : Promise<decryptedCredentialDetails|null> {
    return getCredential(userId, 'credential_type_id', credentialTypeId)
}

export async function list(userId:number) : Promise<userCredentialList> {
    const params = [userId]
    const creds = await db.fetch(`SELECT user_credential_id, description
        FROM credentials c
        JOIN credential_types ct ON ct.credential_type_id = c.credential_type_id
        WHERE c.user_id = ?`, params)
    
    return creds
}
