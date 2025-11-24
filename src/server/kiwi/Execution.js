'use server'
/*
ES2015 named imports do not destructure.
Use another statement for destructuring after the import.

import { http: { get, search }, methods } from './Kiwi'
*/
import {http,methods} from './Kiwi'
import {reply} from '@lib/ServerMessages'
import {get as getComments} from './Comments'

const fetchCase = async (testCaseId) => {
    const testCase = await http.get('TestCase', testCaseId)
    if (testCase == null) return null
    testCase.convertJson('arguments')
    return testCase.values
}

function getExecutionHost(comments) {
    if (comments == null || comments.length == 0) return null
    for (let c of comments) {
        if (c.contentType != 'application/json') continue
    
        if (c.baseUrl) {
            const match = jsonValue.baseUrl.match(/https?:\/\/(\w*)/)
            if (match) return match[1]
        }
    }
    return null
}

function parseComments(comments) {
    if (!comments || comments.length < 1) return []
    return comments.map(c => {
        if (c.is_removed) return false
        const comment = {
            submitDate: methods.date(c.submit_date),
            contentType: 'text/plain',
            author: {
                id: c.user_id,
                name: c.user_name,
                email: c.user_email,
                url: c.user_url
            },
            body: c.comment
        }

        try {
            comment.body = JSON.parse(c.comment.replaceAll(/&quot;/g,'"'))
            comment.contentType = 'application/json'
        } catch (e) {}

        if (comment.contentType == 'text/plain') {
            comment.body = methods.htmlDecode(comment.body)
        }

        return comment
    }).filter(c => c !== false)
}

const get = async id => {
    const testExecution = await http.get('TestExecution', id)
    if (testExecution == null) return reply(false,'Not found')
    testExecution.addZulu('startDate')
    testExecution.addZulu('stopDate')

    const values = testExecution.values
    
    values.comments = await http.reference('TestExecution','get_comments', {execution_id:id})
    .then(v => parseComments(v))

    const testCaseId = values.case.value
    await fetchCase(testCaseId)
    .then(tc => {
        if (tc == null) r
        values.case.script = tc.script
        values.case.arguments = tc.arguments
        values.case.securityGroupId = tc.arguments.securityGroupId ?? 'FULLADMIN'
    })

    values.config = getExecutionHost(values.comments)
    
    return reply(true, values)
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
            case: l.case,
            status: l.status.name
        }


        if (status == 'PASSED') results.passed.push(summary)
        else if (status == 'FAILED') {
            summary.comments = await getComments(l.id, 'TestExecution', 'execution_id')
            console.info('Comments',summary.comments)
            // TODO: try and get the reason: from the comments.
            // later I'll do a refactor to add a special comment or property to the execution.
            results.failed.push(summary)
        } else results.other.push(summary)
    }

    results.successRate = Math.round(results.passed.length / executions.length * 100) + '%.  ' + results.failed.length + '  failed.'

    return reply(true,results)
}

export {
    get,
    getCases
}