'use client'

import { ActionBar } from '@/components/Actions'
import { ComponentSection } from '@/components/ComponentSection'
import Link from 'next/link'
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

    return <ComponentSection header="Credential Types">
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
                            { ct.credentialTypeId === 1 ? null : <IconButton title="Delete" className='fa fa-trash' action={() => removeCred(ct.credentialTypeId)} /> }
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
        <ActionBar>
            <Link href="/uac/credentials/newType" className="btn btn-primary">
                Add New Credential Type
            </Link>
        </ActionBar>
    </ComponentSection>
}