'use client'
import { useActionState } from 'react'
import * as hc from '@server/HealthCheck'

import { ComponentSection } from '@/components/ComponentSection'
import { FormActionBar, validationError, blankStatus } from '@/components/FormActions'
import Form from 'next/form'

export default function DatabaseStatus() {
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const action = formData.get('action')
            if (action === 'Verify connection') {
                return await hc.verifyKiwiDbConnection()
            }
            if (action === 'Verify schema') {
                return await hc.verifyKiwiDbSchema()
            }
            return validationError('unknown', 'Unknown action')
        },
        blankStatus()
    )

    const actions = [
        { label: 'Verify connection' },
        { label: 'Verify schema' }
    ]

    return <>
        <ComponentSection header="KIWI Database Status">
            <p>The Kiwi database is used to store Kiwi TCMS data.</p>
            <p>This package extends Kiwi TCMS by adding new database columns</p>
            <Form action={formAction}>
                <FormActionBar pendingState={isPending} state={state} actions={actions} />
            </Form>
        </ComponentSection>
    </>
}
