import TestRunEdit from './TestRunEdit'
import { redirect } from 'next/navigation'
import { get } from '@server/kiwi/TestRun'

export default async function TestRunPage(props : NextPageProps) {
    const searchParams = await props.params

    if (searchParams.id == null) return redirect('/kiwi/plan')
    const testRunId = Number.parseInt(searchParams.id as string)
    if (isNaN(testRunId)) return redirect('/kiwi/plan')

    // uses our server.
    const response = await get(testRunId)
    if (!response.status || !response.data) {
        return <div>Test Run {testRunId}: {response.message}</div>
    }
    const testRun = response.data

    return <TestRunEdit testRun={testRun} />
}

