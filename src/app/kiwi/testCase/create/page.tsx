'use server'
import CreateTestCase from './CreateTestCase'

import * as TestCaseStatus from '@server/kiwi/TestCaseStatus'
import { fetchList as fetchProductList } from '@server/kiwi/Product'

export const generateMetadata = async (props : NextPageProps) => {
    return { title: process.env.APP_TITLE + ' - Create Test Case' }
}

export default async function TestCase(params: NextPageProps) {
    const statuses = await TestCaseStatus.fetchAll()
    const products = await fetchProductList()

    return <div>
        <CreateTestCase statuses={statuses} products={products} />
    </div>
}
