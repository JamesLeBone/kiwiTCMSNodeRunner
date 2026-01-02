'use server'
import {
    http
} from './Kiwi'

import type { ProductWithClassificationName } from './Product'
import { 
    fetch as fetchProduct
} from './Product'

export type Category = {
    id: number
    name: string
    product: number
    productRecord?: ProductWithClassificationName
    description: string
}

const djangoCategory = async (c: Category) : Promise<Category> => {
    const productRecord = await fetchProduct(c.product)
    if (productRecord) c.productRecord = productRecord
    return c
}

type CateogryByProduct = Record<number, Category[]>

export const listByProduct = async (productId?: number) : Promise<CateogryByProduct> => {
    const query : Record<string, any> = {}
    if (productId) query['product'] = productId

    const pl = await http.searchEntity<Category>('Category', query)
    .catch( e => [] )
    
    const categorylist = {} as Record<number, Category[]>
    for (const category of pl) {
        if (typeof categorylist[category.product] === 'undefined') {
            categorylist[category.product] = []
        }
        categorylist[category.product].push( category )
    }

    // console.debug('Fetched Categories', categorylist)
    return categorylist
}
export const fetchCategories = async (dtls : Partial<Category>) : Promise<Category[]> => {
    const categories = await http.searchEntity<Category>('Category', dtls, false)
    return categories
}

export const fetchCategory = async (id: number) : Promise<Category | null> => {
    const category = await http.getEntity<Category>('Category', id)
    if (!category) return null
    return djangoCategory(category)
}
