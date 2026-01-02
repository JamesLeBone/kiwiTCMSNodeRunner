'use client'
import { useState, useEffect } from 'react';

import { ComponentSection } from '@/components/ComponentSection'
import { FormFieldAlternating } from '@/components/FormField'
import Form from 'next/form'
import Link from 'next/link';
import { useActionState } from 'react'
import { FormInputField, FormActionBar, validationError, blankStatus } from '@/components/FormActions'

import {  ProductWithClassificationName, create, fetchClassifications } from '@server/kiwi/Product'

type AddProductFormProps = {
    addProduct: (p: ProductWithClassificationName) => void
}

import './productCard.css'

type pcprops = {
    product: ProductWithClassificationName
    setActiveProductId: () => void
    isActive?: boolean
}
export function ProductCard(props : pcprops) {
    const productId = props.product.id

    const setActiveProduct = (e: React.MouseEvent<HTMLAnchorElement>) => {
        window.localStorage.setItem('activeProduct', productId+'')
        props.setActiveProductId()
        e.preventDefault()
    }

    const { name, description, classificationName } = props.product
    let className = 'Well ProductCard'
    if (props.isActive) {
        className += ' ProductCard-Active'
    }

    return <div className={className}>
        <div className='padded'>
            <h3>{name}</h3>
            <p className="card-text">{description}</p>
            <i>{classificationName}</i>
        </div>
        <footer>
            <Link href={'/kiwi/product?id='+productId}>Edit</Link>
            <Link className='addProduct' onClick={setActiveProduct} href={`/kiwi/product`}>Load</Link>
        </footer>
    </div>
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
            if (op.status && op.data) {
                // If a string was entered for classification, update local options
                const isNewClassification = typeof classifications[classification] === 'undefined'
                if (isNewClassification) {
                    const classificationId = op.data.classification + ''
                    setClassifications( prev => {
                        const newCls = { ...prev }
                        newCls[classificationId] = classification
                        return newCls
                    })
                }
                addProduct(op.data)
            }
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

type pprops = {
    productList: ProductWithClassificationName[]
    setActiveProductId: (id:number) => void
    activeProductId?: number
}
export function Products(props: pprops) {
    const styles = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, 300px)',
        justifyContent: 'start',
        gap: '18px'
    }
    return <div style={styles}>
        { props.productList.map( (product) => {
            const isActive = (props.activeProductId && props.activeProductId == product.id) ? true : false
            const key = product.id + '_ ' + (isActive ? 'active' : 'inactive')
            return <ProductCard key={key} isActive={isActive} product={product} setActiveProductId={() => props.setActiveProductId(product.id)} /> 
        }) }
    </div>
}

export default function ManageProducts({productList} :{productList: ProductWithClassificationName[]}) {
    const [products, setProducts] = useState<ProductWithClassificationName[]>(productList)
    const [activeProduct, setActiveProduct] = useState<ProductWithClassificationName|null>(null)

    useEffect( () => {
        const storedProductId = window.localStorage.getItem('activeProduct')
        if (!storedProductId) return
        const pid = Number.parseInt(storedProductId)
        if (isNaN(pid)) return
        setActiveProductId( pid )
    }, [] )

    const setActiveProductId = (id: number) => {
        const activeProduct = products.find( p => p.id === id ) ?? null
        // console.debug('Setting active product to', activeProduct)
        setActiveProduct( activeProduct )
    }

    return <div>
        <Products productList={products} activeProductId={activeProduct?.id} setActiveProductId={setActiveProductId} />
        <AddProductForm addProduct={(p: ProductWithClassificationName) => {
            setProducts([...products, p])
            setActiveProduct(p)
        }} />
    </div>
}
