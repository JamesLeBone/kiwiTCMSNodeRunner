import TestCaseEdit from './TestCaseEdit.js'
import * as TestCase from '@server/kiwi/TestCase.js'
import * as Auth from '@server/Auth'

// This only works on server components, on the client side you need to use useEffect to set document.title
const metadata = {
    title: 'Test Case Edit'
}

export async function generateMetadata({ params, searchParams },parent) {
    const id = (await params).id
    metadata.title = `Test case #${id}`
    return metadata
}


export default async function TestCasePage({params,searchParams}) {
    const testCaseId = await params.then(r => r.id)

    if (testCaseId == null) {
        return <div>Test Case ID is required</div>
    }

    const currentUser = await Auth.currentUser()
    
    // console.debug('Current user',currentUser)
    
    // uses our server.
    const response = await TestCase.getDetail(testCaseId)
    if (!response.status) {
        return <div>Test Case {testCaseId}: {response.message}</div>
    }

    return <TestCaseEdit {...response.message} />
}

