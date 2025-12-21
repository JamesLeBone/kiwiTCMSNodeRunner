'use server'
import CreateTestCase from './CreateTestCase'

import * as TestCaseStatus from '@server/kiwi/TestCaseStatus'
import { fetchList as fetchProductList } from '@server/kiwi/Product'
import TestCaseSearch from './TestCaseSearch'

export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - New Test Case`
    }
}

export default async function TestCase() {
    const statuses = await TestCaseStatus.fetchAll()
    const products = await fetchProductList()

    return <div>
        <TestCaseSearch />
        <CreateTestCase statuses={statuses} products={products} />
    </div>
}