'use client'

import { ComponentSection } from "@/components/ComponentSection"
import { StatusOperation } from "@lib/Operation"
import { credentialFieldSet } from "@server/lib/Credentials"
import { credentialType } from "@server/lib/CredentialTypes"
import Form from 'next/form'
import { useActionState } from "react"
import { FormInputField, FormActionBar, blankStatus } from '@/components/FormActions'

import { addCredential } from "@server/Credentials"

export default function CreateCredential({type} : {type: credentialType}) {
    const [state, CreateCredential, isPending] = useActionState(
        async (prevState: StatusOperation, formData: FormData) => {
            const credentialFS = {} as credentialFieldSet

            for (const [key, value] of formData.entries()) {
                const fieldMatch = key.match(/^credential\[(?<name>.+)\]$/)
                if (!fieldMatch || !fieldMatch.groups) continue
                const fieldName = fieldMatch.groups.name
                if (typeof type.fields[fieldName] === 'undefined') continue

                credentialFS[fieldName] = { ...type.fields[fieldName],
                    value: value as string
                }
            }
            const op = await addCredential(credentialFS, type.credentialTypeId)
            op.statusType = op.status ? 'success' : 'error'
            return op as StatusOperation
        },
        blankStatus('createCredential')
    )
    const header = `Create new ${type.description}`
    
    return <ComponentSection header={header}>
        <Form action={CreateCredential} >
            <fieldset>
                {Object.entries(type.fields).map(([fieldName, fieldDef]) => {
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
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'create' }]} />
        </Form>
    </ComponentSection>
}
