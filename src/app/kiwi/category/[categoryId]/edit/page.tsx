'use server'
import { fetch as fetchProduct } from '@server/kiwi/Product'
import { redirect } from 'next/navigation'
import { fetchCategory } from '@server/kiwi/Category'

import EditCategory from './EditCategory'

export async function generateMetadata(params: NextPageProps) {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Edit Category`
    }
}

const notFoundUrl = '/kiwi/product'

export default async function CategoryEditPage(params: NextPageProps) {
    const searchParams = await params.params
    if (!searchParams || !searchParams.categoryId) redirect(notFoundUrl)
    const categoryId = Number.parseInt(searchParams.categoryId as string)
    if (isNaN(categoryId)) redirect(notFoundUrl)

    const category = await fetchCategory(categoryId)
    if (!category) redirect(notFoundUrl)

    const productId = category.product
    if (isNaN(productId)) redirect(notFoundUrl)
    const product = await fetchProduct(productId)
    if (!product) {
        console.warn('Product not found, redirecting to /kiwi/product')
        redirect('/kiwi/product')
    }

    // console.debug('Editing category', category, 'for product', product)
    
    return <EditCategory category={category} productName={product.name} />
}