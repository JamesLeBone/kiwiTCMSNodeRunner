import {runTest} from '@server/kiwi/PuppeteerExec'

export async function GET(request, {params}) {
    const {testCaseId,execution} = await params
    const cmd = await runTest(testCaseId, execution)
    return new Response(cmd, {headers: { 'Content-Type': 'text/plain' }})
}