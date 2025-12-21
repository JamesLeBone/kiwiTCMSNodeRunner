'use client'
import { useActionState } from 'react'
import { ComponentSection } from '@/components/ComponentSection'
import * as hc from '@server/HealthCheck'

import Form from 'next/form'

import { FormInputField, FormActionBar } from '@/components/FormActions'
import { StatusOperation } from '@lib/Operation'

function CreateUserForm() {
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const doVerify = formData.get('action') === 'Verify Users'
            console.log('Action:', doVerify, formData.get('action'))

            if (doVerify) {
                const result = await hc.verifyUsers()
                return result as StatusOperation
            }
            const result = await hc.createFirstUser(formData)
            return result
        },
        { id : 'createFirstUser', status: false, message: '', statusType: 'blank' } as StatusOperation
    )

    const commands = [
        { label: "Create User", id: 'createFirstUser' },
        { label: "Verify Users", id: 'verifyUsers' }
    ]
    
    return <Form action={formAction}>
        <fieldset>
            <legend>Create your first user<br/> You will receive an email verification.</legend>
            <FormInputField label="First Name" name="firstName" />
            <FormInputField label="Last Name" name="lastName" />
            <FormInputField label="Email" name="email" type="email" />
            <FormInputField label="Username" name="username" />
        </fieldset>
        <FormActionBar pendingState={isPending} state={state} actions={commands} />
    </Form>
}

export default function UserStatus() {
    return <ComponentSection header="User Status">
        <p key="info">At least one user is required</p>
        <CreateUserForm />
    </ComponentSection>
}
