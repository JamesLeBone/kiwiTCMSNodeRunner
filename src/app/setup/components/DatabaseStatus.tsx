'use client'
import { useActionState } from 'react'
import * as hc from '@server/HealthCheck'

import UserStatus from './UserStatus'
import { ComponentSection } from '@/components/ComponentSection'
import { FormActionBar } from '@/components/FormActions'
import Form from 'next/form'
import { OperationResult } from '@lib/Operation'

export default function DatabaseStatus() {
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            return await hc.initializeDatabase()
        },
        { id: 'initializeDatabase', status: false, message: '' } as OperationResult
    )

    return <>
        <ComponentSection header="Database Status">
            <Form action={formAction}>
                <FormActionBar pendingState={isPending} state={state} actions={[{ label: "Check Database" }]} />
            </Form>
        </ComponentSection>
        { state.status ? <UserStatus /> : <></> }
    </>
}
