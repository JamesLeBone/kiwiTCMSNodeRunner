'use server'

import {http,IndividualTag,methods, promiseBoolean} from './Kiwi'
import { success, error } from '@lib/ServerMessages'
import { DjangoEntity } from './Django'
// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.tag.html
const entityName = 'Tag'

export const addToTestCase = async (caseId:number, tagName:string) => {
    const conn = http
    const login = await conn.login()
    if (!login) return error('Failed to login')
    
    console.debug('Adding tag', tagName, 'to test case', caseId, {case_id:caseId, tag:tagName})
    const addTag = await promiseBoolean( conn.call('TestCase.add_tag', {case_id:caseId, tag:tagName}) )
    conn.logout()

    return addTag ? success('Tag added to test case') : error('Failed to add tag to test case')
}
export const removeFromTestCase = async (caseId: number, tagName: string) => {
    const conn = http
    const login = await conn.login()
    if (!login) return error('Failed to login')

    const removeTag = await promiseBoolean( conn.call('TestCase.remove_tag', {case_id:caseId, tag:tagName}) )
    conn.logout()

    return removeTag
}

export const get = async (tagId:number) => {
    const conn = http

    const listResults = await conn.getList(entityName,tagId)
    const tagResult = methods.amalgomateTags(listResults as IndividualTag[])
    return success('List obtained', tagResult)
}

const tagSearch = async (search : Promise<DjangoEntity[]>) => {
    const searchResult = await search
    const tagList = searchResult.map(dj => dj.values) as IndividualTag[]
    return methods.amalgomateTags(tagList)
}

// search({cases:testCaseId})
export declare type searchOptions = {
    cases?:number,
    tagName?:string
}
export const search = async (params: searchOptions) => {
    const conn = http
    const searchResult = conn.search(entityName, params)
    const tags = await tagSearch(searchResult)
    
    return success('Search completed', tags)
}

export declare type attachableEntityNames = 'TestCase' // | 'TestRun' | 'Bug' | 'TestPlan'
declare type kiwiTagSearchParms = {
    case? : number
}

export const getAttached = async (sourceEntity:attachableEntityNames, id:number) => {
    let param: kiwiTagSearchParms = {}
    if (sourceEntity == 'TestCase') {
        param.case = id
    } else {
        return error('Unsupported source entity for tags: '+sourceEntity)
    }

    const conn = http
    
    const searchPromise = conn.search(entityName, param, false)
    const tagList = await tagSearch(searchPromise)
    return success('List obtained', tagList)
}

export declare type TagDetail = {
    id: number,
    name: string,
    cases: {name:string, id:number}[],
    runs: number[],
    bugs: number[],
    plans: {name:string, id:number}[]
}

export const getDetail = async (tagName:string) => {
    const conn = http
    const searchPromise = conn.search(entityName, {name:tagName}, false)
    const tagList = await tagSearch(searchPromise)
    if (tagList.length == 0) {
        return error('Tag not found: '+tagName)
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
    
    return success('Tag found', detail)
}

// export {
//     get,
//     getDetail,
//     getAttached,
//     search,
//     addToTestCase,
//     removeFromTestCase
// }
