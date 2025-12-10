'use server'
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

export async function create(name: string, description: string) : Promise<ProspectiveSecurityGroup> {
    const result = await db.insert('security_groups', {name,description})
    const sg: ProspectiveSecurityGroup = {
        name,
        description,
        isDefault: false
    }
    if (!result) return sg
    console.log('create result', result)
    sg.securityGroupId = Number.parseInt(result.securityGroupId)
    return sg
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
    const result = await db.run(
        'DELETE FROM security_groups WHERE security_group_id = ?',
        [securityGroupId]
    )
    if (typeof result === 'boolean') return result
    return true
}

