'use server'

import { http,methods,promiseBoolean } from './Kiwi'
import { Operation, prepareStatus, StatusOperation, TypedOperationResult, unauthorised, updateOpError, updateOpSuccess } from '@lib/Operation'
import { DjangoEntity } from './Django'
import { fetchTestCase } from './TestCase'
import type { TestCase } from './TestCase'
// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.tag.html
const entityName = 'Tag'

export type IndividualTag = {
    id: number,
    name: string,
    cases: number,
    plan: number,
    bugs: number,
    run: number
}
export type AmalgomatedTag = {
    id: number,
    name: string,
    cases: TestCase[],
    plans: number[],
    bugs: number[],
    runs: number[]
}
export type searchOptions = {
    case:number
    name:string
    bugs:number
    id:number
    plan:number
    run:number
    testcasetag:string
    testplantag:string
    testruntag:string
}
export type attachableEntityNames = 'TestCase' // | 'TestRun' | 'Bug' | 'TestPlan'
type kiwiTagSearchParms = {
    case? : number
}


export const amalgomateTags = async (list: IndividualTag[]) : Promise<AmalgomatedTag[]> => {
    const tagList = {} as Record<number,AmalgomatedTag>
    const caseCache = {} as Record<number, TestCase>

    for (const tag of list) {
        const tagId = tag.id

        const testCaseId = tag.cases
        const planId = tag.plan
        const bugId = tag.bugs
        const runId = tag.run
        
        if (typeof tagList[tagId] == 'undefined') {
            tagList[tagId] = {
                id:tagId,
                name: tag.name,
                cases:[] as TestCase[],
                plans:[],
                bugs:[],
                runs:[]
            }
        }
        if (testCaseId != null)
            if ( caseCache[testCaseId] == null ) {
                const testCase = await fetchTestCase(testCaseId)
                if (testCase != null) {
                    caseCache[testCaseId] = testCase
                    tagList[tagId].cases.push(testCase)
                }
            }
        if (planId != null)
            tagList[tagId].plans.push(planId)
        if (bugId != null)
            tagList[tagId].bugs.push(bugId)
        if (runId != null)
            tagList[tagId].runs.push(runId)
    }
    
    const resultList = Object.values(tagList)
    resultList.sort((a,b) => {
        if (a.name > b.name) return 1
        return b.name > a.name ? -1:0
    })
    return resultList
}

export const addTo = async (entityName: attachableEntityNames, entityId:number, tagName:string) : Promise<StatusOperation> => {
    const login = await http.login()
    if (!login) return { ...unauthorised, statusType: 'error' }

    const op = prepareStatus('addTagTo'+entityName) as StatusOperation

    if (entityName != 'TestCase') return updateOpError(op, 'Unsupported entity type'), op
    const paramName = 'case_id'
    const params = {
        tag: tagName,
        [paramName]: entityId
    }

    // Even on succeess, this returns null.
    const addTag = await http.call(entityName+'.add_tag', params)
    .then(() => true)
    .catch(e => {
        console.error('Failed to add tag to '+entityName, e)
        return false
    })
    // console.debug('Tag add result:', addTag)
    if (addTag) {
        updateOpSuccess(op, 'Tag added to '+entityName)
    } else {
        updateOpError(op, 'Failed to add tag to '+entityName)
    }
    return op
}
export const removeFromTestCase = async (caseId: number, tagName: string) : Promise<Operation> => {
    const conn = http
    const login = await conn.login()
    if (!login) return unauthorised

    const removeTag = await promiseBoolean( conn.call('TestCase.remove_tag', {case_id:caseId, tag:tagName}) )
    // Don't logout - we're using a shared singleton session

    return {
        id: 'removeTagFromTestCase',
        status: removeTag,
        message: removeTag ? 'Tag removed' : 'Failed to remove tag'
    }
}

export const get = async (tagId:number) : Promise<TypedOperationResult<AmalgomatedTag>> => {
    const conn = http

    const listResults = await conn.getList(entityName,tagId)
    const tagResult = await amalgomateTags(listResults as IndividualTag[])
    const op = {
        id: 'getTag',
        status: tagResult.length > 0,
        message: tagResult.length > 0 ? 'Tag obtained' : 'Tag not found'
    } as TypedOperationResult<AmalgomatedTag>
    if (tagResult.length > 0) {
        op.data = tagResult[0]
    }
    return op
}

const tagSearch = async (search : Promise<DjangoEntity[]>) : Promise<AmalgomatedTag[]> => {
    const searchResult = await search
    const tagList = searchResult.map(dj => dj.values) as IndividualTag[]
    return amalgomateTags(tagList)
}

export const search = async (params: Partial<searchOptions>) : Promise<TypedOperationResult<AmalgomatedTag[]>> => {
    const op = prepareStatus('searchTags') as TypedOperationResult<AmalgomatedTag[]>
    if (Object.keys(params).length == 0) {
        updateOpError(op, 'No search parameters provided')
        return op
    }

    const searchResult = http.search(entityName, params)
    const amalgomatedTags = await tagSearch(searchResult)

    if (amalgomatedTags.length == 0) {
        updateOpError(op, 'No tags found')
    } else {
        updateOpSuccess(op, 'Tags found')
        op.data = amalgomatedTags
    }
    return op
}
export const getAttachedTags = async (sourceEntity:attachableEntityNames, id:number) : Promise<AmalgomatedTag[]> => {
    let param: kiwiTagSearchParms = {}
    if (sourceEntity == 'TestCase') {
        param.case = id
    } else {
        return []
    }

    const conn = http
    
    const searchPromise = conn.search(entityName, param, false)
    return tagSearch(searchPromise)
}
