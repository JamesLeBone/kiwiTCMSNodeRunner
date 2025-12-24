'use client'

import { useState, useActionState } from 'react';
import { formDataValue } from '@lib/Functions'
import Form from 'next/form'
import Link from 'next/link'

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { DateDisplay } from '@/components/DateDisplay'
import { MarkdownSection } from '@/components/MarkDownDisplay'
import { FormInputField, FormActionBar, validationError, blankStatus } from '@/components/FormActions'

import { DetailedTestPlan, get, update } from '@server/kiwi/TestPlan'

type upp = {
    currentPlanId: number
    value: number | boolean
    onChange: (id: number, name: string) => void
}
function UpdateParentPlan({currentPlanId, value, onChange} : upp) {
    const [state, doUpdate, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const parentId = formDataValue.getNumber(formData, 'parentId')
            
            if (!parentId || parentId <= 0) {
                return validationError('updateParent', 'Please enter a valid parent plan ID')
            }

            const parentResult = await get(parentId)
            if (!parentResult.status || !parentResult.data) {
                return { ...parentResult, message: 'Parent plan not found' }
            }

            const updateResult = await update(currentPlanId, { parent: parentId })
            if (updateResult.status) {
                const { id, name } = parentResult.data
                onChange(id, name)
                return { ...updateResult, message: 'Parent plan updated' }
            }
            return updateResult
        },
        blankStatus('updateParent')
    )

    return <Form action={doUpdate}>
        <FormInputField label='Parent Plan' name="parentId" type="number" value={value ? value+'' : ''} />
        <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Set Parent Plan' }]} />
    </Form>
}

type plprops = {
    currentPlanId: number
    parent: {id:number, name:string} | false | null
}
function ParentLink({currentPlanId, parent} : plprops) {
    const [parentId, setParentId] = useState(parent ? parent.id : false)
    const [parentName, setParentName] = useState(parent ? parent.name : 'No Parent')

    const url = '/kiwi/plan/'+parentId
    const display = parentId ? <Link href={url}>{parentName}</Link> : parentName
    return <FormField label="Parent Test Plan">
        {display}
        <UpdateParentPlan currentPlanId={currentPlanId} value={parentId} onChange={(id,name) => {setParentId(id); setParentName(name)}} />
    </FormField>
}

type tpeprops = {
    testPlan: DetailedTestPlan
}
export default function TestPlanEdit({testPlan}: tpeprops) {
    const {id, createDate, parent, product} = testPlan
    const textState = useState(testPlan.text)
    const [name, setName] = useState(testPlan.name)
    const [isActive, setIsActive] = useState(testPlan.isActive)

    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const planName = formDataValue.getString(formData, 'name')
            const planText = formDataValue.getString(formData, 'text')
            const planIsActive = formDataValue.getBoolean(formData, 'isActive')
            
            if (!planName || planName.trim().length === 0) {
                return validationError('updatePlan', 'Plan name cannot be empty')
            }

            const result = await update(id, {
                name: planName,
                text: planText,
                isActive: planIsActive
            })
            
            if (result.status) {
                setName(planName)
                setIsActive(planIsActive)
            }
            
            return result
        },
        blankStatus('updatePlan')
    )

    const actions = [
        { label: "Update" },
        { label: "Reformat name" }
    ]

    return <div>
        <ComponentSection header={`Test Plan ${id}`}>
            <Form action={formAction}>
                <fieldset>
                    <ParentLink currentPlanId={id} parent={parent} />
                    <FormField label="Version">{product.version}</FormField>
                </fieldset>
                <fieldset>
                    <FormInputField label="Name" name="name" value={name} required={true} />
                    <FormField label="Created" className='no-input'>
                        <DateDisplay date={createDate} />
                    </FormField>
                    <FormInputField label="Is Active?" name="isActive" type="checkbox" value={isActive} />
                </fieldset>
                <MarkdownSection name="text" label="Text" state={textState} />
                <FormActionBar pendingState={isPending} state={state} actions={actions} />
            </Form>
        </ComponentSection>
    </div>
}
