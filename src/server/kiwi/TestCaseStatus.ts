'use server'
import {http, unAuthenticated} from './Kiwi'
import { updateOpSuccess, prepareStatus, updateOpError, TypedOperationResult } from '@lib/Operation'
// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testcasestatus.html
export declare type CaseStatus = {
    id: number
    name: string
    description: string
}
declare type KiwiCaseStatus = {
    id: number
    name: string
    description: string
    is_confirmed: boolean
}

export const fetchAll = async () : Promise<CaseStatus[]> => {
    const sess = await http.login()
    if (!sess) return []
        
    const reply = await http.searchEntity<KiwiCaseStatus>('TestCaseStatus')
    .then(results => {
        return results.map( (result: KiwiCaseStatus)  => {
            const defaultDescription = result.name.toString().replace(/ /g, '_')
            
            const v : CaseStatus = {
                id: result.id,
                name: result.name,
                description: result.description && result.description.length > 0 ? result.description : defaultDescription
            }
            return v
        })
    })
    .catch( e => {
        console.error('Failed to get case statuses', e)
        return []
    })
    return reply
}

// Not used yet.
export const create = async (name: string, description: string) : Promise<TypedOperationResult<KiwiCaseStatus>> => {
    const params = {name,description}
    const op = prepareStatus('createCaseStatus') as TypedOperationResult<KiwiCaseStatus>
    await http.call('TestCaseStatus.create', params)
    .then( (result: KiwiCaseStatus) => {
        updateOpSuccess(op, 'Case status created successfully')
        op.data = result
    }, e => {
        // ValueError if invalid values
        // PermissionDenied if testcases.add_testcasestatus failed
        console.error('Failed to create case status', e)
        updateOpError(op, 'Failed to create case status')
    })
    return op
}