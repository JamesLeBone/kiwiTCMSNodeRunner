'use server'
import { DjangoEntity } from './Django'
import {http, unAuthenticated} from './Kiwi'
import { updateOpSuccess, prepareStatus, updateOpError, TypedOperationResult } from '@lib/Operation'

import * as TestCase from './TestCase'
import * as TestRun from './TestRun'

export type TestPlan = {
    id: number
    name: string
    text: string
    type: number
    status: string
    isActive: boolean
    createDate: Date
    product: {
        id: number
        version: {
            id: number
            value: string
        }
    }
    parent?: number
}
export type DetailedTestPlan = {
    id: number
    name: string
    text: string
    type: number
    status: string
    isActive: boolean
    createDate: Date
    product: {
        id: number
        version: {
            id: number
            value: string
        }
    }
    children: {
        id: number
        name: string
        isActive: boolean
    }[]
    testCases: TestCase.TestCase[]
    parent: { id: number, name: string } | false
    runs: TestRun.TestRun[]
}

export type UpdatePlanProps = {
    name: string
    text: string
    type?: number
    status?: string
    isActive?: boolean
    product?: number
    parent?: number
}

type SearchParams = {
    id : number
    name : string
    nameList : string[]
    product : number
    parent : number
    cases : number
}
type DjangoSearchParams = {
    id? : number
    name__icontains? : string
    name__in: string[]
    product? : number
    parent? : number
    cases? : number
} 
// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testplan.html

const djangoPlan = (dje: DjangoEntity) : TestPlan => {
    dje.addZulu('createDate')
    const { productVersion, ...rest } = dje.values
    rest.product.version = productVersion
    return rest as TestPlan
}

export const fetch = async (testPlanId: number) : Promise<TestPlan | null> => {
    const tp = await http.get<TestPlan>('TestPlan', testPlanId, djangoPlan)
    return tp
}
//  RPC TestPlan.add_attachment(plan_id, filename, b64content)

export const get = async (testPlanId: number) : Promise<TypedOperationResult<TestPlan>> => {
    const op = prepareStatus('fetchTestPlan') as TypedOperationResult<TestPlan>
    const testplan = await http.get<TestPlan>('TestPlan', testPlanId, djangoPlan)
    .catch(e => {
        const message = e.message ?? 'Failed to fetch test plan'
        updateOpError(op, message)
        return null
    })
    if (testplan == null) return op
    updateOpSuccess(op, 'Test plan obtained')
    op.data = testplan
    return op
}

export const getDetail = async (testPlanId: number) : Promise<TypedOperationResult<DetailedTestPlan>> => {
    const op = prepareStatus('getDetailedPlan') as TypedOperationResult<DetailedTestPlan>
    const testplan = await fetch(testPlanId)
    if (testplan == null) return op.message = 'Test plan not found', op

    const detailedTestplan: Partial<DetailedTestPlan> = { ...testplan, parent: false }

    
    if (typeof testplan.parent == 'number') {
        const parent = await fetch(testplan.parent)
        if (parent != null) {
            if (parent.status) {
                detailedTestplan.parent = {
                    id: parent.id,
                    name: parent.name
                }
            }
        }
    }
    detailedTestplan.children = await search({parent:testPlanId})

    detailedTestplan.testCases = await TestCase.search({plan: testPlanId})
    .then(op => op.data ?? [])

    const runs = await getRuns(testPlanId)
    detailedTestplan.runs = runs

    updateOpSuccess(op, 'Detailed test plan obtained')
    op.data = detailedTestplan as DetailedTestPlan
    return op
}

export const getCases = async (testPlanId:number) : Promise<TypedOperationResult<TestCase.TestCase[]>> => {
    return TestCase.search({plan:testPlanId})
}
export const fetchCases = async (testPlanId:number) : Promise<TestCase.TestCase[]> => getCases(testPlanId).then(r => r.data ?? [], r => [])


export const search = async (params: Partial<SearchParams>) : Promise<TestPlan[]> => {
    const djangoSearch = {} as DjangoSearchParams
    if (params.id) djangoSearch.id = params.id
    if (params.name) djangoSearch.name__icontains = params.name
    if (params.nameList) djangoSearch.name__in = params.nameList
    if (params.product) djangoSearch.product = params.product
    if (params.parent) djangoSearch.parent = params.parent
    if (params.cases) djangoSearch.cases = params.cases

    const testplans = await http.search('TestPlan', djangoSearch, false)
    .catch(e => {
        console.error('Failed to search test plans', e)
        return []
    })
    return testplans.map(testplan => djangoPlan(testplan))
}

export const addToPlan = async (testCaseId:number, testPlanId:number) => {
    const login = await http.login()
    if (!login) return unAuthenticated
    const op = prepareStatus('addCaseToPlan')
    
    await http.call('TestPlan.add_case', {plan_id:testPlanId, case_id:testCaseId})
        .then(r => {
            updateOpSuccess(op, 'Test case added to plan')
        }, r => {
            console.error('Failed to add test case to plan', r)
            updateOpError(op, 'Failed to add test case to plan')
        }
        ).catch(e => {
            console.error(e)
            updateOpError(op, e.message ?? 'Failed to add test case to plan')
        })

    return op
}

export const removeFromPlan = async (testCaseId: number, testPlanId: number) => {
    const login = await http.login()
    if (!login) return unAuthenticated
    const op = prepareStatus('removeCaseFromPlan')

    await http.call('TestPlan.remove_case', {plan_id:testPlanId, case_id:testCaseId})
    .then(r => {
        updateOpSuccess(op, 'Test case removed from plan')
    }, r => {
        console.error('Failed to remove test case from plan', r)
        updateOpError(op, 'Failed to remove test case from plan')
    }
    ).catch(e => {
        console.error(e)
        updateOpError(op, e.message ?? 'Failed to remove test case from plan')
    })

    return op
}

export const update = async (testPlanId:number, testPlan: Partial<TestPlan>) => {
    const login = await http.login()
    if (!login) return unAuthenticated
    const op = prepareStatus('updatePlan')

    await http.update('TestPlan', testPlanId, 'plan_id', testPlan)
    .then(r => updateOpSuccess(op, 'Test plan updated'), e => {
        console.error('Failed to update test plan', e)
        const message = e.message ?? 'Failed to update test plan'
        updateOpError(op, message)
        return null
    }).catch(e => {
        console.error('Failed to update test plan', e)
        const message = e.message ?? 'Failed to update test plan'
        updateOpError(op, message)
        return null
    })
    
    return op
}

export const getRuns = async (testPlanId: number) => TestRun.search({plan_id: testPlanId})

type CreateParams = {
    product: {
        id: number
        version: number
    }
    name: string
    text: string
    type?: number
    isActive?: boolean
    parent? : number
}
export const create = async (data: CreateParams) : Promise<TypedOperationResult<TestPlan>> => {
    const login = await http.login()
    if (!login) return unAuthenticated
    
    // Build params - parent is optional (can be null for top-level test plans)
    const kiwiParams: any = {
        product : data.product.id,
        product_version : data.product.version,
        name: data.name,
        text: data.text,
        type : data.type ?? 1,
        is_active : data.isActive ?? true
    }
    
    // Only include parent if explicitly set
    if (data.parent !== undefined && data.parent !== null) {
        kiwiParams.parent = data.parent
    }
    
    const op = prepareStatus('createTestPlan') as TypedOperationResult<TestPlan>
    
    await http.callDjango('TestPlan.create', {values:kiwiParams})
        .then(r => {
            updateOpSuccess(op, 'Test plan created')
            const testPlan = djangoPlan(r)
            op.data = testPlan
        })
        .catch(e => {
            console.error('Failed to create test plan', e)
            const message = e.message ?? 'Failed to create test plan'
            updateOpError(op, message)
        })
    return op
}
