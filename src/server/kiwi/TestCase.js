'use server'
/*
ES2015 named imports do not destructure.
Use another statement for destructuring after the import.

import { http: { get, search }, methods } from './Kiwi'

@see https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testcase.html
*/
import {http,methods} from './Kiwi'
import {reply} from '@lib/ServerMessages'

const django2Case = dj => {
    dj.convertJson('arguments')
    dj.addZulu('createDate')
    const tc = dj.values
    tc.arguments = tc.arguments ?? {}
    tc.securityGroupId = tc.arguments.securityGroupId ?? 'FULLADMIN'
    delete tc.arguments.securityGroupId

    return tc
}

const get = async (testCaseId) => {
    const testCase = await fetchCase(testCaseId)
    // console.debug(testCase)
    return testCase == null ? reply(false,'Test Case not found') : reply(true, testCase)
}
const fetchCase = async (testCaseId) => {
    const testCase = await http.get('TestCase', testCaseId)
    if (testCase == null) return null
    return django2Case(testCase)
}

const search = async (params) => {
    const results = await http.search('TestCase', params)
    // console.log('search results',testplans)
    return reply(true, results.map(result => django2Case(result)))
}

const update = async (id,params) => {
    const login = await http.login().then(sessionId => true, nv => false)
    if (!login) return reply(false, 'Failed to login, update requires permissions from UAC')

    if (typeof params.arguments != 'undefined' && params.securityGroupId != 'undefined') {
        params.arguments.securityGroupId = params.securityGroupId ?? 'FULLADMIN'
        params.arguments = JSON.stringify(params.arguments)
    } else {
        // Don't allow these to update here.
        delete params.arguments
        delete params.securityGroupId
    }

    // console.debug(params)

    if (Object.keys(params).length == 0) return reply(false,'No changes')
    const result = await http.update('TestCase', id, 'case_id', params)
    if (result == null) return reply(false,'Update failed')
    
    const dj = django2Case(result)
    console.info('Update accepted', dj)
    return reply(true, dj)
}

const setArgs = (id,args,securityGroupId) => {
    args.securityGroupId = securityGroupId
    const result = http.update('TestCase', id, 'case_id', {arguments:JSON.stringify(args,null,4)})
    console.debug('Update result', result)
    return reply(true, result)
}

const getComponents = testCaseId => {
    // console.debug('Getting components')
    return http.search('Component', { cases: testCaseId }, false)
    .then(results => results.map(result => result.values))
    .then(tags => methods.amalgomateComponents(tags))
    .catch( e => {
        console.error('Failed to get components', e)
        return []
    })
}
const getTags = testCaseId => {
    // console.debug('Getting tags')
    return http.search('Tag', { case: testCaseId }, false)
    .then(results => results.map(result => result.values))
    .then(tags => methods.amalgomateTags(tags))
    .catch( e => {
        console.error('Failed to get tags', e)
        return []
    })
}
const getPlans = testCaseId => http.search('TestPlan', { cases: testCaseId }, false)
    .then(results => typeof results == 'undefined' ? [] : results.map(result => {
        result.addZulu('createDate')
        return result.values
    }), reject => {
        console.error('Failed to fetch plans', reject)
        return []
    })
const getPlanRequest = async testCaseId => {
    console.info(`Getting test plans for test case ${testCaseId}`)
    const list = await getPlans(testCaseId).then(r => reply(true, r))
    console.debug('list', list)
    return list
}

const clone = async (id, newCaseKvp) => {
    const reference = await http.get('TestCase', id)
    if (reference == null) return reply(false,'Clone target not found')
    const ref = reference.values

    console.info('Cloning test case',id)
    const login = await http.login().then(sessionId => true, nv => false)
    if (!login) return reply(false, 'Failed to login')
    
    const newTestCase = {
        text: newCaseKvp.text ?? ref.text,
        summary: newCaseKvp.summary ?? ref.summary,
        is_automated: newCaseKvp.is_automated ?? ref.is_automated,
        arguments: newCaseKvp.arguments ?? ref.arguments,
        script: newCaseKvp.script ?? ref.script ?? id,
        case_status: newCaseKvp.case_status ?? ref.caseStatus.value,
        category: ref.category.value,
        priority: 1,
    }
    newTestCase.arguments = JSON.stringify(newTestCase.arguments,null,4)

    // create
    const createdCaseDjango = await http.callDjango('TestCase.create', {values:newTestCase})
    if (createdCaseDjango == null) return reply(false,'Failed to create new test case')
    const createdCase = createdCaseDjango.values

    const testCaseId = createdCase.id
    console.info('Test case created : ',testCaseId)

    // plans
    const testPlans = await getPlans(id)
    if (testPlans.length > 0) console.info(`Cloning test case into ${testPlans.length} plans`)
    for (let plan of testPlans) {
        await addToPlan(testCaseId, plan.id)
    }

    const tags = await getTags(id)
    if (tags.length > 0) console.info(`Cloning test case with ${tags.length} tags`)
    for (let tag of tags) {
        http.call('Testcase.add_tag', {case_id:testCaseId, tag:tag.name})
    }

    const components = await getComponents(id)
    if (components.length > 0) console.info(`Cloning test case with ${components.length} components`)
    for (let component of components) {
        http.call('TestCase.add_component', {case_id:testCaseId, component:component.name})
    }

    return reply(true,createdCase)
}

const getDetail = async (testCaseId) => {
    // console.debug('Getting test case',testCaseId)
    const DjangoTestCase = await http.get('TestCase', testCaseId)
    if (DjangoTestCase == null) return null
    DjangoTestCase.convertJson('arguments')
    DjangoTestCase.addZulu('createDate')

    const testCase = DjangoTestCase.values

    if (typeof testCase.arguments == 'undefined') {
        testCase.arguments = {securityGroupId:'FULLADMIN'}
    } else {
        testCase.securityGroupId = typeof testCase.arguments.securityGroupId == 'undefined' ? 'FULLADMIN' : testCase.arguments.securityGroupId
    }
    delete testCase.arguments.securityGroupId

    // Children cases
    // console.debug('Getting children')
    const children = await http.search('TestCase', { script: testCaseId }, false)
    .then(results => results.map(result => {
        const v = result.values
        let scriptArgs = v.arguments.replaceAll("&quot;", '"')
            .replaceAll('&#x27;', "'")

        let securityGroupId = 'FULLADMIN'
        try {
            const args = JSON.parse(scriptArgs)
            if (typeof args.securityGroupId != 'undefined') securityGroupId = args.securityGroupId
        } catch (e) {
        }

        return {
            id: v.id,
            summary: v.summary,
            status: v.caseStatus.name,
            securityGroupId: securityGroupId
        }
    }))
    .catch( e => {
        console.error('Failed to get children scripts', e)
        return []
    })

    const tags = await getTags(testCaseId)
    const components = await getComponents(testCaseId)

    // console.debug('Getting comments')
    const comments = await http.reference('TestCase', 'comments', {case_id:testCaseId})
    .then(results => typeof results == 'undefined' ? [] : results.map(result => {
        const zresult = methods.djangoEntity(result)
        zresult.addZulu('submitDate')
        return zresult.values
    }))
    .catch( e => {
        console.error('Failed to get comments', e)
        return []
    })
    
    // console.debug('Getting attachments')
    const attachments = await http.reference('TestCase', 'list_attachments', { case_id: testCaseId })
    .catch( e => {
        console.error('Failed to get attachments', e)
        return []
    })

    // console.debug('Getting executions')
    const executions = await http.search('TestExecution', { case_id: testCaseId }, false)
    .then(results => typeof results == 'undefined' ? [] : results.map(result => {
        result.addZulu('start_date')
        result.addZulu('stop_date')
        return result.values
    }))
    .catch( e => {
        console.error('Failed to get executions', e)
        return []
    })
  
    const sortedExec = executions.sort((a,b) => {
        let asc = 0
        let bs = 0
        if (a.start_date == null) asc = -5
        if (b.start_date == null) bs = -5
        if (asc + bs == -10) return 0
        if (asc < 0) return 1
        if (bs < 0) return -1
        return (new Date(b.start_date)) - (new Date(a.start_date))
    })

    // console.debug('Getting plans')
    const plans = await getPlans(testCaseId)

    return reply (true, {
        testCase,
        components,
        children,
        tags,
        comments,
        attachments,
        executions:sortedExec,
        plans
    })
}

// get_notification_cc
/**
 * Add test case to plan
 * @param {int} testCaseId 
 * @param {?int} testPlanId Will default to the smoke test
 * @returns 
 */
const addToPlan = async (testCaseId, testPlanId=214) => {
    const login = await http.login().then(sessionId => true, nv => false)
    if (!login) return reply(false, 'Failed to login, update requires permissions from UAC')
    
    console.info('Adding test case to plan',testCaseId,testPlanId)
    return http.call('TestPlan.add_case', {plan_id:testPlanId, case_id:testCaseId})
    .then(r => reply(true, r), r => reply(false, r))
}

const removeFromPlan = async (testCaseId, testPlanId) => {
    const login = await http.login().then(sessionId => true, nv => false)
    if (!login) return reply(false, 'Failed to login, update requires permissions from UAC')
    
    console.info('Removing test case from plan',testCaseId,testPlanId)
    return http.call('TestPlan.remove_case', {plan_id:testPlanId, case_id:testCaseId})
    .then(r => reply(true, r), r => reply(false, r))
}

const bulkUpdate = async (ids, params) => {
    console.debug('Bulk updating test cases', ids, params)

    if (ids.length < 1) return reply(false,'No ids specified')

    const pushArgs = typeof params.arguments == 'undefined' ? {} : params.arguments
    if (typeof params.securityGroupId != 'undefined') {
        pushArgs.securityGroupId = params.securityGroupId
        delete params.securityGroupId
    }
    params.arguments = pushArgs
    if (Object.keys(pushArgs).length == 0) delete params.arguments

    if (Object.keys(params).length == 0) return reply(false,'No changes')

    const results = {}

    for (let testCaseId of ids) {
        // After updating a test case we want a fresh copy of the arguments so as not to pollute the next test case.
        const updateData = {...params}

        if (typeof params.arguments != 'undefined') {
            let current = await fetchCase(testCaseId)
            if (current == null) continue

            updateData.arguments = JSON.stringify({...current.arguments, ...params.arguments}, null, 4)
        }
        const result = await http.update('TestCase', testCaseId, 'case_id', params)
        .then(dj => django2Case(dj), e => {
            console.error('Failed to update test case', testCaseId, e)
            return false
        })
        results[testCaseId] = result
    }
    console.debug('Bulk update results', results)

    return reply(true, results)
}

const create = async (data) => {
    const login = await http.login().then(sessionId => true, nv => false)
    if (!login) return reply(false, 'Failed to login')

    data.arguments = data.arguments ?? {}
    data.arguments.securityGroupId = data.securityGroupId ?? 'FULLADMIN'
    delete data.securityGroupId
    data.arguments = JSON.stringify(data.arguments)

    data.category = data.category ?? 1
    data.priority = data.priority ?? 1
    
    console.debug('Creating test case', data)
    const r = await http.callDjango('TestCase.create', {values:data})
        .catch(e => {
            console.error('Failed to create test case', e)
            return null
        })
    if (r == null) return reply(false, 'Failed to create test case')
    return reply(true, r.values)
}


export {
    get,
    getDetail,
    search,
    update,
    clone,
    create,
    getComponents,
    setArgs,
    addToPlan,
    removeFromPlan,
    bulkUpdate,
    getPlanRequest
}