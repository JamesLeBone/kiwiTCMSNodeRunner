'use server'
import ManageProducts from './ManageProducts'
import * as Products from '@server/kiwi/Product'

export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Products`
    }
}

export default async function ProductPage() {
    const getProductList = await Products.getList()
    
    if (!getProductList.status || !getProductList.data) {
        return <div>
            <h2>Failed to load product list</h2>
            <p>{getProductList.message}</p>
        </div>
    }


    return <div>
        <ManageProducts productList={getProductList.data}  />
    </div>
}