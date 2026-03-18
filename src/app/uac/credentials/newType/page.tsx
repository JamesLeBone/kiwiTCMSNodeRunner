
import { fetchList } from '@server/kiwi/Product'
import CreateCredentialType from './CreateCredentialType'

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

    return <main>
        <CreateCredentialType />
    </main>
}
