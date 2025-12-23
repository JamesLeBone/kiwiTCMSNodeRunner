'use server'
/*
API:
@see https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testcase.html

*/
import {
    http,
    methods,
    unAuthenticated
} from './Kiwi'
import { updateOpError, updateOpSuccess, TypedOperationResult, StatusOperation, prepareStatus } from '@lib/Operation'
import { BasicRecord, DjangoEntity, htmlEntityDecode } from './Django'
import { fetch as fetchComments, Comment } from './Comments'
import { componentCases, AmalgomatedComponent } from './Component'
import * as Tag from './Tag'
import { fetchCategories } from './Category'
import { search as searchExecutions, TestExecution } from './Execution'
import { search as searchPlan, TestPlan } from './TestPlan'

export const django2Case = async (dj : DjangoEntity) : Promise<TestCase> => {
    if (!dj.values.id) throw new Error('django2Case: Invalid Django Entity, missing id')
    
    dj.convertJson('arguments')
    dj.addZulu('createDate')
    const tc = dj.values
    tc.summary = htmlEntityDecode(tc.summary)
    tc.text = htmlEntityDecode(tc.text)
    tc.arguments = tc.arguments ?? {}
    tc.createDate = new Date(tc.createDate)
    let script = parseInt(tc.script) || null
    if (script == null || tc.script == '' || Number.isNaN(script)) {
        tc.script = null
    } else {
        tc.script = script
    }
    if (tc.arguments.securityGroupId) {
        tc.securityGroupId = tc.arguments.securityGroupId
    }
    delete tc.arguments.securityGroupId
    // For some reason, Kiwi will return prioirty as { value: 'P1' } rather than the id nubmer,
    // or the set.

    return tc as TestCase
}

// This is what we use internally
export type TestCase = {
    id: number,
    summary: string
    text: string
    isAutomated: boolean
    arguments: Record<string, any>
    securityGroupId?: string
    caseStatus: {
        id: number,
        name: string,
        description: string
    }
    category: {
        id: number
        name: string
    }
    product: {
        id: number
        name: string
    }
    author: {
        id: number
        username: string
    }
    priority: {
        id: number
        value: string
    }
    script?: number
    createDate: string
}

export const getTestCase = async (testCaseId:number) : Promise<TypedOperationResult<TestCase>> => {
    const op = { id : 'getTestCase', status: false, message: '', statusType: 'blank' } as TypedOperationResult<TestCase>
    const testCase = await fetchTestCase(testCaseId)
    if (!testCase) return updateOpError(op, 'Test Case not found')
    op.data = testCase
    return updateOpSuccess(op, 'Test Case fetched successfully')
}
export const fetchTestCase = async (testCaseId:number) : Promise<TestCase | null> => 
    http.get('TestCase', testCaseId, django2Case)

type SearchParams = {
    summary: string
    isAutomated: boolean
    script: number
    status: number
    category: number
    plan: number
}
export const search = async (params: Partial<SearchParams>) : Promise<TypedOperationResult<TestCase[]>> => {
    const op = { id : 'searchTestCases', status: false, message: 'No test cases found', statusType: 'info' } as TypedOperationResult<TestCase[]>

    const djSp = {} as Record<string, any>
    if (typeof params.summary != 'undefined') djSp.summary__icontains = params.summary
    if (typeof params.isAutomated != 'undefined') djSp.is_automated = params.isAutomated
    if (typeof params.script != 'undefined') djSp.script = params.script
    if (typeof params.status != 'undefined') djSp.case_status = params.status
    if (typeof params.category != 'undefined') djSp.category = params.category
    if (typeof params.plan != 'undefined') djSp.plan = params.plan
    
    // Return a djangoEntity so we can run it's date and json helpers
    const results = await http.search('TestCase', djSp, false)
    .catch( e => {
        updateOpError(op, e.message || 'Failed to search test cases')
        return []
    })
    if (!results.length) return op
    // console.debug('results',results)

    op.data = await Promise.all( results.map(result => django2Case(result)) )
    // console.debug('results - converted',op.data)
    return updateOpSuccess(op, 'Test Cases fetched successfully')
}

export const fetchTestCaseComments = async (testCaseId:number) => fetchComments(testCaseId, 'TestCase')

// https://kiwitcms.readthedocs.io/en/latest/_modules/tcms/rpc/api/testcase.html#create
type KiwiCreateTestCaseParams = {
    summary: string
    priority: number
    product: number
    category: number
    text?: string
    is_automated?: boolean
    script?: number
    case_status?: number
    arguments?: string
}
// Send to Kiwi Params.
type KiwiUpdateParams = {
    summary: string
    text: string
    is_automated: boolean
    case_status: number
    category: number
    priority: number
    arguments: string
    script: number|''
}
// Internal type
type KiwiUpdateTestCaseParams = {
    summary: string
    description: string
    isAutomated: boolean
    caseStatusId: number
    arguments: Record<string, string>
    category: number
    priority: number
    script: number
    securityGroupId: number
}

type CreateTestCaseParams = {
    summary: string
    priority: number
    product: number
    category: number
    text: string
    isAutomated: boolean
    script?: number
    caseStatus: number
    arguments?: Record<string, any>
    securityGroupId?: string
}

const frontend2UpdateParams = (params: Partial<KiwiUpdateTestCaseParams>) : Partial<KiwiUpdateParams> => {
    const updateParams = {} as Partial<KiwiUpdateParams>
    if (params.summary) updateParams.summary = params.summary
    if (params.description) updateParams.text = params.description
    if (typeof params.isAutomated != 'undefined') updateParams.is_automated = params.isAutomated
    if (params.caseStatusId) updateParams.case_status = params.caseStatusId
    if (params.category) updateParams.category = params.category
    if (params.priority) updateParams.priority = params.priority
    if (typeof params.script != 'undefined') {
        if (params.script == 0) updateParams.script = ''
        else updateParams.script = params.script
    }
    
    if (params.arguments) {
        const args = params.arguments
        if (params.securityGroupId) {
            args.securityGroupId = params.securityGroupId+''
        }
        updateParams.arguments = JSON.stringify(args,null,4)
    }
    return updateParams
}

export const update = async (id: number, params: Partial<KiwiUpdateTestCaseParams>) : Promise<TypedOperationResult<TestCase>> => {
    const op = { id : 'updateTestCase', status: false, message: 'Failed', statusType: 'error' } as TypedOperationResult<TestCase>
    const login = await http.login()
    if (!login) return unAuthenticated

    const updateParams = frontend2UpdateParams(params)

    if (Object.keys(updateParams).length == 0) return updateOpError(op, 'No changes specified')
    const result = await http.update('TestCase', id, 'case_id', updateParams)
    .catch(e => {
        updateOpError(op, 'Update failed: ' + (e.message || 'Unknown error'))
        return null
    })
    if (!result) return op
    console.log('Update accepted', result)
    const dj = await django2Case(result)
    op.data = dj
    return updateOpSuccess(op, 'Test Case updated successfully')
}

export const setArgs = async (id:number,args: Record<string, any>,securityGroupId?:string) => {
    const op = { id : 'setTestCaseArgs', status: false, message: 'Failed', statusType: 'error' } as StatusOperation
    if (securityGroupId) args.securityGroupId = securityGroupId
    const result = await http.update('TestCase', id, 'case_id', {arguments:JSON.stringify(args,null,4)})
    .catch( e => {
        updateOpError(op, 'Failed to set arguments: ' + (e.message || 'Unknown error'))
        return null
    })
    if (!result) return op
    return updateOpSuccess(op, 'Arguments set successfully')
}

export const getComponents = async (testCaseId:number) : Promise<TypedOperationResult<AmalgomatedComponent[]>> => {
    const op = { id : 'getTestCaseComponents', status: false, message: '', statusType: 'blank' } as TypedOperationResult<any[]>
    const res = await componentCases(testCaseId)
    if (!res || res.length == 0) {
        op.message = 'No components found'
        op.statusType = 'info'
        return op
    }
    op.data = res
    return updateOpSuccess(op, 'Components fetched successfully')
}
export const fetchComponents = componentCases

export const fetchAttachments = async (testCaseId:number) : Promise<BasicRecord[]> => {
    const attachments = [] as BasicRecord[]
    try {
        const list = await http.reference('TestCase', 'list_attachments', { case_id: testCaseId })
        const attachList = Array.isArray(list) ? list : [list]
        for (const attach of attachList) {
            attachments.push(attach.values)
        }
    } catch ( e ) {
        console.error('Failed to get attachments', e)
        return []
    }
    return attachments
}
export const fetchExecutions = async (testCaseId:number) : Promise<TestExecution[]> => {
    return await searchExecutions({ case_id: testCaseId })
}

export const fetchTags = async (testCaseId:number) => Tag.getAttachedTags('TestCase', testCaseId)

// TODO: udpate this with test plan type
export const getPlans = async (testCaseId:number) : Promise<TypedOperationResult<BasicRecord[]>> => {
    const op = { id : 'getTestCasePlans', status: false, message: '', statusType: 'blank' } as TypedOperationResult<any[]>
    const list = await searchPlan({ cases: testCaseId })
    if (list.length == 0) {
        op.message = 'No test plans found'
        op.statusType = 'info'
        return op
    }
    op.data = list
    return updateOpSuccess(op, 'Test plans fetched successfully')
}
export const fetchPlans = async (testCaseId:number) : Promise<TestPlan[]> => {
    const slist = await searchPlan({ cases: testCaseId })
    return slist
}

export const clone = async (id:number, newCaseKvp:Partial<KiwiUpdateTestCaseParams>) : Promise<TypedOperationResult<TestCase>> => {
    const login = await http.login()
    if (!login) return unAuthenticated

    const op = { id : 'cloneTestCase', status: false, message: '', statusType: 'blank' } as TypedOperationResult<TestCase>
    const reference = await http.get('TestCase', id, django2Case)
        .catch( e => {
            updateOpError(op, 'Failed to fetch reference test case: ' + (e.message || 'Unknown error'))
            return null
        })
    if (reference == null) return op

    console.info('Cloning test case',reference)
    const categoryId = newCaseKvp.category ?? reference.category.id
    const categories = await fetchCategories({ id: categoryId })
    if (categories.length == 0) return op.message = 'Category for new test case not found', op
    
    const newTestCase : KiwiCreateTestCaseParams = {
        summary: newCaseKvp.summary ?? reference.summary,
        priority: newCaseKvp.priority ?? reference.priority.id,
        
        category: categoryId,
        product: categories[0].product,
        
        text: newCaseKvp.description ?? reference.text,
        is_automated: newCaseKvp.isAutomated ?? reference.isAutomated,
        script: newCaseKvp.script ?? reference.script ?? id,
        case_status: newCaseKvp.caseStatusId ?? reference.caseStatus.id,
    }
    if (newCaseKvp.arguments) {
        newTestCase.arguments = JSON.stringify(newCaseKvp.arguments)
    } else {
        newTestCase.arguments = JSON.stringify(reference.arguments)
    }

    // create
    const creationResult = await createCase(newTestCase)
    const createdCase = creationResult.case
    if (typeof createdCase === 'undefined') return op.message = creationResult.message, op
    
    const testCaseId = createdCase.id
    console.info('Test case created : ',testCaseId)

    // plans
    const testPlans = await fetchPlans(id)
    if (testPlans.length > 0) console.info(`Cloning test case into ${testPlans.length} plans`)
    for (let plan of testPlans) {
        await addToPlan(testCaseId, plan.id)
    }

    const tags = await fetchTags(id)
    if (tags.length > 0) console.info(`Cloning test case with ${tags.length} tags`)
    for (let tag of tags) {
        http.call('Testcase.add_tag', {case_id:testCaseId, tag:tag.name})
    }

    const components = await fetchComponents(id)
    if (components.length > 0) console.info(`Cloning test case with ${components.length} components`)
    for (let component of components) {
        http.call('TestCase.add_component', {case_id:testCaseId, component:component.name})
    }

    op.data = createdCase
    return updateOpSuccess(op, 'Test Case cloned successfully')
}
export type TestCaseDetail = {
    testCase: TestCase
    components: AmalgomatedComponent[]
    children: TestCase[]
    tags: Tag.AmalgomatedTag[]
    comments: Comment[]
    attachments: BasicRecord[]
    executions: TestExecution[]
    plans: TestPlan[]
}
export const getDetail = async (testCaseId:number) : Promise<TypedOperationResult<TestCaseDetail>> => {
    const op = { id : 'getTestCaseDetail', status: false, message: '', statusType: 'blank' } as TypedOperationResult<any>
    const testCase = await fetchTestCase(testCaseId)
    if (!testCase) return updateOpError(op, 'Test Case not found')
    // Children cases
    const children = await search({ script: testCaseId })
    .then(op => {
        if (!op.status || !op.data) return []
        return op.data
    })
    
    const tags = await fetchTags(testCaseId)
    const components = await fetchComponents(testCaseId)
    const comments  = await fetchTestCaseComments(testCaseId)
    const attachments = await fetchAttachments(testCaseId)
    const executions = await fetchExecutions(testCaseId)
    const plans = await fetchPlans(testCaseId)

    const detailObject: TestCaseDetail = {
        testCase,
        components,
        children,
        tags,
        comments,
        attachments,
        executions,
        plans
    }
    updateOpSuccess(op, 'Test Case detail fetched successfully')
    op.data = detailObject
    return op
}

// get_notification_cc
/**
 * Add test case to plan
 */
export const addToPlan = async (testCaseId:number, testPlanId:number) : Promise<StatusOperation> => {
    const op = prepareStatus('addTestCaseToPlan')
    const login = await http.login()
    if (!login) return unAuthenticated
    
    console.info('Adding test case to plan',testCaseId,testPlanId)
    await http.call('TestPlan.add_case', {plan_id:testPlanId, case_id:testCaseId})
        .then(r => {
            op.message = 'Test case added to plan successfully'
            op.status = true
            op.statusType = 'success'
        },
            r => op.message = r.message || 'Failed to add test case to plan'
        )
    return op
}

export const removeFromPlan = async (testCaseId:number, testPlanId:number) : Promise<StatusOperation> => {
    const op = prepareStatus('removeTestCaseFromPlan')
    const login = await http.login()
    if (!login) return unAuthenticated
    
    console.info('Removing test case from plan',testCaseId,testPlanId)
    const status = await http.call('TestPlan.remove_case', {plan_id:testPlanId, case_id:testCaseId})
        .then(r => true, r => false)
    if (status) {
        op.message = 'Test case removed from plan successfully'
        op.status = true
        op.statusType = 'success'
    }
    return op
}

export const bulkUpdate = async (ids:number[], params: Partial<KiwiUpdateTestCaseParams>) : Promise<StatusOperation> => {
    const login = await http.login()
    if (!login) return unAuthenticated

    console.debug('Bulk updating test cases', ids, params)
    const op = prepareStatus('bulkUpdateTestCases')

    if (ids.length < 1) return op.message = 'No test cases specified', op

    const pushArgs = typeof params.arguments == 'undefined' ? {} : params.arguments
    if (typeof params.securityGroupId != 'undefined') {
        pushArgs.securityGroupId = params.securityGroupId+''
        delete params.securityGroupId
    }
    params.arguments = pushArgs
    if (Object.keys(pushArgs).length == 0) delete params.arguments

    if (Object.keys(params).length == 0) return op.message = 'No changes specified', op

    const results = {} as Record<number, boolean>

    for (let testCaseId of ids) {
        // After updating a test case we want a fresh copy of the arguments so as not to pollute the next test case.
        const updateData = {...params}

        if (typeof params.arguments != 'undefined') {
            let current = await fetchTestCase(testCaseId)
            if (current == null) continue

            updateData.arguments = {...current.arguments, ...params.arguments}
        }
        const result = await update(testCaseId, updateData)
        
        results[testCaseId] = result.status
    }
    console.debug('Bulk update results', results)
    op.message = 'Bulk update completed'
    op.status = true
    op.statusType = 'info'
    return op
}

type CreationResult = {
    case?: TestCase
    message: string
}
const createCase = async (values: KiwiCreateTestCaseParams) : Promise<CreationResult> => {
    const r = {message:'Creating test case'} as CreationResult
    await http.callDjango('TestCase.create', {values})
        .then( async (dj) => {
            r.case = await django2Case(dj)
            r.message = 'Test case created successfully'
        })
        .catch(e => {
            r.message = e.message || 'Failed to create test case'
        })
    return r
}

export const create = async (data: CreateTestCaseParams) : Promise<TypedOperationResult<TestCase>> => {
    const login = await http.login()
    if (!login) return unAuthenticated

    const args = data.arguments ?? {}
    if (data.securityGroupId) args.securityGroupId = data.securityGroupId
    const stringArgs = JSON.stringify(args,null,4)

    const dataSet = {
        summary: data.summary,
        priority: data.priority,
        product: data.product,
        category: data.category,
        text: data.text,
        is_automated: data.isAutomated,
        script: data.script,
        case_status: data.caseStatus,
        arguments: stringArgs,
    } as KiwiCreateTestCaseParams

    const op = {
        id : 'createTestCase', status: false, message: 'Failed to create test case', statusType: 'error'
    } as TypedOperationResult<TestCase>
    
    console.debug('Creating test case', dataSet)
    const creationResult = await createCase(dataSet)
    op.message = creationResult.message

    if (creationResult.case) {
        op.data = creationResult.case
        op.status = true
        op.statusType = 'success'
    }
    
    return op
}

export const remove = async (...testCaseIds:number[]) : Promise<StatusOperation> => {
    const login = await http.login()
    if (!login) return unAuthenticated
    
    console.info('Removing test cases', testCaseIds)
    const op = prepareStatus('removeTestCases')
    // const reply = await http.call('TestCase.remove', { case_ids: testCaseIds })
    const reply = await http.call('TestCase.remove', { 'pk__in': testCaseIds })
    .then( r => true, r => {
        console.error('Failed to remove test cases', r)
        return false
    } )
    if (reply) {
        op.message = 'Test cases removed successfully'
        op.status = true
        op.statusType = 'success'
    }
    return op
}
