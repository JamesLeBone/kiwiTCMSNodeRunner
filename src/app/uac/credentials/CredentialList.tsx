'use client'
import { ComponentSection } from '@/components/ComponentSection'
import type { userCredentialList } from '@server/lib/Credentials'
import { IconButton } from '@/components/IconButton'
import { useState } from 'react'
import { deleteCredential } from '@server/Credentials'

function CList({list} : {list:userCredentialList}) {
    const [slist, setList] = useState(list)

    const dca = async (id:number) => {
        // Optimistic delete
        console.debug('Deleting credential', id)
        setList(slist.filter(cred => cred.userCredentialId !== id))
        deleteCredential(id)
    }

    if (slist.length === 0) return <tbody>
        <tr><td colSpan={2}>No credentials available.</td></tr>
    </tbody>

    return <tbody>
        {slist.map(cred => {
            const url = `/uac/credentials/${cred.userCredentialId}`
            return <tr key={cred.userCredentialId}>
                <td>{cred.description}</td>
                <td className='align-right'>
                    <IconButton href={url} className='button fa fa-edit' title="Edit Credential Details"/>
                    <IconButton onClick={() => dca(cred.userCredentialId)} className='fa fa-trash' title="Delete Credential" />
                </td>
            </tr>
        })}
    </tbody>
}

const newUrl = '/uac/credentials/new'

type params = {
    list: userCredentialList
}
export default function CredentialList({list} : params) {
    return <ComponentSection header="Credentials">
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <CList list={list} />
        </table>
    </ComponentSection>
}
