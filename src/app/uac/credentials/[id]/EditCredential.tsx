'use client'

import { ComponentSection } from "@/components/ComponentSection"
import { FormField } from '@/components/FormField'
import { FormInputField, FormActionBar, blankStatus } from '@/components/FormActions'
import { groupedOptions, selectionOption, Selection, GroupedSelection, selectionOptionProps } from "@/components/Selection"

import { StatusOperation } from "@lib/Operation"

import { credentialFieldSet } from "@server/lib/Credentials"
import { updateCredential } from "@server/Credentials"
import type { credentialDetails } from '@server/Credentials'

import Form from 'next/form'
import { useActionState, useState } from "react"

import { formDataValue } from "@lib/Functions"
type ecprops = {
    credential: credentialDetails
}
export default function EditCredential(props : ecprops) {
    const { userCredentialId, description } = props.credential.credentials
    const fields = props.credential.credentials.credential

    const [state, actionUpdate, isPending] = useActionState(
        async (prevState: StatusOperation, formData: FormData) => {
            const credentialFS = {} as credentialFieldSet
            for (const [key, value] of formData.entries()) {
                const fieldMatch = key.match(/^credential\[(?<name>.+)\]$/)
                if (!fieldMatch || !fieldMatch.groups) continue
                const fieldName = fieldMatch.groups.name
                credentialFS[fieldName] = { 
                    ...fields[fieldName],
                    value: value as string
                }
            }
            const productId = formDataValue.getOptionalNumber(formData, 'productId')
            const categoryId = formDataValue.getOptionalNumber(formData, 'categoryId')

            const op = await updateCredential(userCredentialId, credentialFS, productId, categoryId)
            op.statusType = op.status ? 'success' : 'error'
            return op as StatusOperation
        },
        blankStatus('actionUpdate')
    )
    const header = `Edit ${description}`
    
    return <ComponentSection header={header}>
        <Form action={actionUpdate} >
            <fieldset>
                {Object.entries(fields).map(([fieldName, fieldDef]) => {
                    const inputName = `credential[${fieldName}]`
                    const inputType = fieldDef.type
                    
                    return <FormInputField 
                        key={fieldName} 
                        label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ':'} 
                        name={inputName} 
                        type={inputType} 
                        value={fieldDef.value ? fieldDef.value.toString() : ''} 
                    />
                })}
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Update' }]} />
        </Form>
    </ComponentSection>
}
