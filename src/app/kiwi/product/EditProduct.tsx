'use client'
import { useState, useActionState, useEffect } from 'react'
import Form from 'next/form'
import Link from 'next/link'

import type { ProductWithClassificationName, Classification } from "@server/kiwi/Product"
import * as Product from '@server/kiwi/Product'

import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection, FormAction } from '@/components/FormActions'
import { ComponentSection } from '@/components/ComponentSection'
import { FormField, FormFieldAlternating } from '@/components/FormField'
import Card from '@/components/Card'

import { formDataValue } from '@lib/Functions'
import ProductVersions from './ProductVersions'
import { Category } from '@server/kiwi/Category'
import { DynamicTable } from '@/components/DynamicTable'

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
    categories: Category[]
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

            if (!name || name.trim().length === 0) {
                return validationError('updateProduct', 'Product name is required')
            }

            const result = await Product.updateProduct(
                id,
                name, 
                description, 
                classification
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

    const actions: FormAction[] = [
        { label: 'Update' },
        { label: 'Select as active product', title: 'Set this product as the product you are currently working on' }
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
                </fieldset>
                <fieldset style={{display:'block'}}>
                    <FormInputField label="Description" name="description" value={product.description} type="textarea" />
                </fieldset>
                <FormActionBar pendingState={isPending} state={state} actions={actions} />
            </Form>
        </ComponentSection>
        
        <ProductVersions productId={product.id} versions={params.versions} />

        <CategoriesComponent categories={params.categories} productId={product.id} />
    </div>
}

function CategoryRow(props: {category: Category, productId: number}) {
    const category = props.category
    const url = `/kiwi/category/${category.id}/edit`

    return <tr>
        <td>{category.id}</td>
        <td>{category.name}</td>
        <td>{category.description}</td>
        <td>
            <Link href={url}>Edit</Link>
        </td>
    </tr>
}

function CategoriesComponent(props: {categories: Category[], productId: number}) {
    return <ComponentSection header="Test Categories">
        <DynamicTable headers={['ID', 'Name', 'Description', 'Edit']} >
            { props.categories.map( (category) => 
                <CategoryRow key={category.id} category={category} productId={props.productId} />
            ) }
        </DynamicTable>
    </ComponentSection>
}
