'use client'

import { ComponentSection } from '@/components/ComponentSection'
import type { credentialType } from '@server/lib/CredentialTypes'
import { IconButton } from '@/components/IconButton'
import { useState } from 'react'

import { deleteType } from '@server/Credentials'
import ServerResponse from '@/components/ServerResponse'
import { useMessage } from '@/components/useMessage'

const editUrl = (id:number) => {
    return `/uac/credentials/editType/${id}`
}

function ProductCategory(p: {ct: credentialType}) {
    if (!p.ct.productId) {
        return <td colSpan={2}>Kiwi TCMS</td>
    }
    const productName = p.ct.productName ? p.ct.productName : 'Unknown Product'
    if (!p.ct.categoryId) {
        return <td colSpan={2}>{productName} - All Categories</td>
    }
    const categoryName = p.ct.categoryName ? p.ct.categoryName : 'Unknown Category'
    
    return <>
        <td>{productName}</td>
        <td>{categoryName}</td>
    </>
}

type CredentialRowProps = {
    ct: credentialType,
    removeCred: () => void
}
export function CredentialRow(p: CredentialRowProps) {
    const { ct, removeCred } = p

    return <tr key={ct.credentialTypeId}>
        <td>{ct.description}</td>
        <ProductCategory ct={ct} />
        <td className='align-right'>
            <IconButton title="Delete" className='fa fa-trash' onClick={() => removeCred()}></IconButton>
            <IconButton title='Edit' className='fa fa-edit' href={editUrl(ct.credentialTypeId)}></IconButton>
            <IconButton href={`/uac/credentials/new?typeId=${ct.credentialTypeId}`} className='fa fa-plus' title="Add Credential"></IconButton>
        </td>
    </tr>
}
function KiwiCredentialsWarning() {
    return <ServerResponse type='warning'>
        <strong>Warning:</strong> No Kiwi TCMS credentials listed.
        <p>Please define at least one credential type with no product or category to use Kiwi TCMS credentials.</p>
    </ServerResponse>
}

export default function CredentialTypeList({types} : {types:credentialType[]}) {
    const [typeList, setTypeList] = useState(types)
    const message = useMessage()

    const removeCred = async (id:number) => {
        message.clear()
        const result = await deleteType(id)
        if (!result.status) {
            message.statusResponse(result)
            return
        }

        setTypeList(typeList.filter(ct => ct.credentialTypeId !== id))
    }
    const header = <IconButton href="/uac/credentials/newType" className="fa fa-plus" title="Add New Credential Type" />

    let hasKiwiCredentials = false
    for (const ct of typeList) {
        if (!ct.productId) hasKiwiCredentials = true
    }
    
    return <ComponentSection header="Credential Types" headerActions={header}>
        { message.message }
        { hasKiwiCredentials ? null : <KiwiCredentialsWarning /> }
        <table className='rowHover'>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {typeList.map((ct) => <CredentialRow key={ct.credentialTypeId} ct={ct} removeCred={() => removeCred(ct.credentialTypeId)} />)}
            </tbody>
        </table>
    </ComponentSection>
}