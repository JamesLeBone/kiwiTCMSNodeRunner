'use server'

import {AmlgomatedTag, http,IndividualTag,methods, promiseBoolean} from './Kiwi'
import { Operation, TypedOperationResult, unauthorised } from '@lib/Operation'
import { DjangoEntity } from './Django'
// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.tag.html
const entityName = 'Tag'

export const addToTestCase = async (caseId:number, tagName:string) : Promise<Operation> => {
    const conn = http
    const login = await conn.login()
    if (!login) return unauthorised
    
    console.debug('Adding tag', tagName, 'to test case', caseId, {case_id:caseId, tag:tagName})
    const addTag = await promiseBoolean( conn.call('TestCase.add_tag', {case_id:caseId, tag:tagName}) )
    conn.logout()

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
    conn.logout()

    return {
        id: 'removeTagFromTestCase',
        status: removeTag,
        message: removeTag ? 'Tag removed' : 'Failed to remove tag'
    }
}

export const get = async (tagId:number) : Promise<TypedOperationResult<AmlgomatedTag>> => {
    const conn = http

    const listResults = await conn.getList(entityName,tagId)
    const tagResult = methods.amalgomateTags(listResults as IndividualTag[])
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
    return methods.amalgomateTags(tagList)
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

export const getAttached = async (sourceEntity:attachableEntityNames, id:number) : Promise<AmlgomatedTag[]> => {
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

export declare type TagDetail = {
    id: number,
    name: string,
    cases: {name:string, id:number}[],
    runs: number[],
    bugs: number[],
    plans: {name:string, id:number}[]
}

export const getDetail = async (tagName:string) : Promise<TypedOperationResult<TagDetail>> => {
    const op = {
        id: 'getTagDetail',
        status: false,
        message: ''
    } as TypedOperationResult<TagDetail>

    const conn = http
    const searchPromise = conn.search(entityName, {name:tagName}, false)
    const tagList = await tagSearch(searchPromise)
    if (tagList.length == 0) {
        return op.message = 'Tag not found: '+tagName, op
    }
    const tag = tagList[0]
    const detail : TagDetail = {
        id: tag.id,
        name: tag.name,
        cases: [],
        runs: [],
        bugs: [],
        plans: []
    }

    for (const testCaseId of tag.cases) {
        const testCase = await conn.get('TestCase', testCaseId).then(dj => dj.values)
        const s = {name:testCase.summary, id:testCaseId}
        detail.cases.push(s)
    }
    detail.runs = tag.runs
    detail.bugs = tag.bugs
    for (const planId of tag.plans) {
        const testPlan = await conn.get('TestPlan', planId).then(dj => dj.values)
        const s = {name:testPlan.name, id:planId}
        detail.plans.push(s)
    }

    op.status = true
    op.message = 'Tag found'
    op.data = detail
    
    return op
}
