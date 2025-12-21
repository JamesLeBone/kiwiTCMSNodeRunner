'use client'
import { ComponentSection } from '@/components/ComponentSection'
import Form from 'next/form'
import { useActionState, useEffect, useState } from 'react'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import { CaseStatus } from '@server/kiwi/TestCaseStatus'
import type { ProductWithClassificationName } from '@server/kiwi/Product'

import * as TestCase from '@server/kiwi/TestCase'
import { Category, listByProduct } from '@server/kiwi/Category'
import { FormField } from '@/components/FormField'
import { Selection, SelectionDetailed, selectionOption } from '@/components/Selection'

import { listPriorities  } from '@server/kiwi/Priority'

declare type CreateTestCaseProps = {
    statuses: CaseStatus[]
    products: ProductWithClassificationName[]
}
declare type psp = {
    products: ProductWithClassificationName[]
    value?: number
    setProductId: (id: number) => void
}

const getBooleanFormValue = (formData: FormData, key: string) => {
    const val = formData.get(key) as string
    // Boolean input uses 'true' and 'false' but let's be flexible
    return ['on','true',1].includes(val) ? true : false
}
const getNumericFormValue = (formData: FormData, key: string) => {
    const val = formData.get(key) as string
    return Number.parseInt(val)
}
const getFormValues = (formData: FormData) => {
    const summary = formData.get('summary') as string
    const text = formData.get('text') as string
    const isAutomated = getBooleanFormValue(formData, 'isAutomated') as boolean
    const caseStatus = getNumericFormValue(formData, 'caseStatus') as number
    const category = getNumericFormValue(formData, 'category') as number
    const priority = getNumericFormValue(formData, 'priority') as number
    const product = getNumericFormValue(formData, 'product') as number
    return { summary, text, isAutomated, caseStatus, category, priority, product }
}

function ProductSelection({products, value, setProductId} : psp) {
    const productOptions = products.reduce( (acc, product) => {
        acc[product.id+''] = product.name
        return acc
    }, {} as Record<string,string> )

    const stringValue = value ? value.toString() : undefined
    const oc = (value: string|number) => {
        if (typeof value === 'string') value = parseInt(value)
        setProductId( value )
    }
    
    return <FormField label="Product">
        <Selection name="product" required={true} options={productOptions} value={stringValue} onChange={oc} />
    </FormField>
}

function CategorySelection({options}: {options: selectionOption[]}) {
    return <FormField label="Category">
        <SelectionDetailed name="category" required={true} options={options} />
    </FormField>
}

function PrioritySelection({options}: {options: selectionOption[]}) {
    return <FormField label="Priority">
        <SelectionDetailed name="priority" required={true} options={options} />
    </FormField>
}

const defaultPriorityOptions: selectionOption[] = [
    { value: '1', label: 'P1' },
    { value: '2', label: 'P2' },
    { value: '3', label: 'P3' },
    { value: '4', label: 'P4' },
    { value: '5', label: 'P5' }
]

export default function CreateTestCase({statuses, products}: CreateTestCaseProps) {
    const operationId = 'createTestCase'
    // Convert the list of statuses into options for the selection set
    const statusOptions = statuses.reduce( (acc, status) => {
        acc[status.id+''] = status.description
        return acc
    }, {} as Record<string,string> )

    // Initial hydration occurs server-side
    // so we have to guard access to window, to access localStorage
    const activeProduct = (typeof window !== 'undefined') ? window.localStorage.getItem('activeProduct') : null
    const activeProductId = activeProduct ? parseInt(activeProduct) : undefined
    const [productId, setProductId] = useState(activeProductId)
    const [categoryOptions, setCategoryOptions] = useState<Record<number, Category[]>>({})
    const [categoryOptionSet, setCategoryOptionSet] = useState<selectionOption[]>([])

    const [priorityList, setPriorityList] = useState<selectionOption[]>(defaultPriorityOptions)

    useEffect( () => {
        listByProduct().then( categories => setCategoryOptions(categories) )
        listPriorities(true).then( priorities => {
            const pl = priorities.map( p => {
                return { value: p.id.toString(), label: p.value }
            })
            setPriorityList(pl)
        })
    }, [] )

    useEffect( () => {
        const categories = categoryOptions[productId ?? -1] ?? []
        const options = categories.map( c => ({ value: c.id.toString(), label: c.name }) )
        setCategoryOptionSet( options )
    }, [categoryOptions, productId] )

    const [state, createTestCase, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const values = getFormValues(formData)
            if (!values.product && !activeProductId) {
                return validationError(operationId, 'Product selection is required')
            }
            const productId = values.product ? values.product : activeProductId
            if (!productId) {
                return validationError(operationId, 'Product selection is required')
            }

            const sendData = {
                ...values,
                // securityGroupId: securityGroup,
                arguments: {}
            }
            // Category is required.

            const op = await TestCase.create(sendData)
            if (op.data) {
                const testCase = op.data
            }
            return op
        },
        blankStatus(operationId)
    )

    return <ComponentSection header={'Create Test Case'}>
        <Form action={createTestCase}>
            <fieldset style={{display:'grid',gridTemplateColumns:'1fr auto auto'}}>
                <FormInputField label="Summary" name="summary" required={true} />
                <FormInputField label="Automated?" name="isAutomated" type="checkbox" />
                <FormSelection label="Status" name="caseStatus" required={true} options={statusOptions} />
                <ProductSelection products={products} value={productId} setProductId={setProductId} />
                <CategorySelection options={categoryOptionSet} />
                <PrioritySelection options={priorityList} />
            </fieldset>
            <fieldset>
                <FormInputField label="Description" name="text" type="textarea" required={true} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[ { label: 'Create' } ]} />
        </Form>
    </ComponentSection>
}
