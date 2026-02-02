'use server'
import { getCredentialType } from '@server/lib/CredentialTypes'
import { fetchList, getList } from '@server/kiwi/Product'
import { listByProduct } from '@server/kiwi/Category'

import EditType from './EditType'

import type { CategorySelectionOption } from '@lib/types'

import { redirect } from 'next/navigation'

export async function generateMetadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Credentials`
    }
}

export default async function Page(props: NextPageProps) {
    const id = (await props.params).id
    if (Array.isArray(id)) redirect('/uac/credentials')
    const credentialTypeId = parseInt(id)
    if (Number.isNaN(credentialTypeId)) redirect('/uac/credentials')

    const type = await getCredentialType(credentialTypeId)
    if (!type) redirect('/uac/credentials')

    const productRequest = await getList()
    if (!productRequest.status || !productRequest.data) {
        return <div>
            <h2>Failed to load product list</h2>
        </div>
    }
    if (productRequest.data.length == 0) {
        return <div>
            <h2>Failed to load product list</h2>
        </div>
    }
    const products = productRequest.data
    const selectionOptions: CategorySelectionOption[] = []
    
    await Promise.all(products.map( async (product) => {
        const categories = await listByProduct(product.id)
        const categoryList = categories[product.id] ? categories[product.id] : []
        selectionOptions.push({
            productId: product.id,
            productName: product.name,
            categories: categoryList
        })
    }))


    return <EditType type={type} selectionOptions={selectionOptions} />
}
