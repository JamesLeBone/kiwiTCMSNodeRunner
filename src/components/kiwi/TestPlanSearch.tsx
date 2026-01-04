'use client'

import { useState, useActionState } from 'react';
import Link from 'next/link'
import Form from 'next/form'

import { DynamicTable } from '@/components/DynamicTable'
import { ComponentSection } from '@/components/ComponentSection'
import { FormInputField, FormActionBar, blankStatus, validationError } from '@/components/FormActions'

import { TestPlan, get, search } from '@server/kiwi/TestPlan'
import { StatusOperation, updateOpSuccess } from '@lib/Operation';

type tps = {
    actions : GenericClickEvent[]
}
export default function TestPlanSearch(props: tps) {
    const [testPlanList, setTestPlanList] = useState<TestPlan[]>([])

    const [state, doSearch, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const testPlanId = formData.get('testPlanId') as string
            const op: StatusOperation = {
                status: false,
                message: '',
                statusType: 'error',
                id: 'searchTestPlan'
            }
            
            if (testPlanId) {
                const id = parseInt(testPlanId)
                if (isNaN(id) || id <= 0) {
                    return validationError('searchTestPlan', 'Invalid Test Plan ID')
                }
                const result = await get(id)
                if (result.status && result.data) {
                    setTestPlanList([result.data])
                    return updateOpSuccess(op, `Test Plan ${id} found`)
                }
                return op.message = `Test Plan ${id} not found`, op
            }
            
            if (!formData.has('testPlanName')) {
                return validationError('searchTestPlan', 'Please provide at least Test Plan ID or Name to search')
            }
            
            const name = formData.get('testPlanName') as string
            
            if (name.trim().length === 0) {
                return validationError('searchTestPlan', 'Test Plan Name cannot be empty')
            }

            const results = await search({ name: name.trim() })
            setTestPlanList(results)
            return updateOpSuccess(op, `Found ${results.length} test plans`)
        },
        blankStatus('searchTestPlan')
    )

    return <>
        <div>
            <Form action={doSearch}>
                <fieldset>
                    <FormInputField label="Test Plan ID" name="testPlanId" type="number" step={1} />
                    <FormInputField label="Name" name="testPlanName" />
                </fieldset>
                <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Search' }]} />
            </Form>
        </div>
        <TestPlanTable actions={props.actions} plans={testPlanList} />
    </>
}

type tpr = {
    plan: TestPlan
    actions: GenericClickEvent[]
}
const TestPlanRow = (props: tpr) => {
    const testPlanId = props.plan.id
    const path = "/kiwi/plan?id="+testPlanId
    
    return <tr>
        <td className="numeric">
            <Link href={path} style={{padding:'4px'}}>{testPlanId}</Link>
        </td>
        <td className="textual">{props.plan.name}</td>
        <td className="link">
            <Link href={path}>View Plan</Link>
            { props.actions.map(action => (
                <button key={action.buttonText} style={{marginLeft:'8px'}} onClick={() => action.callback(props.plan)}>
                    {action.buttonText}
                </button>
            )) }
        </td>
    </tr>
}

type tpt = {
    plans: TestPlan[]
    actions: GenericClickEvent[]
}

export const TestPlanTable = (props: tpt) => {
    return <DynamicTable headers={['ID', 'Name', 'Link']}>
        {props.plans.map(plan => <TestPlanRow key={plan.id} plan={plan} actions={props.actions} />)}
    </DynamicTable>
}