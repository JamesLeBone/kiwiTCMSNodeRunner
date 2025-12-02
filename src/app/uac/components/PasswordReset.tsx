'use client'
import * as Users from '@server/Users'

import { useState, useEffect, useActionState } from 'react'
import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar } from '@/components/Actions'
import { FormInputField, FormActionBar } from '@/components/FormActions'

import { FormField } from '@/components/FormField'
import { InputField } from '@/components/InputField'
import { useMessage } from '@/components/ServerResponse'
import Form from 'next/form'
import { StatusOperation } from '@lib/Operation'

export function SetPassword({username,userId,accessToken} : {username:string,userId:number,accessToken:string}) {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const serverMessage = useMessage()

    const send = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (password != confirm) return
        serverMessage.loading()

        Users.setPassword(userId,password,accessToken)
        .then(reply => {
            if (reply.status === false) return serverMessage.error('Password reset failed.')
            
            const {status,message} = reply
            if (!status) {
                serverMessage.error(message)
                return
            }
            setPassword('')
            setConfirm('')
            
            serverMessage.success(message)
        })
    }

    const sv = (event: React.ChangeEvent<HTMLInputElement>, fn: React.Dispatch<React.SetStateAction<string>>) => {
        event.preventDefault()
        const value = event.target.value
        fn(value)
    }
    useEffect(() => {
        const validationField = document.querySelector('#password-confirm') as HTMLInputElement
        validationField.setCustomValidity('')
        if (password.length == 0) return

        if (password != confirm) {
            // console.error('Passwords do not match')
            validationField.setCustomValidity('Passwords do not match')
            return
        }
        console.info('Passwords match')
    }, [password, confirm])

    return <ComponentSection header='Set Password'>
        {serverMessage.message}
        <form onSubmit={send}>
            <fieldset>
                {username}
                <FormField label="New Password">
                    <input type="password" value={password} onChange={event => sv(event,setPassword)} />
                </FormField>
                <FormField label="Confirm Password">
                    <input type="password" id="password-confirm" value={confirm} onChange={event => sv(event,setConfirm)} />
                </FormField>
                <ActionBar>
                    <input type="submit" value="Reset Password" />
                </ActionBar>
            </fieldset>
        </form>
    </ComponentSection>
}

export function PasswordReset({}) {
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const email = (formData.get('email') ?? '') as string

            const msg = await Users.resetPassword(email)
            console.debug('Password reset requested:', msg)
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