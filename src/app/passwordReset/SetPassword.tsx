'use client'

import { FormField } from '@/components/FormField'
import * as Users from '@server/Users'

import { useActionState } from 'react'
import { ComponentSection } from '@/components/ComponentSection'
import { FormInputField, FormActionBar, validationError, blankStatus } from '@/components/FormActions'

import Form from 'next/form'

type setPwParams = {
    username: string,
    userId: number,
    accessToken: string
}
export default function SetPassword({username,userId,accessToken} : setPwParams) {
    const [state, send, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const password = (formData.get('newPassword') ?? '') as string
            const confirm = (formData.get('confirmPassword') ?? '') as string
            if (password !== confirm) {
                return validationError('setPassword', 'Passwords do not match')
            }

            const reply = await Users.setPassword(userId,password,confirm,accessToken)
            if (!reply.status) {
                return validationError('setPassword', reply.message)
            }
            return {
                id: 'setPassword', status: true,
                message: 'Password has been set successfully. You are now logged in.'
            }
            
        },
        blankStatus('resetPassword')
    )

    return <ComponentSection header='Set Password' className={['compact']}>
        <Form action={send}>
            <fieldset>
                <FormField label="Username"><p>{username}</p></FormField>
                <FormInputField label="New Password" name="newPassword" type="password" required={true} />
                <FormInputField label="Confirm Password" name="confirmPassword" type="password" required={true} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Set Password' }]} />
        </Form>
    </ComponentSection>
}
