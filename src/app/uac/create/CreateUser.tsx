'use client'

import { ComponentSection } from '@/components/ComponentSection'

import type { StatusOperation } from '@lib/Operation'
import Form from 'next/form'
import { useActionState } from 'react'
import { FormInputField, FormActionBar } from '@/components/FormActions'

import * as Users from '@server/Users'
export default function CreateUser({}) {
    const operationId = 'createUser'

    const [state, setUserEvent, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            return await Users.create({
                lastName: formData.get('lastName') as string,
                firstName: formData.get('firstName') as string,
                email: formData.get('email') as string,
                username: formData.get('username') as string
            }).then(opResult => {
                const so = {
                    id: operationId,
                    status: opResult.status,
                    message: opResult.message,
                    statusType: opResult.status ? 'success' : 'error'
                } as StatusOperation
                return so
            })
        },
        { id: operationId, status: false, message: '', statusType: 'blank' } as StatusOperation
    )

    return <ComponentSection header={'Create user'}>
        <Form action={setUserEvent}>
            <fieldset>
                <FormInputField label="Username" name="username" required={true} />
                <FormInputField label="First Name" name="firstName" required={true} />
                <FormInputField label="Last Name" name="lastName" required={true} />
                <FormInputField label="Email" name="email" type="email" required={true} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: "Create" }]} />
        </Form>
    </ComponentSection>
}