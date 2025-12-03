'use client'
import * as Users from '@server/Users'

import { useState, useEffect, useActionState } from 'react'
import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar } from '@/components/Actions'
import { FormInputField, FormActionBar, validationError, blankStatus } from '@/components/FormActions'

import { FormField } from '@/components/FormField'
import { InputField } from '@/components/InputField'
import { useMessage } from '@/components/ServerResponse'
import Form from 'next/form'
import { StatusOperation } from '@lib/Operation'


declare type setPwParams = {
    username: string,
    userId: number,
    accessToken: string
}
export function SetPassword({username,userId,accessToken} : setPwParams) {
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

export function PasswordReset({}) {
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const email = (formData.get('email') ?? '') as string

            const msg = await Users.resetPassword(email)
            // console.debug('Password reset requested:', msg)
            return msg
        },
        { id : 'resetPassword', status: false, message: '', statusType: 'blank' } as StatusOperation
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