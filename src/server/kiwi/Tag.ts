'use server'

import { http,methods,promiseBoolean } from './Kiwi'
import { Operation, prepareStatus, TypedOperationResult, unauthorised, updateOpSuccess } from '@lib/Operation'
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
export type AmlgomatedTag = {
    id: number,
    name: string,
    cases: TestCase[],
    plans: number[],
    bugs: number[],
    runs: number[]
}

export const amalgomateTags = async (list: IndividualTag[]) : Promise<AmlgomatedTag[]> => {
    const tagList = {} as Record<number,AmlgomatedTag>
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

export const addToTestCase = async (caseId:number, tagName:string) : Promise<Operation> => {
    const conn = http
    const login = await conn.login()
    if (!login) return unauthorised
    
    console.debug('Adding tag', tagName, 'to test case', caseId, {case_id:caseId, tag:tagName})
    const addTag = await conn.call('TestCase.add_tag', {case_id:caseId, tag:tagName})
    
    const op = prepareStatus('addTagToTestCase')

    return {
        id: 'addTagToTestCase',
        status: addTag,
        message: addTag ? 'Tag added' : 'Failed to add tag'
    }
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

export const get = async (tagId:number) : Promise<TypedOperationResult<AmlgomatedTag>> => {
    const conn = http

    const listResults = await conn.getList(entityName,tagId)
    const tagResult = await amalgomateTags(listResults as IndividualTag[])
    const op = {
        id: 'getTag',
        status: tagResult.length > 0,
        message: tagResult.length > 0 ? 'Tag obtained' : 'Tag not found'
    } as TypedOperationResult<AmlgomatedTag>
    if (tagResult.length > 0) {
        op.data = tagResult[0]
    }
    return op
}

const tagSearch = async (search : Promise<DjangoEntity[]>) : Promise<AmlgomatedTag[]> => {
    const searchResult = await search
    const tagList = searchResult.map(dj => dj.values) as IndividualTag[]
    return amalgomateTags(tagList)
}

// search({cases:testCaseId})
export declare type searchOptions = {
    cases?:number,
    tagName?:string
}
export const search = async (params: searchOptions) : Promise<AmlgomatedTag[]> => {
    const conn = http
    const searchResult = conn.search(entityName, params)
    return tagSearch(searchResult)
}

export declare type attachableEntityNames = 'TestCase' // | 'TestRun' | 'Bug' | 'TestPlan'
declare type kiwiTagSearchParms = {
    case? : number
}

export const getAttachedTags = async (sourceEntity:attachableEntityNames, id:number) : Promise<AmlgomatedTag[]> => {
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
