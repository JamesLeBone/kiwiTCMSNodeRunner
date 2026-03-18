import type { NextApiRequest, NextApiResponse } from 'next'
import {runTest} from '@api/Stream'
type requestParams = {
    params: {
        testCaseId: number
        execution?: number
    }
}
export async function GET(request: NextApiRequest, params: requestParams) {
    const {testCaseId} = params.params
    const execution = params.params.execution

    return runTest({testCaseId, executionId: execution})
}
