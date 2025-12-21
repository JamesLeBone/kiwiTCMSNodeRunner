'use client'
import * as Users from '@server/Users'

import { useActionState } from 'react'
import { ComponentSection } from '@/components/ComponentSection'
import { FormInputField, FormActionBar, blankStatus } from '@/components/FormActions'

import Form from 'next/form'
import { StatusOperation } from '@lib/Operation'


export function PasswordReset({}) {
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const email = (formData.get('email') ?? '') as string

            const msg = await Users.resetPassword(email)
            return msg
        },
        blankStatus('resetPassword')
    )

    return <ComponentSection header='Password Reset'>
        <Form action={formAction} id="reset-password-form">
            <fieldset>
                <FormInputField label="Email" name="email" type="email" required={true} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Reset Password' }]} />
        </Form>
    </ComponentSection>
}