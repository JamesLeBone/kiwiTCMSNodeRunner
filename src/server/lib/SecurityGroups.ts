'use server'
import { StatusOperation, TypedOperationResult } from '@lib/Operation'
import { db } from '../db/Database'
export declare interface ProspectiveSecurityGroup {
    securityGroupId?: number
    name: string
    description: string
    isDefault: boolean
}
export declare interface SecurityGroup extends ProspectiveSecurityGroup {
    securityGroupId: number
}

const dbRow2SecurityGroup = (row: any) : SecurityGroup => {
    return {
        securityGroupId: Number.parseInt(row.securityGroupId),
        name: row.name,
        description: row.description,
        isDefault: row.isDefault == 1
    }
}

export async function getList() : Promise<SecurityGroup[]> {
    const rows = await db.fetch('SELECT * FROM security_groups')
    const groups = rows.map(dbRow2SecurityGroup)
    return groups
}

export async function getById(securityGroupId: number) : Promise<SecurityGroup | null> {
    const row = await db.fetchOne('SELECT * FROM security_groups WHERE security_group_id = ?', [securityGroupId])
    if (row == null) return null
    const sg: SecurityGroup = dbRow2SecurityGroup(row)
    return sg
}

export async function getByName(name: string) : Promise<SecurityGroup | null> {
    const row = await db.fetchOne('SELECT * FROM security_groups WHERE name = ?', [name])
    if (row == null) return null
    const sg: SecurityGroup = dbRow2SecurityGroup(row)
    return sg
}

export async function create(name: string, description: string) : Promise<TypedOperationResult<SecurityGroup>> {
    const tor = {
        id: 'CreateSecurityGroup',
        status: false,
        message: 'Nothing done',
        statusType: 'error'
    } as TypedOperationResult<SecurityGroup>

    const exists = await getByName(name)
    if (exists !== null) {
        tor.message = `Security Group with name '${name}' already exists.`
        return tor
    }

    const result = await db.insert('security_groups', {name,description})
    const sg: ProspectiveSecurityGroup = {
        name,
        description,
        isDefault: false
    }
    if (result.length == 0) {
        tor.message = 'Failed to create Security Group.'
        return tor
    }
    sg.securityGroupId = Number.parseInt(result[0].securityGroupId)
    tor.data = sg as SecurityGroup
    tor.status = true
    tor.message = 'Security Group created successfully.'
    tor.statusType = 'success'
    return tor
}

export async function update(sg: SecurityGroup) : Promise<boolean> {
    const val = {
        name: sg.name,
        description: sg.description,
        isDefault: sg.isDefault ? 1 : 0
    }
    const result = await db.update('security_groups', sg.securityGroupId, val, 'security_group_id')
    return result ? true : false
}

export async function remove(securityGroupId: number) : Promise<boolean> {
    await db.fetch(
        'DELETE FROM security_groups WHERE security_group_id = ?',
        [securityGroupId]
    )
    const row = await getById(securityGroupId)
    // console.debug('Delete check', row)
    if (row === null) return true
    return false
}

