'use client'

import type { AmalgomatedComponent }    from '@server/kiwi/Component'
import type { TestPlan }                from '@server/kiwi/TestPlan'
import type { TestExecution }           from '@server/kiwi/Execution'
import { TestCaseDetail, addComponent, removeComponent } from '@server/kiwi/TestCase'

import TestCaseLineage from './TestCaseLineage'

import { TabbedComponentSection }          from '@/components/ComponentSection'
import { TagList }                         from '@/components/kiwi/Tags'
import TestPlanSearch, { TestPlanTable }   from '@/components/kiwi/TestPlanSearch'
import { ComponentList, ComponentSearch }  from '@/components/kiwi/Component'
import KiwiComments                        from '@/components/kiwi/KiwiComments'
import { blankStatus,FormInputField,FormActionBar } from '@/components/FormActions'
// import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import { TypedOperationResult } from '@lib/Operation'
import { formDataValue }   from '@lib/Functions'
import { useMessage } from '@/components/ServerResponse'

import { useState,useActionState } from 'react'
import Form                        from 'next/form'

type TestCaseAttachmentsProps = {
    testCaseId: number
    details: TestCaseDetail
}
export default function TestCaseAttachments(props: TestCaseAttachmentsProps) {
    const tags = props.details.tags.map(t => t.name)
    const testCaseId = props.testCaseId
    const { testCase, components, plans, executions, children, comments } = props.details
    const productId = props.details.category?.productRecord?.id

    const tabs = [
        {id : 'components', label: 'Components', content: <ComponentSection productId={productId} testCaseId={testCaseId} components={components} />},
        {id : 'tags', label: 'Tags', content: <TagList tags={tags} entityType="TestCase" entityId={testCaseId} />},
        {id : 'plans', label: 'Test Plans', content: <TestPlanSection plans={plans} />},
        {id : 'executions', label: 'Test Executions', content: <TestExecutionSection executions={executions} />},
        {id : 'lineage', label: 'Lineage', content: <TestCaseLineage testCaseId={testCaseId} script={testCase.script} children={children} /> },
        {id : 'comments', label: 'Comments', content: <KiwiComments id={testCaseId} comments={comments} /> }
    ]

    return <TabbedComponentSection tabs={tabs} />
}

type ComponentAddProps = {
    addComponent: (componentName: string) => Promise<TypedOperationResult<AmalgomatedComponent>>
}
function ComponentAdd(props: ComponentAddProps) {
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const componentName = formDataValue.getString(formData, 'componentName')
            return props.addComponent(componentName)
        },
        blankStatus()
    )
    return <Form action={formAction}>
        <fieldset>
            <FormInputField label="Component Name" name="componentName" required={true} />
        </fieldset>
        <FormActionBar state={state} pendingState={isPending} actions='Add' />
    </Form>
}

type ComponentSectionProps = {
    productId?: number
    testCaseId: number
    components: Array<AmalgomatedComponent>
}
function ComponentSection(props: ComponentSectionProps) {
    const [associatedComponents, setAssociatedComponents] = useState<AmalgomatedComponent[]>(props.components)
    const msg = useMessage()

    const onRowClick = async (component: AmalgomatedComponent) => {
        // Avoid duplicates
        if (associatedComponents.find(c => c.id === component.id)) return
        const result = await addComponent(props.testCaseId, component.name, props.productId!)
        if (result.status && result.data) {
            setAssociatedComponents([...associatedComponents, result.data])
        }
        msg.statusResponse(result)
    }

    const addComponentToList = async (name: string) : Promise<TypedOperationResult<AmalgomatedComponent>> => {
        const componentName = name.trim()
        const result = await addComponent(props.testCaseId, componentName, props.productId!)
        if (result.status && result.data) {
            setAssociatedComponents([...associatedComponents, result.data])
        }
        return result
    }

    const listAction:GenericClickEvent = {
        buttonText: 'Remove',
        callback: async (data: any) => {
            const componentId = data.id as number
            const result = await removeComponent(props.testCaseId, componentId)
            if (result.status) {
                setAssociatedComponents(associatedComponents.filter(c => c.id !== componentId))
            }
            console.log('Remove component result', result)
            msg.statusResponse(result, false)
        }
    }

    if (!props.productId) {
        return <div>
            <p>Test case is not assigned to a category with a product.</p>
        </div>
    }

    return <div>
        {msg.message}
        <ComponentList componentList={associatedComponents} listActions={[listAction]} />
        <ComponentAdd addComponent={addComponentToList} />
        <ComponentSearch onRowClick={onRowClick} />
    </div>
}

type tpsProps = {
    plans: TestPlan[]
}
function TestPlanSection(props: tpsProps) {
    const [planList, setPlanList] = useState<TestPlan[]>(props.plans)
    const addPlan = (plan: TestPlan) => {
        setPlanList([...planList, plan])
    }

    return <div>
        <TestPlanTable plans={planList} />
        <TestPlanSearch addPlan={addPlan} />
    </div>
}

type tesProps = {
    executions: TestExecution[]
}
function TestExecutionSection(props: tesProps) {
    if (props.executions.length === 0) return <p>No executions found.</p>
    return <div>
        { props.executions.map(execution => 
            <div key={execution.id}>
                Execution #{execution.id} - Status: {execution.status}
            </div>
        ) }
    </div>
}
