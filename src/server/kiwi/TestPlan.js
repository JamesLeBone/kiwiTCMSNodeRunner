'use server'

import {http,methods} from './Kiwi'
import {reply} from '../lib/ServerMessages'

// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testplan.html

const get = async (id) => {
    const testplan = await http.get('TestPlan', id)
    if (testplan == null) return reply(false,'Test Plan not found')
    // testCase.convertJson('arguments')
    testplan.addZulu('createDate')
    return reply(true, testplan.values)
}

const getDetail = async (id) => {
    const testplan = await http.get('TestPlan', id)
    if (testplan == null) return reply(false,'Test Plan not found')
    testplan.addZulu('createDate')

    const tp = testplan.values
    if (typeof tp.parent == 'number') {
        const parent = await get(tp.parent)
        if (parent.status) {
            tp.parent = {
                id: parent.message.id,
                name: parent.message.name
            }
        }
    }
    tp.children = await http.search('TestPlan', {parent:id}, false)
    .then(list => 
        list.map(c => {
            const {id,name,isActive} = c.values
            return {id,name,isActive}
        })
    )

    tp.testCases = await fetchCases(id)
    // console.debug('Test plan detail', tp)

    const runs = await getRunData(id)
    tp.runs = runs

    return reply(true, tp)
}

const fetchCases = async id => {
    console.info(`Getting test cases for test plan ${id}`)
    const filter = await http.call('TestCase.filter', {query:{plan:id}})
        .then(list => list, reject => {
            console.error('Failed to fetch cases', reject)
            return []
        })
    // console.info('filter', filter)
    console.info(`found ${filter == null ? 0 : filter.length} cases`)

    return new Promise((resolve, reject) => {
        if (filter == null) reject('Failed to fetch')
        resolve(filter.map(c => {
            const djCase = methods.djangoEntity(c)
            djCase.convertJson('arguments')
            const cv = djCase.values

            const securityGroupId = cv.arguments.securityGroupId ?? 'FULLADMIN'
            delete cv.arguments.securityGroupId

            const item = {
                id: cv.id,
                securityGroupId: securityGroupId,
                arguments: cv.arguments,
                summary: methods.htmlDecode(cv.summary),
                status: cv.caseStatus.name,
                script: cv.script,
                isAutomated: cv.isAutomated,
            }
            // console.debug('Case',item)
            return item
        }))
    })
}
const getCases = async id => fetchCases(id).then(r => reply(true, r), r => reply(false, r))

const search = async (params) => {
    const testplans = await http.search('TestPlan', params)
    console.debug(testplans)
    // console.log('search results',testplans)
    return reply(true, testplans.map(testplan => {
        testplan.addZulu('createDate')
        return testplan.values
    }))
}

const addToPlan = async (testCaseId, testPlanId) => {
    const login = await http.login().then(sessionId => true, nv => false)
    if (!login) return reply(false, 'Not logged in')

    if (typeof testPlanId == 'undefined' || Number.isNaN(Number.parseInt(testPlanId))) {
        return reply(false, 'Test plan ID is not valid')
    }
    if (typeof testCaseId == 'undefined' || Number.isNaN(Number.parseInt(testCaseId))) {
        return reply(false, 'Test case ID is not valid')
    }
    
    console.info('Adding test case to plan',testCaseId,testPlanId)
    const r = await http.call('TestPlan.add_case', {plan_id:testPlanId, case_id:testCaseId})
        .then(r => reply(true, r), r => reply(false, r))
    return r
}

const removeFromPlan = async (testCaseId, testPlanId) => {
    console.info('Removing test case from plan',testCaseId,testPlanId)
    return http.call('TestPlan.remove_case', {plan_id:testPlanId, case_id:testCaseId})
    .then(r => reply(true, r), r => reply(false, r))
}

const update = async (id, data) => {
    console.debug('Updating test plan', id, data)
    const r = await http.update('TestPlan', id, 'plan_id', data)
    if (r == null) return reply(false, 'Failed to update test plan')
    return reply(true, r.values)
}

const getDuration = (run) => {
    if (run.startDate == null) return null
    if (run.stopDate == null) return null
    const duration = (new Date(run.stopDate) - new Date(run.startDate)) / 1000
    return duration
}

const getRunData = async (testPlanId) => {
    return new Promise(async (resolve, reject) => {
        const request = await http.call('TestRun.filter', {query:{plan_id:testPlanId}})
        if (request == null) reject(request)
        const list = request.map(r => {
            const run = methods.djangoEntity(r)
            run.addZulu('startDate')
            run.addZulu('stopDate')
            const runValues = run.values
            runValues.duration = getDuration(runValues)
            return runValues
        })

        const sorted = list.sort((a,b) => {
            if (a.startDate == null) return 1
            if (b.startDate == null) return -1
            if (a.startDate > b.startDate) return -1
            if (a.startDate < b.startDate) return 1
            return a.id - b.id
        })
        
        // console.debug('runs',sorted)
        return resolve(sorted)
    })
}
const getRuns = async (testPlanId) => getRunData(testPlanId).then(r => reply(true, r), r => reply(false, r))

const create = async (data) => {
    const login = await http.login().then(sessionId => true, nv => false)
    if (!login) return reply(false, 'Failed to login')

    data.product = data.product ?? 1
    data.product_version = data.product_version ?? 3
    data.type = data.type ?? 5
    data.isActive = data.isActive ?? true
    
    console.debug('Creating test plan', data)
    const r = await http.callDjango('TestPlan.create', {values:data})
        .catch(e => {
            console.error('Failed to create test plan', e)
            return null
        })
    if (r == null) return reply(false, 'Failed to create test plan')
    return reply(true, r.values)
}

export {
    get,
    getDetail,
    search,
    addToPlan,
    update,
    create,
    removeFromPlan,
    getRuns,
    getCases
}
