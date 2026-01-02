'use server'
import ManageProducts from './ManageProducts'
import * as Products from '@server/kiwi/Product'
import { redirect } from 'next/navigation'
import EditProduct from './EditProduct'

export async function generateMetadata(params: NextPageProps) {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Products`
    }
}

async function AllProducts() {
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

export default async function ProductPage(params: NextPageProps) {
    const searchParams = await params.searchParams
    if (!searchParams || !searchParams.id) return <AllProducts />
    const productId = Number.parseInt(searchParams.id as string)
    if (isNaN(productId)) return <AllProducts />

    const [ product, classifications, versions ] = await Promise.all([
        Products.fetch(productId),
        Products.fetchClassifications(),
        Products.fetchProductVersions(productId)
    ])
    .catch( e => {
        console.error('Failed to fetch product data', e)
        return [ null, [], [] ] as [null, Products.Classification[], Products.Version[]]
    })
    if (!product) {
        console.warn('Product not found, redirecting to /kiwi/product')
        redirect('/kiwi/product')
    }
    // console.debug('Editing product', product, 'Classifications:', classifications)

    return <EditProduct product={product} classifications={classifications} versions={versions} />
}