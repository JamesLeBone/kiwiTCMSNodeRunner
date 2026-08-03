import type { NextRequest } from 'next/server'
import {runTest} from '@api/Stream'
type requestParams = {
    params: Promise<{
        testCaseId: string
    }>
}
export async function GET(request: NextRequest, {params}: requestParams) {
    const {testCaseId} = await params
    const executionParam = request.nextUrl.searchParams.get('execution')

    return runTest({
        testCaseId: Number(testCaseId),
        executionId: executionParam ? Number(executionParam) : undefined
    })
}
