'use client'
import { useState, useEffect } from 'react';

import { ComponentSection } from '@/components/ComponentSection'
import { FormFieldAlternating } from '@/components/FormField'
import Link from 'next/link'
import Form from 'next/form'
import { useActionState } from 'react'
import { FormInputField, FormActionBar, validationError, blankStatus } from '@/components/FormActions'

import {  ProductWithClassificationName, create, fetchClassifications } from '@server/kiwi/Product'

import Card from '@/components/Card'

function ProductCard({product} : {product: ProductWithClassificationName}) {
    const isActive = (window) ? window.localStorage.getItem('activeProduct') === (product.id+'') : false

    const setActiveProduct = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        window.localStorage.setItem('activeProduct', product.id+'')
        window.location.href = '/kiwi'
    }

    const actions = <Link onClick={setActiveProduct} href={`/kiwi?setProduct=${product.id}`}>Load</Link>

    return <Card header={product.name} actions={actions} isActive={isActive}>
        <p className="card-text">{product.description}</p>
        <i>{product.classificationName}</i>
    </Card>
}

type AddProductFormProps = {
    addProduct: (p: ProductWithClassificationName) => void
}

function AddProductForm({addProduct} : AddProductFormProps) {
    const operationId = 'addProduct'
    const [classifications, setClassifications] = useState<Record<string, string>>({})

    useEffect( () => {  
        fetchClassifications()
        .then( cls => {
            const options = {} as { [key: string]: string }
            for (const c of cls) {
                const stringId = c.id+''
                options[stringId] = c.name
            }
            setClassifications(options)
        })
    }, [])

    const [state, formaction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const name = formData.get('name') as string
            const description = formData.get('description') as string
            const classification = formData.get('classification') as string

            if (!name || name.length === 0) return validationError(operationId, 'Product name is required')
            if (!description || description.length === 0) return validationError(operationId, 'Product description is required')

            // Call server to create product
            const op = await create(name, description, classification)
            if (op.status && op.data) addProduct(op.data)
            return op
        }
        , blankStatus(operationId)
    )

    return <ComponentSection header="Add New Product">
        <Form action={formaction}>
            <fieldset>
                <FormInputField label="Product Name" name="name" required={true} />
                <FormInputField label="Description" name="description" type="textarea" required={true} />
                <FormFieldAlternating label="Classification" title='What type of product is this?' name="classification" required={true} options={classifications} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{label:'Add Product'}]} />
        </Form>
    </ComponentSection>
}

export function Products({productList} :{productList: ProductWithClassificationName[]}) {
    return <div>
        { productList.map( (product) => <ProductCard key={product.id} product={product} /> ) }
    </div>
}

export default function ManageProducts({productList} :{productList: ProductWithClassificationName[]}) {
    return <div>
        <Products productList={productList} />
        <AddProductForm addProduct={(p: ProductWithClassificationName) => {
            productList.push(p)
        }} />
    </div>
}
