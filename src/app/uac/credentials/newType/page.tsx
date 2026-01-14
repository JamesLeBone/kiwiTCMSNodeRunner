
import { fetchList } from '@server/kiwi/Product'
import CreateCredentialType, { SelectionOption } from './CreateCredentialType'
import { listByProduct } from '@server/kiwi/Category'

export async function generateMetadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Create Credential Type`
    }
}

export default async function Page() {

    const products = await fetchList()
    if (products.length == 0) {
        return <div>
            <h2>Failed to load product list</h2>
        </div>
    }
    const selectionOptions: SelectionOption[] = []
    
    const selectionDetails  = await Promise.all(products.map( async (product) => {
        const categories = await listByProduct(product.id)
        const categoryList = categories[product.id] ? categories[product.id] : []
        selectionOptions.push({
            productId: product.id,
            productName: product.name,
            categories: categoryList
        })
    }))

    return <main>
        <CreateCredentialType selectionOptions={selectionOptions} />
    </main>
}
