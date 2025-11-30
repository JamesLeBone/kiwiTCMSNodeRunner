'use client'
import { useState, useEffect } from 'react'
import ChecklistItem from '@app/setup/components/ChecklistItem'
import * as hc from '@server/HealthCheck'
import {statuses}  from '@/components/Processing'
import { ActionBar } from '@/components/Actions'
import { useMessage  } from '@/components/ServerResponse'

import Form from 'next/form'
import { useActionState } from 'react'

import { FormInputField } from '@/components/FormActions'

function CreateUserForm({status, setStatus, setMessage} : {status: statuses, setStatus: React.Dispatch<React.SetStateAction<statuses>>, setMessage: React.Dispatch<React.SetStateAction<string>>}) {
    const message = useMessage()
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const result = await hc.createFirstUser(formData)
            message.statusResponse(result, false)
            if (result.status) {
                setStatus('done')
                setMessage(result.message)
            }
            return result
        },
        { id: 'createFirstUser', status: false, message: '' }
    )

    if (status !== 'error') return <></>
    
    return <Form action={formAction} style={{gridColumn: '1/-1', width: '300px', maxWidth: '100%', margin:'auto'}}>
        <fieldset>
            <legend>Create your first user<br/> You will receive an email verification.</legend>
            <FormInputField label="First Name" name="firstName" />
            <FormInputField label="Last Name" name="lastName" />
            <FormInputField label="Email" name="email" type="email" />
            <FormInputField label="Username" name="username" />
        </fieldset>
        <ActionBar>
            <input type="submit" value="Create User" disabled={isPending} />
            {message.message}
        </ActionBar>
    </Form>
}

export default function UserStatus({dbStatus} : {dbStatus: statuses}) {
    const [status, setStatus] = useState('disabled' as statuses)
    const [message, setMessage] = useState('Database initialization required')
    const [buttonDisabled, setButtonDisabled] = useState(true)
    const [buttonText, setButtonText] = useState('...')

    const doVerifyUsers = async () => {
        setStatus('processing')
        setButtonDisabled(true)
        setButtonText('Processing...')

        const {status,nUsers,message} = await hc.verifyUsers()
        if (status) {
            setMessage(`There are ${nUsers} users`)
            setStatus('done')
            return
        }

        setStatus('error')
        setButtonDisabled(false)
        setMessage(message)
        setButtonText('Create your first user')
    }

    useEffect(() => {
        if (dbStatus !== 'done') return

        doVerifyUsers()
    } , [dbStatus])

    const actionProps = {
        action: doVerifyUsers,
        isLoading: buttonDisabled,
        actionText: buttonText
    }
    return <>
        <ChecklistItem status={status} message={message} actionProps={actionProps} />
        <CreateUserForm status={status} setStatus={setStatus} setMessage={setMessage} />
    </>

}
