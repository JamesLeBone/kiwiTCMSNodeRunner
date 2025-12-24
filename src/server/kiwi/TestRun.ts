'use server'
import { update } from '@server/lib/SecurityGroups'
import { DjangoEntity } from './Django'
/*
https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testrun.html#module-tcms.rpc.api.testrun
*/
import {http,methods} from './Kiwi'
import { updateOpSuccess, prepareStatus, updateOpError, TypedOperationResult } from '@lib/Operation'

export type TestRun = {
    id: number
    name: string
    createDate: Date
    startDate: Date | null
    stopDate: Date | null
    duration: number | null
    plan: {
        id: number
        name: string
    }
    executor: {
        id: number
        username: string
        firstName: string
        lastName: string
    }
    status: {
        id: number
        name: string
    }
    arguments: Record<string, any>
}
type SearchParams = {
    id?: number
    plan_id?: number
    status_id?: number
}

const getDuration = (run : TestRun) : number | null => {
    if (run.startDate == null) return null
    if (run.stopDate == null) return null
    const duration = (run.stopDate.getTime() - run.startDate.getTime()) / 1000
    return duration
}

const django2TestRun = (testRun: DjangoEntity) : TestRun => {
    testRun.convertJson('arguments')
    testRun.addZulu('createDate')
    testRun.addZulu('startDate')
    testRun.addZulu('stopDate')
    const duration = getDuration(testRun.values as TestRun)
    return {
        ...testRun.values,
        duration
    } as TestRun
}

export const fetch = async (testRunId: number) : Promise<TestRun | null> => {
    const tr = await http.get<TestRun>('TestRun', testRunId, django2TestRun)
    .catch(e => null)
    return tr
}

export const search = async (params : SearchParams) : Promise<TestRun[]> => {
    return await http.call('TestRun.filter', {query:params})
        .then((trlist: any) => {
            if (typeof trlist !== 'object' || !Array.isArray(trlist)) trlist = [trlist]
            
            const runList = trlist.map((tr: any) => django2TestRun(tr))
            const sorted = runList.sort((a : TestRun,b: TestRun) => {
                if (a.startDate == null) return 1
                if (b.startDate == null) return -1
                if (a.startDate > b.startDate) return -1
                if (a.startDate < b.startDate) return 1
                return a.id - b.id
            })
            return sorted

        }, e => [])
        .catch(e => [])
}

export const get = async (id: number) : Promise<TypedOperationResult<TestRun>> => {
    const op = prepareStatus('fetchTestRun') as TypedOperationResult<TestRun>
    await http.get<TestRun>('TestRun', id, django2TestRun)
    .then(tr => {
        if (tr != null) {
            updateOpSuccess(op, 'Test Run found')
            op.data = tr
            return
        }
        updateOpError(op, 'Test Run not found')
    }, e => updateOpError(op, 'Error fetching Test Run'))
    .catch(e => {
        console.error('Error fetching Test Run', e)
        updateOpError(op, e.message || 'Error fetching Test Run')
    })

    return op
}

type CaseListItem = {
    id: number
    summary: string
    text: string
    isAutomated: boolean
    arguments: Record<string, any>
    securityGroupId?: string
    status: string
    category: string
    product: string
    script: string
}

// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testrun.html#tcms.rpc.api.testrun.get_cases
export const getCases = async (id: number) : Promise<CaseListItem[]> => {
    /*
    Serialized list of tcms.testcases.models.TestCase objects 
    augmented with execution_id and status information.
    */
    const caseList = await http.reference('TestRun', 'get_cases', id)
    .then(xlist => {
        if (typeof xlist !== 'object' || !Array.isArray(xlist)) xlist = [xlist]

        return Promise.all(xlist.map(async (l: any) => {
            l.addZulu('createDate')
            const args = l.convertJson('arguments')
            let securityGroupId = undefined
            if (args.securityGroupId) {
                securityGroupId = args.securityGroupId
            }

            return {
                id: l.values.id,
                summary: l.values.summary,
                text: l.values.text,
                isAutomated: l.values.isAutomated,
                arguments: args,
                securityGroupId: securityGroupId,
                status: l.values.caseStatus.name,
                category: l.values.category.name,
                product: l.values.product.name,
                script: l.values.script
            } as CaseListItem
        }))
    })
    

    return caseList
}
