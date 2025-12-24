'use client'

import { useState, useActionState } from 'react';
import Link from 'next/link'
import Form from 'next/form'

import { DynamicTable } from '@/components/DynamicTable'
import { ComponentSection } from '@/components/ComponentSection'
import { FormInputField, FormActionBar, blankStatus, validationError } from '@/components/FormActions'

import { TestPlan, get, search } from '@server/kiwi/TestPlan'
import { StatusOperation } from '@lib/Operation';

type callbacks = {
    addPlan? : (plan: TestPlan) => void
}
export default function TestPlanSearch(callbacks: callbacks) {
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
                    return op.message = `Test Plan ${id} found`, op.status = true, op
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
            op.status = true, op.message = `List obtained - ${results.length} items`, op.statusType = 'info'
            return op
        },
        blankStatus('searchTestPlan')
    )

    const checkCallbacks = (plan: TestPlan) => {
        if (callbacks.addPlan) {
            callbacks.addPlan(plan)
        }
    }

    return <ComponentSection header="Test Plan Search" className={['fill']}>
        <div>
            <Form action={doSearch}>
                <fieldset style={{display:'grid',gridTemplateColumns:'200px'}}>
                    <FormInputField label="Test Plan ID" name="testPlanId" type="number" step={1} />
                </fieldset>
                <fieldset style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, 200px)'}}>
                    <FormInputField label="Name" name="testPlanName" />
                </fieldset>
                <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Search' }]} />
            </Form>
        </div>
        <DynamicTable headers={['ID', 'Name', 'Link']}>
            {testPlanList.map(plan => <TestPlanRow key={plan.id} plan={plan} onSelect={() => checkCallbacks(plan)} />)}
        </DynamicTable>
    </ComponentSection>
}

type tpt = {
    plans: TestPlan[]
}

export const TestPlanTable = (props: tpt) => {
    return <DynamicTable headers={['ID', 'Name', 'Link']}>
        {props.plans.map(plan => <TestPlanRow key={plan.id} plan={plan} />)}
    </DynamicTable>
}

type tpr = {
    plan: TestPlan
    onSelect?: () => void
}
const TestPlanRow = (props: tpr) => {
    const testPlanId = props.plan.id
    const path = "/kiwi/plan/"+testPlanId
    
    return <tr>
        <td className="numeric">
            <Link href={path} style={{padding:'4px'}}>{testPlanId}</Link>
        </td>
        <td className="textual">{props.plan.name}</td>
        <td className="link">
            <Link href={path}>Link</Link>
            { props.onSelect ? <button style={{marginLeft:'8px'}} onClick={props.onSelect}>Select</button> : null }
        </td>
    </tr>
}
