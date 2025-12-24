'use client'

import { FormField } from '@/components/FormField'
import { Selection } from '@/components/Selection'
import { ProductWithClassificationName, fetchProductVersions } from '@server/kiwi/Product'
import type { Version } from '@server/kiwi/Product'
import { useEffect, useState } from 'react'

type psp = {
    products: ProductWithClassificationName[]
    value?: number
    setProductId?: (id: number) => void
}
export default function ProductSelection(props : psp) {
    const [productId,setProductId] = useState<number | undefined>(props.value)

    const productOptions = props.products.reduce( (acc, product) => {
        acc[product.id+''] = product.name
        return acc
    }, {} as Record<string,string> )

    const oc = (value: string|number) => {
        if (typeof value === 'string') value = parseInt(value)
        // Check if setProductId is defined before calling it
        props.setProductId && props.setProductId( value )
        setProductId(value)
    }
    
    return <FormField label="Product">
        <Selection name="product" required={true} options={productOptions} value={productId} onChange={oc} />
    </FormField>
}

type vs = {
    versions: Version[]
    onChange?: (id: number) => void
}
export function VersionSelection(props: vs) {
    const versionOptions = props.versions.reduce( (acc, version) => {
        acc[version.id+''] = version.value
        return acc
    }, {} as Record<string,string> )

    const changeEvent = (value: string|number) => {
        if (props.onChange) props.onChange(Number.parseInt(value+''))
    }

    const nOptions = props.versions.length
    if (nOptions === 0) {
        return <FormField label="Version">
            <em>No versions available for selected product</em>
        </FormField>
    } else if (nOptions === 1) {
        return <FormField label="Version">
            <em>{props.versions[0].value}</em>
            <input type='hidden' name='version' value={props.versions[0].id} />
        </FormField>
    }

    return <FormField label="Version">
        <Selection name="version" required={false} options={versionOptions} onChange={changeEvent} />
    </FormField>
}
