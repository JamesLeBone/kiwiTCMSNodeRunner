'use client'
import { useActionState } from 'react'
import * as hc from '@server/HealthCheck'
import type { StatusOperation } from '@lib/Operation'

import { FormInputField, FormActionBar } from '@/components/FormActions'
import Form from 'next/form'
import { ComponentSection } from '@/components/ComponentSection'

export default function SMTPStatus() {
    // const message = useMessage()
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const recipient = {
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string
            }

            const result = await hc.sendEmail(recipient)
            result.statusType = result.status ? 'success' : 'error' 
            return result
        },
        { id: 'sendEmail', status: false, message: '', statusType: 'blank' } as StatusOperation
    )
    
    return <ComponentSection header="SMTP (outgoing email) Status">
        <Form action={formAction}>
            <fieldset>
                <legend>Send an Email to verify</legend>
                <FormInputField label="First Name" name="firstName" required={true} />
                <FormInputField label="Last Name" name="lastName" required={true} />
                <FormInputField label="Email" name="email" type="email" required={true} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: "Send" }]} />
        </Form>
    </ComponentSection>
}
