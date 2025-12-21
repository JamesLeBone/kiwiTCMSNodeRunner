import TestRunEdit from './TestRunEdit.js'
import * as conn from '@server/kiwi/TestRun'

// This only works on server components, on the client side you need to use useEffect to set document.title
const metadata = {
    title: 'Test Run Edit'
}

export async function generateMetadata({ params, searchParams },parent) {
    const id = (await params).id
    metadata.title = `Test Run Edit - ${id}`
    conn.get(id)
        .then(response => {
            if (response.status) {
                metadata.title += ' - ' + response.summary
                return
            }
            metadata.title += ' - Not found.'
        })
    return metadata
}

export default async function TestRunPage({params,searchParams}) {
    const testRunid = (await params).id ?? null

    if (testRunid == null) {
        return <div>Test Run ID is required</div>
    }

    // uses our server.
    const response = await conn.get(testRunid)
    if (!response.status) {
        return <div>Test Run {testRunid}: {response.message}</div>
    }

    // const testPlanId = response.message.plan.value

    const executions = await conn.getCases(testRunid)
        .then(r => r.message)

    return <TestRunEdit testRun={response.message} executions={executions} />
}

