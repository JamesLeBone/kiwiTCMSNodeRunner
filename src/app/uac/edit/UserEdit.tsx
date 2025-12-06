'use client'

import { ComponentSection } from '@/components/ComponentSection'

import type { StatusOperation } from '@lib/Operation'
import Form from 'next/form'
import { useActionState } from 'react'
import { FormInputField, FormActionBar } from '@/components/FormActions'

import * as Users from '@server/Users'

export declare interface EditableUser {
    userId: number
    firstName?: string
    lastName?: string
    email?: string
    username?: string
}

export function UserEdit({user} : {user: EditableUser}) {
    const [state, setUserEvent, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            return await Users.update(
                user.userId,
                formData.get('lastName') as string,
                formData.get('firstName') as string,
                formData.get('email') as string,
                formData.get('username') as string
            ).then(opResult => {
                const so = {
                    id: 'updateUser',
                    status: opResult.status,
                    message: opResult.message,
                    statusType: opResult.status ? 'success' : 'error'
                } as StatusOperation
                return so
            })
        },
        { id: 'updateUser', status: false, message: '', statusType: 'blank' } as StatusOperation
    )

    return <ComponentSection header={'Edit user'}>
        <Form action={setUserEvent}>
            <fieldset>
                <FormInputField label="Username" value={user.username} name="username" required={true} />
                <FormInputField label="First Name" value={user.firstName} name="firstName" required={true} />
                <FormInputField label="Last Name" value={user.lastName} name="lastName" required={true} />
                <FormInputField label="Email" value={user.email} name="email" type="email" required={true} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: "Update" }]} />
        </Form>
    </ComponentSection>
}
