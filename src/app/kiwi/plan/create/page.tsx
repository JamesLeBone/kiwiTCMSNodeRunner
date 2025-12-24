'use server'
import TestPlanCreate from './TestPlanCreate'

import { fetchList as fetchProductList } from '@server/kiwi/Product'

export async function generateMetadata(props : NextPageProps) {
    const id = (await props.params).id
    const metaData = {title: process.env.APP_TITLE + ` - Create new Test Plan`}
    return metaData
}

export default async function PlanPage(params: NextPageProps) {
    const products = await fetchProductList()

    return <>
        <TestPlanCreate products={products} />
    </>
}
