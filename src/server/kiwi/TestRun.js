'use server'
/*
ES2015 named imports do not destructure.
Use another statement for destructuring after the import.

import { http: { get, search }, methods } from './Kiwi'
*/
import {http,methods} from './Kiwi'
import {reply} from '../lib/ServerMessages'

const get = async id => {
    const testRun = await http.get('TestRun', id)
    if (testRun == null) return reply(false,'Test Case not found')
    testRun.convertJson('arguments')
    testRun.addZulu('createDate')
    return reply(true, testRun.values)
}

const fetchCase = async (testCaseId) => {
    const testCase = await http.get('TestCase', testCaseId)
    if (testCase == null) return null
    testCase.convertJson('arguments')
    return testCase.values
}

const getCases = async id => {
    const executions = await http.search('TestExecution', {run:id}, false)
    if (executions == null) return reply(false,'Failed to fetch')

    const results = {
        passed:[],
        failed:[],
        other:[]
    }

    for (let l of executions) {
        l.addZulu('startDate')
        l.addZulu('stopDate')
        l = l.values
        const status = l.status.name
        const summary = {
            id: l.id,
            startDate: l.startDate,
            stopDate: l.stopDate,
            status: l.status.name,
            case: {
                id: l.case.value,
                summary: l.case.summary
            }
        }

        const testCaseId = l.case.value

        await fetchCase(testCaseId)
            .then(tc => {
                if (tc == null) r
                summary.case.script = tc.script
                summary.case.arguments = tc.arguments
                summary.case.securityGroupId = tc.arguments.securityGroupId ?? 'FULLADMIN'
            })

        if (status == 'PASSED') results.passed.push(summary)
        else if (status == 'FAILED') results.failed.push(summary)
        else results.other.push(summary)
    }

    results.successRate = Math.round(results.passed.length / executions.length * 100) + '%.  ' + results.failed.length + '  failed.'

    return reply(true,results)
}

export {
    get,
    getCases
}