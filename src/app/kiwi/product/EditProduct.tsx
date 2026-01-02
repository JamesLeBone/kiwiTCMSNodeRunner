'use client'
import { useState, useActionState, useEffect } from 'react'
import type { ProductWithClassificationName, Classification } from "@server/kiwi/Product"
import * as Product from '@server/kiwi/Product'
import Form from 'next/form'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection, FormAction } from '@/components/FormActions'
import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { formDataValue } from '@lib/Functions'
import { FormFieldAlternating } from '@/components/FormField'
import Card from '@/components/Card'
import ProductVersions from './ProductVersions'

const getFormatClassificationOptions = (classifications: Classification[]) => {
    return classifications.reduce((acc, cls) => {
        acc[cls.id + ''] = cls.name
        return acc
    }, {} as Record<string, string>)
}

type productAcive = null | number

type editParams = {
    product: ProductWithClassificationName
    classifications: Classification[]
    versions: Product.Version[]
}
export default function EditProduct(params: editParams) {
    const product = params.product
    const id = product.id
    const [classifications, setClassifications] = useState(getFormatClassificationOptions(params.classifications))

    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {

            const action = formDataValue.getString(formData,'action')
            if (action === 'Set Active') {
                window.localStorage.setItem('activeProduct', product.id+'')
                setIsActive( product.id )
                const op = blankStatus('setActiveProduct')
                op.status = true
                op.message = 'Product set as active'
                op.statusType = 'success'
                return op
            }

            const name = formDataValue.getString(formData, 'name')
            const description = formDataValue.getString(formData, 'description', '')
            const classification = formDataValue.getString(formData, 'classification')
            const scriptPrefix = formDataValue.getString(formData, 'scriptPrefix', '')

            if (!name || name.trim().length === 0) {
                return validationError('updateProduct', 'Product name is required')
            }

            const result = await Product.updateProduct(
                id,
                name, 
                description, 
                classification,
                scriptPrefix
            )
            if (result.status && result.data) {
                // If a string was entered for classification, update local options
                const isNewClassification = typeof classifications[classification] === 'undefined'
                if (isNewClassification) {
                    const classificationId = result.data.classification + ''
                    setClassifications( prev => {
                        const newCls = { ...prev }
                        newCls[classificationId] = classification
                        return newCls
                    })
                }
            }
            
            return result
        },
        blankStatus('updateProduct')
    )

    const [isActive, setIsActive] = useState<productAcive>( null )
    useEffect( () => {
        if (typeof window === 'undefined') return
        const activeProductId = window.localStorage.getItem('activeProduct')
        if (activeProductId && parseInt(activeProductId) === product.id) {
            setIsActive( product.id )
        }
    }, [product.id])

    const actions = [
        { label: 'Update' },
        { label: 'Set Active' }
    ]

    return <div>
        <Card header="Information">
            <p>Updating products is a management operation that does not exist in the standard Kiwi TCMS.</p>
        </Card>
        <ComponentSection header='Product Edit' style={{display:'grid'}}>
            <Form action={formAction}>
                <fieldset>
                    <FormField label='Product Id'>{id}</FormField>
                </fieldset>
                <fieldset>
                    <FormInputField label="Name" name="name" required={true} value={product.name} />
                    <FormFieldAlternating label="Classification" title='What type of product is this?' name="classification" required={true} options={classifications} />
                    <FormInputField label="Description" name="description"  value={product.description} type="textarea" />
                    <FormInputField label="Script Prefix" title="Prefix script executions with this" name="scriptPrefix" value={product.scriptPrefix ?? ''} type="textarea" />
                </fieldset>
                <FormActionBar pendingState={isPending} state={state} actions={actions} />
            </Form>
        </ComponentSection>
        
        <ProductVersions productId={product.id} versions={params.versions} />
    </div>
}
