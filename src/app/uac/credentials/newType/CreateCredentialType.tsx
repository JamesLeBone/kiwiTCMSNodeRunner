'use client'

import { useState } from 'react'
import { ComponentSection } from '@/components/ComponentSection'
import { addNewType } from '@server/Credentials'
import type { credentialFieldSet } from '@server/lib/Credentials'

import { useActionState } from 'react'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import Form from 'next/form'
import { StatusOperation } from '@lib/Operation'

import TypeFieldsetEditor, {getFormDataValues} from '../TypeFieldsetEditor'
const formPrefixString = 'credential'

export default function CreateCredentialType() {
    const fieldList: credentialFieldSet = {
        'username': { type: 'string', value: '' },
        'password': { type: 'password', value: '' }
    }

    const [state, send, isPending] = useActionState(
        async (prevState: StatusOperation, formData: FormData) => {
            const action = formData.get('action')
            // console.debug('Form action:', action)
            if (action != 'Create Credential Type') return prevState

            const formDataObj = {
                description: formData.get('description') as string,
                fields: getFormDataValues(formData, formPrefixString)
            }

            return await addNewType(formDataObj.description, formDataObj.fields)
        },
        blankStatus('createCredentialType')
    )

    const formActions = [
        { label: 'Create Credential Type', id: 'create' }
    ]

    return <ComponentSection header="Create Credential Type">
        <Form action={send}>
            <fieldset>
                <FormInputField label="Description" name="description" type="text" required={true} />

            </fieldset>
            <TypeFieldsetEditor fieldList={fieldList} keyPrefix={formPrefixString} />
            
            <FormActionBar pendingState={isPending} state={state} actions={formActions} />
        </Form>
    </ComponentSection>
}