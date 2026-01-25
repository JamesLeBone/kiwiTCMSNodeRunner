import { db } from '../db/Database'
import { Operation, prepareStatus, StatusOperation, TypedOperationResult } from '@lib/Operation'
import type { credentialFieldSet } from './Credentials'

import { fetch as fetchProduct } from '../kiwi/Product'
import { fetchCategory } from '../kiwi/Category'

export type credentialType = {
    credentialTypeId: number
    description: string
    fields: credentialFieldSet
    // Id and names are seperated as they can have a value in our database that does not match Kiwi.
    productId: number
    productName?: string
    categoryId: number
    categoryName?: string
    scriptPrefix: string
}
const rowToCredentialType = async (row:any) : Promise<credentialType> => {
    const ct: credentialType = {
        credentialTypeId: row.credentialTypeId,
        description: row.description,
        fields: JSON.parse(row.fields) as credentialFieldSet,
        productId: row.productId,
        categoryId: row.categoryId,
        scriptPrefix: row.scriptPrefix ?? ''
    }

    const product = await fetchProduct(ct.productId)
    if (product) ct.productName = product.name

    const category = await fetchCategory(ct.categoryId)
    if (category) ct.categoryName = category.name

    return ct
}

export async function addType(description:string,fields:credentialFieldSet) : Promise<StatusOperation> {
    const op = prepareStatus('addCredentialType')
    // Leave product and category null for now.
    // the user will need to be able to connect to KIWI,
    // to define their product and categories first!  In that case, they should both save as null.

    try {
        const fieldsString = JSON.stringify(fields)
        const set = await db.insert('credential_types',
            {description, fields:fieldsString, productId: null, categoryId: null}
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
    const rows = await db.fetch(`SELECT * FROM credential_types`)
    return Promise.all(rows.map(rowToCredentialType))
}
export async function deleteType (id:number): Promise<Operation>  {
    const op = {
        id: 'deleteCredentialType',
        status: false,
        message: ''
    }

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

export async function getCredentialType(credentialTypeId:number) : Promise<credentialType|null> {
    const sql = `SELECT * FROM credential_types WHERE credential_type_id = ?`
    const rows = await db.fetch(sql, [credentialTypeId])
    if (rows.length == 0) return null
    return rowToCredentialType(rows[0])
}
