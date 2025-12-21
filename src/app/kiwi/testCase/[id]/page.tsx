import TestCaseEdit from './TestCaseEdit'
import * as TestCase from '@server/kiwi/TestCase'
import { redirect } from 'next/navigation'
import * as TestCaseStatus from '@server/kiwi/TestCaseStatus'

// This only works on server components, on the client side you need to use useEffect to set document.title
const metadata = {
    title: 'Test Case Edit'
}

export async function generateMetadata(props : NextPageProps) {
    const id = (await props.params).id
    metadata.title = process.env.APP_TITLE + ` - Test case #${id}`
    return metadata
}


export default async function TestCasePage({params,searchParams} : NextPageProps) {
    const testCaseId = await params.then(r => r.id)

    if (testCaseId == null || Array.isArray(testCaseId)) redirect('/kiwi/testCase')
    const testCaseIdNum = Number.parseInt(testCaseId)
    if (isNaN(testCaseIdNum)) redirect('/kiwi/testCase')
    
    // uses our server.
    const response = await TestCase.getDetail(testCaseIdNum)
    if (!response.status) {
        return <div>Test Case {testCaseId}: {response.message}</div>
    }
    if (!response.data) {
        return <div>Test Case {testCaseId}: No data received</div>
    }
    const statuses = await TestCaseStatus.fetchAll()

    return <TestCaseEdit {...response.data} statuses={statuses} />
}

