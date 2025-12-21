'use client'

import { ComponentSection } from "@/components/ComponentSection"
import { StatusOperation } from "@lib/Operation"
import { credentialFieldSet } from "@server/lib/Credentials"
import { credentialType } from "@server/lib/CredentialTypes"
import Form from 'next/form'
import { useActionState } from "react"
import { FormInputField, FormActionBar, blankStatus } from '@/components/FormActions'

import { updateCredential } from "@server/Credentials"
import type { decryptedCredentialDetails } from "@server/lib/Credentials"

export default function EditCredential({credential} : {credential: decryptedCredentialDetails}) {
    const { userCredentialId, description } = credential
    const fields = credential.credential

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

            const op = await updateCredential(userCredentialId, credentialFS)
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
