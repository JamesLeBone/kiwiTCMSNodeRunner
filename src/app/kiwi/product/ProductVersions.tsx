'use client'
import { useState } from 'react';

import { ComponentSection } from '@/components/ComponentSection'
import Form from 'next/form'
import { useActionState } from 'react'
import { FormInputField, FormActionBar, validationError, blankStatus } from '@/components/FormActions'

import { Version, createVersion } from '@server/kiwi/Product'

type pvp = {
    productId: number
    versions: Version[]
}
export default function ProductVersions(props : pvp) {
    const [versions, setVersions] = useState<Version[]>(props.versions)
    const addVersion = (version: Version) => {
        setVersions([...versions, version])
    }

    return <>
        <ComponentSection header='Versions'>
            <ProductVersionList versions={versions} />
        </ComponentSection>
        <AddProductVersion productId={props.productId} addVersion={addVersion} />
    </>
}

function ProductVersionList({versions} : {versions: Version[]}) {
    if (versions.length === 0) {
        return <em>No versions</em>
    }
    return <ul className='basic'>
        { versions.map( v => 
            <div key={v.id} title={v.id+''}>{v.value}</div>
        ) }
    </ul>
}

type apv = {
    productId: number
    addVersion: (version: Version) => void
}
function AddProductVersion({productId, addVersion} : apv) {
    const operationId = 'addProductVersion'
    
    const [state, formaction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const value = formData.get('value') as string

            if (!value || value.trim().length === 0) {
                return validationError(operationId, 'Version value is required')
            }

            // Call server to create version
            const op = await createVersion(value, productId)
            if (op.status && op.data) {
                addVersion(op.data)
            }
            return op
        },
        blankStatus(operationId)
    )

    return <ComponentSection header={`Add Version`}>
        <Form action={formaction}>
            <fieldset>
                <FormInputField label="Version" name="value" placeholder="e.g., 1.0, 2.0, main, devel" required={true} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{label:'Add Version'}]} />
        </Form>
    </ComponentSection>
}
