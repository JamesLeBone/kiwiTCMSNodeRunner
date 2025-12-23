'use server'

import { http } from './Kiwi'
import { updateOpSuccess, prepareStatus, updateOpError, TypedOperationResult } from '@lib/Operation'
import { fetchTestCase } from './TestCase'
import type { TestCase } from './TestCase'

import { fetch as getComments } from './Comments'
import { DjangoEntity } from './Django'
import type { Comment } from './Comments'

const django2Execution = (execution: DjangoEntity) : TestExecution => {
    const startDate = execution.parseDate('startDate')
    const stopDate = execution.parseDate('stopDate')
    let duration = '0s'
    let durationValue = 0

    if (stopDate && startDate) {
        durationValue = stopDate.getTime() - startDate.getTime()
        duration = Math.floor(durationValue/1000).toString() + 's'
        if (durationValue < 1000) duration = '<1s'
        else if (durationValue >= 60000) {
            const minutes = Math.floor(durationValue/60000)
            const seconds = Math.floor((durationValue % 60000)/1000)
            duration = minutes.toString() + 'm ' + seconds.toString() + 's'
        }
    }
    
    const dje: TestExecution = {
        id: execution.values.id,
        startDate: startDate ?? undefined,
        stopDate: stopDate ?? undefined,
        status: execution.values.status,
        testCaseId : execution.values.case.id,
        duration,
        durationValue
    }
    return dje
}

export declare interface TestExecution {
    id: number
    startDate?: Date
    stopDate?: Date
    duration: string
    durationValue: number
    testCaseId: number
    status: string
}
export declare interface DetailedTestExecution extends TestExecution {
    testCase: TestCase
    comments: Comment[]
}

export const get = async (id: number) : Promise<TypedOperationResult<DetailedTestExecution>> => {
    const op = prepareStatus('fetchExecution') as TypedOperationResult<DetailedTestExecution>
    const testExecution = await http.get<TestExecution>('TestExecution', id, django2Execution)
    if (testExecution == null) return op.message = 'Not found', op

    const comments = await getComments(testExecution.id, 'TestExecution')

    const testCase = await fetchTestCase(testExecution.testCaseId)
    if (!testCase) {
        updateOpError(op, 'Failed to fetch associated Test Case')
        return op
    }
    const detailedExecution: DetailedTestExecution = {
        ...testExecution,
        testCase: testCase,
        comments: comments
    }
    updateOpSuccess(op, 'Execution found')
    op.data = detailedExecution
    return op
}

export const fetch = async (id: number) : Promise<TestExecution | null> => {
    const testExecution = await http.get<TestExecution>('TestExecution', id, django2Execution)
    return testExecution
}


type ResultSummaryItem = {
    id: number
    status: string
    startDate: Date
    testCaseId: number
    testCaseName: string
    results?: object
}

export const getRunResult = async (testRunId:number) => {
    const executions = await http.search('TestExecution', {run:testRunId}, false)
    if (executions == null || executions.length == 0) return []

    const results = {
        passed:[] as ResultSummaryItem[],
        failed:[] as ResultSummaryItem[],
        other:[] as ResultSummaryItem[],
        successRate: {
            passed: 0,
            total: executions.length,
            failed: 0
        }
    }

    for (let l of executions) {
        const status = l.values.status.value as string
        const testCaseId = Number.parseInt(l.values.case.id)
        const testCase = await fetchTestCase(testCaseId)
        const testCaseName = testCase ? testCase.summary : 'Unknown Test Case'
        const executionId = Number.parseInt(l.values.id)

        const rsi: ResultSummaryItem = {
            id: executionId,
            testCaseId: testCaseId,
            testCaseName: testCaseName,
            status: status,
            startDate: new Date(l.values.startDate)
        }
        console.debug('Verify execution summary', rsi, l.values)

        if (status == 'FAILED') {
            const comments = await getComments(executionId, 'TestExecution')
                .then(list => list.filter(c => typeof c.body == 'object'))
            rsi.results = comments
            results.failed.push(rsi)
        } else if (status == 'PASSED') {
            results.passed.push(rsi)
        } else {
            results.other.push(rsi)
        }
    }

    results.successRate.passed = results.passed.length
    results.successRate.failed = results.failed.length

    return results
}

type SearchParams = {
    id: number
    run: number
    status: string
    case_id: number
}
export const search = async (filters: Partial<SearchParams>): Promise<TestExecution[]> => {
    const executions = await http.search('TestExecution', filters, false)
    if (executions == null) return []

    // It doesn't matter which order these resolve in and won't conflict.
    // so just stack them up and await them all at once.
    const executionResults = executions.map((execution: DjangoEntity) => django2Execution(execution))
    const sortedExec = executionResults.sort((a,b) => {
        const aStart = a.startDate ?? new Date(0)
        const bStart = b.startDate ?? new Date(0)
        return bStart.getTime() - aStart.getTime()
    })
    return sortedExec
}
