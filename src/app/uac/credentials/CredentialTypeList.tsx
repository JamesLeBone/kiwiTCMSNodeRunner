'use client'

import { ComponentSection } from '@/components/ComponentSection'
import type { credentialType } from '@server/lib/CredentialTypes'
import { IconButton } from '@/components/IconButton'
import { useState } from 'react'

import { deleteType } from '@server/Credentials'

export default function CredentialTypeList({types} : {types:credentialType[]}) {
    const [typeList, setTypeList] = useState(types)
    const removeCred = async (id:number) => {
        if (id === 1) return // Cannot delete default type
        await deleteType(id)
        setTypeList(typeList.filter(ct => ct.credentialTypeId !== id))
    }
    const header = <IconButton href="/uac/credentials/newType" className="button fa fa-plus" title="Add New Credential Type" />
    const deleteButton = (id:number) => {
        if (id === 1) return null // Cannot delete default type
        return <IconButton title="Delete" className='fa fa-trash' action={() => removeCred(id)}></IconButton>
    }

    return <ComponentSection header="Credential Types" headerActions={header}>
        <table className='rowHover'>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {typeList.map((ct) => 
                    <tr key={ct.credentialTypeId}>
                        <td>{ct.description}</td>
                        <td className='align-right'>
                            { deleteButton(ct.credentialTypeId) }
                            <IconButton href={`/uac/credentials/new?typeId=${ct.credentialTypeId}`} className='fa fa-plus' title="Add Credential"></IconButton>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </ComponentSection>
}