import { db } from '../db/Database'
import { Operation, StatusOperation, TypedOperationResult } from '@lib/Operation'
import type { credentialFieldSet } from './Credentials'

export declare type credentialType = {
    credentialTypeId: number
    description: string
    fields: credentialFieldSet
}
const rowToCredentialType = (row:any) : credentialType => {
    return {
        credentialTypeId: row.credentialTypeId,
        description: row.description,
        fields: JSON.parse(row.fields) as credentialFieldSet
    } as credentialType
}

export async function addType(description:string,fields:credentialFieldSet) : Promise<StatusOperation> {
    const op = {
        id: 'addCredentialType',
        status: false,
        statusType: 'error',
        message: ''
    } as StatusOperation
    try {
        const fieldsString = JSON.stringify(fields)
        const set = await db.insert('credential_types',
            {description, fields:fieldsString}
        )
        if (set.length == 0) {
            return op.message = 'Failed to add credential type', op
        }
        // op.data = rowToCredentialType(set[0])
        op.statusType = 'success'
        op.status = true
        op.message = 'Added credential type'
        return op
    } catch (e) {
        if (!(e instanceof Error)) {
            return op.message = 'Unknown error adding credential type', op
        }
        console.error('Error adding credential type', e.toString())
        return op.message = 'Error adding credential type: ' + e.message, op
    }
}
export async function getTypes() : Promise<credentialType[]> {
    return db.fetch(`SELECT credential_type_id, description, fields FROM credential_types`)
    .then(rows => rows.map(rowToCredentialType))
}
export async function deleteType (id:number): Promise<Operation>  {
    const op = {
        id: 'deleteCredentialType',
        status: false,
        message: ''
    }
    if (id < 2) return op.message = 'Cannot delete default credential types', op

    const nInUse = await db.fetchOne(`SELECT COUNT(*) as cnt FROM credentials WHERE credential_type_id = ?`, [id])
    if (nInUse.cnt > 0) {
        return op.message = 'Cannot delete a credential type that is in use', op
    }
    
    return db.run(`DELETE FROM credential_types WHERE credential_type_id = ?`, [id])
    .then(() => {
        op.status = true
        op.message = 'Credential type deleted'
        return op
    })
    .catch(e => {
        console.error('Error deleting credential type', e)
        return op.message = 'Error deleting credential type', op
    })
    
}