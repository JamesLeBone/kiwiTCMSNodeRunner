'use client'
import * as Users from '@server/Users'

import { useState, useEffect } from 'react'
import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar } from '@/components/Actions'
import { FormField } from '@/components/FormField'
import { InputField } from '@/components/InputField'
import { useMessage } from '@/components/ServerResponse'

export function SetPassword({username,userId,accessToken}) {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const serverMessage = useMessage()

    const send = e => {
        e.preventDefault()
        if (password != confirm) return
        serverMessage.loading()

        Users.setPassword(userId,password,accessToken)
        .then(reply => {
            if (reply === false) return serverMessage.error('Password reset failed.')
            
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

    const sv = (event, fn) => {
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
    const [usernameState, setusername] = useState('')
    const serverMessage = useMessage()

    const send = e => {
        e.preventDefault()
        Users.resetPassword(usernameState)
        .then(serverReply => {
            if (!serverMessage.statusResponse(serverReply)) return
            setusername('')
        })
    }

    return <ComponentSection header='Password Reset'>
        {serverMessage.message}
        <form onSubmit={send} id="reset-password-form">
            <fieldset>
                <FormField label="Username">
                    <InputField name="reset-username" type="text" value={usernameState} onChange={setusername} />
                </FormField>
                <ActionBar>
                    <input type="submit" value="Reset Password" />
                </ActionBar>
            </fieldset>
        </form>
    </ComponentSection>
}