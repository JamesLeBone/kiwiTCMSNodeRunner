'use server'
import { Products as ProductList } from './product/ManageProducts'
import * as Products from '@server/kiwi/Product'
import { redirect } from 'next/navigation'

export async function generateMetadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title}`
    }
}

export default async function Home({params, searchParams} : NextPageProps) {
    const getProductList = await Products.getList()
    if (!getProductList.status || !getProductList.data) {
        redirect('/kiwi/product')
    }

    return <main>
        <ProductList productList={getProductList.data} />
    </main>
}
