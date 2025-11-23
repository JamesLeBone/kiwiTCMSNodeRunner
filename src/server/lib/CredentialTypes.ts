import { db } from '../db/Database'
import { Operation } from './Operation'
import type { credentialFieldSet } from './Credentials'

export async function addType(description:string,fields:credentialFieldSet) : Promise<Operation> {
    const op = new Operation('addCredentialType')
    try {
        const fieldsString = JSON.stringify(fields)
        const set = await db.insert('credential_types',
            {description, fields:fieldsString}
        )
        if (set.length == 0) {
            return op.setError('Could not add credential type')
        }
        op.data = set[0]
        return op.setSuccess('Added credential type')
    } catch (e) {
        if (!(e instanceof Error)) {
            return op.setError('Unknown error adding credential type')
        }
        console.error('Error adding credential type', e.toString())
        return op.setError('Error adding credential type')
    }
}
export async function getTypes() {
    return db.fetch(`SELECT credential_type_id, description, fields FROM credential_types`)
}
export async function deleteType (id:number): Promise<Operation>  {
    const op = new Operation('deleteCredentialType')
    if (id < 2) return op.setError('Cannot delete default credential types')

    const nInUse = await db.fetchOne(`SELECT COUNT(*) as cnt FROM credentials WHERE credential_type_id = ?`, [id])
    if (nInUse.cnt > 0) {
        return op.setError('Cannot delete a credential type that is in use')
    }
    
    return db.run(`DELETE FROM credential_types WHERE credential_type_id = ?`, [id])
    .then(() => op.setSuccess('Deleted credential type'))
    .catch(e => {
        console.error('Error deleting credential type', e)
        return op.setError('Error deleting credential type')
    })
}