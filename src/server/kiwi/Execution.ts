'use server'

import { http } from './Kiwi'
import { updateOpSuccess, prepareStatus, updateOpError, TypedOperationResult } from '@lib/Operation'
import { fetchTestCase } from './TestCase'
import type { TestCase } from './TestCase'

import { fetch as getComments } from './Comments'
import { DjangoEntity } from './Django'
import type { Comment } from './Comments'

const django2Execution = async (execution: DjangoEntity) : Promise<TestExecution> => {
    execution.addZulu('startDate')
    execution.addZulu('stopDate')
    const comments = await getComments(execution.values.id, 'TestExecution')
    const testCase = await fetchTestCase(execution.values.case.value)
    if (!testCase) {
        console.warn('Failed to fetch test case for execution id ' + execution.values.id)
    }
    
    const dje = { ...execution.values, comments, testCase } as TestExecution
    return dje
}

export declare type TestExecution = {
    id: number
    startDate: Date
    stopDate: Date
    testCase: TestCase
    status: string
    comments: Comment[]
}

export const get = async (id: number) : Promise<TypedOperationResult<TestExecution>> => {
    const op = prepareStatus('fetchExecution') as TypedOperationResult<TestExecution>
    const testExecution = await http.get('TestExecution', id)
    if (testExecution == null) return op.message = 'Not found', op

    const execution = await django2Execution(testExecution)
    updateOpSuccess(op, 'Execution found')
    op.data = execution
    return op
}

export const fetch = async (id: number) : Promise<TestExecution | null> => {
    const testExecution = await http.get('TestExecution', id)
    if (testExecution == null) return null
    const execution = await django2Execution(testExecution)
    return execution
}

export const getRunResult = async (testRunId:number) => {
    const executions = await http.search('TestExecution', {run:testRunId}, false)
    if (executions == null || executions.length == 0) return []

    const results = {
        passed:[] as TestExecution[],
        failed:[] as TestExecution[],
        other:[] as TestExecution[],
        successRate: {
            passed: 0,
            total: executions.length,
            failed: 0
        }
    }

    for (let l of executions) {
        const ex = await django2Execution(l)

        if (ex.status == 'PASSED') results.passed.push(ex)
        else if (ex.status == 'FAILED') {
            ex.comments = await getComments(ex.id, 'TestExecution')
            // TODO: try and get the reason: from the comments.
            // later I'll do a refactor to add a special comment or property to the execution.
            results.failed.push(ex)
        } else results.other.push(ex)
    }

    results.successRate.passed = results.passed.length
    results.successRate.failed = results.failed.length

    return results
}

declare type SearchParams = {
    id: number
    run: number
    status: string
}
export const search: any = async (filters: Partial<SearchParams>) => {
    const executions = await http.search('TestExecution', filters, false)
    if (executions == null) return []

    // It doesn't matter which order these resolve in and won't conflict.
    // so just stack them up and await them all at once.
    const executionResults = executions.map((execution: DjangoEntity) => django2Execution(execution))
    return await Promise.all(executionResults)
}
