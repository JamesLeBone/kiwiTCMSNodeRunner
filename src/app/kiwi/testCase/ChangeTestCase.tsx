'use client'

import { getTestCase } from '@server/kiwi/TestCase'
import type { OperationResult } from '@lib/Operation'
import Form from 'next/form'
import { useActionState } from 'react'
import { FormInputField, FormActionBar, validationError } from '@/components/FormActions'
import { redirect } from 'next/navigation'

const searchOperationId = 'searchTestCase'

export default function ChangeTestCase() {
    const [state, search, isPending] = useActionState(
        
        async (prevState: any, formData: FormData) => {
            const id = formData.get('id')
            if (!id) return validationError(searchOperationId,'ID is required')
            const scriptIdNum = Number.parseInt(id as string)
            if (isNaN(scriptIdNum)) return validationError(searchOperationId,'ID must be a number')

            const res = await getTestCase(scriptIdNum)
            if (!res.data || res.status) return res

            return redirect('/kiwi/testCase/'+scriptIdNum)
        },
        { id: 'blank', status: false, message: '', statusType: 'blank' } as OperationResult
    )

    return <Form action={search}>
        <fieldset>
            <FormInputField label="ID" required={true} name='id' />
        </fieldset>
        <FormActionBar pendingState={isPending} state={state} actions='Search' />
    </Form>
}
