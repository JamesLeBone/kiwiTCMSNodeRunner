import {runTest} from '/src/app/api/Stream'

export async function GET(request, {params}) {
    const {testCaseId} = await params
    const execution = params.execution ?? null

    return runTest(testCaseId, execution)
}
