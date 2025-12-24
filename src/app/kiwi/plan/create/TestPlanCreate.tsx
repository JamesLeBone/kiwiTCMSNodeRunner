'use client'
import './testPlanCreate.css'

import { useState, useActionState, useEffect } from 'react';
import { formDataValue } from '@lib/Functions'
import Form from 'next/form'
import Link from 'next/link'

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { DateDisplay } from '@/components/DateDisplay'
import { MarkdownSection } from '@/components/MarkDownDisplay'
import { FormInputField, FormActionBar, validationError, blankStatus } from '@/components/FormActions'

import { create, get, update, TestPlan } from '@server/kiwi/TestPlan'
import type { Product, ProductWithClassificationName, Version } from '@server/kiwi/Product'
import { getProductVersions } from '@server/kiwi/Product'
import ProductSelection, { VersionSelection } from '@/components/kiwi/Products'
import BooleanInput from '@/components/BooleanInput';

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
    products: ProductWithClassificationName[]
}
export default function TestPlanCreate(props: tpeprops) {
    const {products} = props
    const textState = useState('')

    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const name = formDataValue.getString(formData, 'name')
            const productId = formDataValue.getNumber(formData, 'product')
            const isActive = formDataValue.getBoolean(formData, 'isActive')
            const text = formDataValue.getString(formData, 'text')
            const parentId = formDataValue.getOptionalNumber(formData, 'parentId')
            const productVersion = formDataValue.getNumber(formData, 'version')

            if (!productId || productId <= 0) {
                return validationError('createPlan', 'Please select a valid product')
            }
            if (!productVersion || productVersion <= 0) {
                return validationError('createPlan', 'Please select a valid product version')
            }

            const op = await create({
                name,
                product: {
                    id: productId,
                    version: productVersion
                },
                isActive,
                text,
                parent: parentId
            })
            if (op.status && op.data) {
                const testPlanId = op.data.id
                window.location.href = '/kiwi/plan?id=' + testPlanId
            }
            return op
        },
        blankStatus('updatePlan')
    )

    const [versions,setVersions] = useState<Version[]>([])
    const setProductId = async (id:number) => {
        const result = await getProductVersions(id)
        if (result.status && result.data) {
            setVersions(result.data)
        } else {
            console.warn(result)
        }
    }

    useEffect( () => {
        if (products.length > 0) {
            setProductId(products[0].id)
        }
    }, [])

    const actions = 'Create'
        // { label: "Create" },
        // { label: "Reformat name" }
    const [isActive, setIsActive] = useState(true)

    return <div>
        <ComponentSection header={`Test Plan Creation`} id="testPlanCreateSection">
            <Form action={formAction}>
                <fieldset id="productSelectionFieldset">
                    <ProductSelection products={products} setProductId={setProductId} />
                    <VersionSelection versions={versions} />
                </fieldset>
                <fieldset id="basicInfoFieldset">
                    <FormInputField label="Name" name="name" required={true} maxLength={255} />
                    <FormField label='Active'>
                        <BooleanInput name='isActive' checked={isActive} setVal={setIsActive} values={['Active', 'Inactive']} />
                    </FormField>
                    <FormInputField label="Parent Plan ID" name="parentId" type="number" />
                </fieldset>
                <fieldset>
                    <MarkdownSection name="text" label="Description" state={textState} open={true} />
                </fieldset>
                <FormActionBar pendingState={isPending} state={state} actions={actions} />
            </Form>
        </ComponentSection>
    </div>
}
