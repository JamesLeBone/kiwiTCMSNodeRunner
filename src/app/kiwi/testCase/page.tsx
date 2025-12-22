'use server'
import * as TestCaseStatus from '@server/kiwi/TestCaseStatus'
// import { fetchList as fetchProductList } from '@server/kiwi/Product'
import { getDetail } from '@server/kiwi/TestCase'
import TestCaseLineage from './TestCaseLineage'
import TestCaseSearch from './search/TestCaseSearch'
import { kiwiBaseUrl } from '@lib/Functions'

import TestCaseEdit from './TestCaseEdit'
import TestCaseComments from './Comments'

const metaData = {
    title: 'Test Cases'
}
export async function generateMetadata(props : NextPageProps) {
    const id = (await props.params).id
    if (id) {
        metaData.title = process.env.APP_TITLE + ` - Test case #${id}`
    } else {
        metaData.title = process.env.APP_TITLE + ` - Test Cases`
    }
    return metaData
}

// Path example: /kiwi/testCase/?id=123

export default async function TestCase(params: NextPageProps) {
    const searchParams = await params.searchParams
    if (!searchParams || !searchParams.id) return <TestCaseSearch />
    
    const testCaseId = Number.parseInt(searchParams.id as string)
    if (isNaN(testCaseId)) return <TestCaseSearch />
    
    // uses our server.
    const response = await getDetail(testCaseId)
    if (!response.status) {
        return <div>
            <p>Test Case {testCaseId}: {response.message}</p>
            <TestCaseSearch />
        </div>
    }
    if (!response.data) {
        return <div>
            <p>Test Case {testCaseId}: No data received</p>
            <TestCaseSearch />
        </div>
    }
    const statuses = await TestCaseStatus.fetchAll()
    // const products = await fetchProductList()

    const kiwiUrl = kiwiBaseUrl()+'/case/'

    return <>
        <TestCaseEdit details={response.data} statuses={statuses} kiwiUrl={kiwiUrl} />
    </>
}


        // <TestCaseComments id={testCaseId} comments={response.data.comments || []} />
        // <TestCaseLineage testCaseId={testCaseId} script={response.data.testCase.script} children={response.data.children || []} />