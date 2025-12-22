'use server'
import {
    http
} from './Kiwi'

// import type { ProductWithClassificationName } from './Product'
// import { 
//     fetch as fetchProduct
// } from './Product'

export declare type Priority = {
    id: number
    value: string // typically 'P1' - 'P5'
    isActive: boolean
}

export const fetchPriorities = async (dtls : Partial<Priority>) : Promise<Priority[]> => {
    const query : Record<string, any> = {}
    if (dtls.isActive) query.is_active = dtls.isActive
    if (dtls.id) query.id = dtls.id
    if (dtls.value) query.value = dtls.value

    const pl = await http.searchEntity<Priority>('Priority', query, false)
    .catch( e => [] )
    
    console.debug('Fetched Priorities',query, pl)
    return pl.sort( (a,b) => {
        const aValue = parseInt(a.value.replace('P',''))
        const bValue = parseInt(b.value.replace('P',''))
        return aValue - bValue
    })
}

export const listPriorities = async (onlyActive?: boolean) : Promise<Priority[]> => {
    const query : Record<string, any> = {}
    if (onlyActive) query.is_active = true 

    const pl = await http.searchEntity<Priority>('Priority', query, false)
    .catch( e => [] )
    
    console.debug('Fetched Priorities',query, pl)
    return pl.sort( (a,b) => {
        const aValue = parseInt(a.value.replace('P',''))
        const bValue = parseInt(b.value.replace('P',''))
        return aValue - bValue
    })
}

export const createPriority = async (value: string, isActive: boolean) : Promise<Priority|null> => {
    const createPriority = await http.create<Priority>('Priority', {
        value, 
        isActive
    })
    if (!createPriority) return null
    return createPriority
}
