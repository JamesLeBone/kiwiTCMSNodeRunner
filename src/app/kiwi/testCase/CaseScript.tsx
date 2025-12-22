import { useState } from 'react';
import Link from 'next/link'

import { fetchTestCase, getTestCase, update, TestCase } from '@server/kiwi/TestCase'
import type { OperationResult } from '@lib/Operation'
import Form from 'next/form'
import { useActionState } from 'react'
import { FormInputField, FormActionBar, validationError } from '@/components/FormActions'

declare type CaseScriptProps = {
    testCaseId: number
    script?: number|string
}

const useScriptId = (initialValue: number|string) : number|'' => {
    if (typeof initialValue === 'number') {
        return initialValue
    }
    const parsed = Number.parseInt(initialValue)
    if (isNaN(parsed)) return ''
    return parsed
}

const ParentScriptDetails = ({ testCase, script }: { testCase: TestCase|null, script: number|string }) => {
    if (script === '') {
        return <div>No parent script assigned.</div>
    }
    const linkText = testCase ? `${testCase.id} - ${testCase.summary}` : script
    return <div>
        Parent Script: <Link href={'/kiwi/testCase/'+script}>{linkText}</Link>
    </div>
}

export default function CaseScript(props: CaseScriptProps) {
    const [script,setScript] = useState<number|string>(useScriptId(props.script || ''))
    const [parentScript,setParentScript] = useState<TestCase|null>(null)

    const verifyScript = async (scriptId:number) : Promise<OperationResult> => {
        return await getTestCase(scriptId)
        .then(serverReply => {
            if (!serverReply.data || !serverReply.status) {
                return serverReply
            }
            if (scriptId == props.script) {
                const testCase = serverReply.data
                setParentScript(testCase)
            }
            return serverReply
        })
    }

    const setScriptAction = async (scriptId:number) : Promise<OperationResult> => {
        const testCase = await fetchTestCase(scriptId)
        if (!testCase || !testCase.id) {
            return {
                id: 'setScript',
                status: false,
                message: 'Test case not found',
                statusType: 'error'
            } as OperationResult
        }
        const result = await update(props.testCaseId, { script: testCase.id } )
        if (result.status) {
            setScript(scriptId)
            setParentScript(testCase)
        }
        return result
    }

    const formActions = [
        { label: 'Verify' },
        { label: 'Set Parent Script' }
    ]
    const [state, scriptAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const action = formData.get('action')
            const value = formData.get('scriptId')
            if (!value) return validationError('caseScript','Script ID is required')
            const scriptIdNum = Number.parseInt(value.toString())
            if (isNaN(scriptIdNum)) return validationError('caseScript','Script ID must be a number')

            if (action === 'Verify') {
                return verifyScript(scriptIdNum)
            }
            return setScriptAction(scriptIdNum)
        },
        { id: 'blank', status: false, message: '', statusType: 'blank' } as OperationResult
    )
    
    return <div>
        <Form action={scriptAction}>
            <ParentScriptDetails testCase={parentScript} script={script} />
            <fieldset>
                <FormInputField label="Parent Script ID" value={props.script+''} required={true} name="scriptId" />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={formActions} />
        </Form>
    </div>
}
