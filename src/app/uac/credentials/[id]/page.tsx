'use server'

import { getCredentials } from '@server/Credentials'
import { redirect } from 'next/navigation'
import EditCredential from './EditCredential'

import { listByProduct as getCategoryList } from '@server/kiwi/Category'
import { fetchList as getProducts } from '@server/kiwi/Product'

export async function generateMetadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Create Credential`
    }
}

async function readCredentialId(params:any) {
    const p = await params
    if (!p.id || isNaN(parseInt(p.id))) return
    return parseInt(p.id)
}

export type categoryOptionList = {
    product : {
        id: number,
        name: string
    }
    categories: {
        id: number,
        name: string
    }[]
}[]

export default async function Page({params, searchParams}: NextPageProps) {
    const userCredentialId = await readCredentialId(params)
    if (!userCredentialId) redirect('/uac/credentials')
    
    const getCreds = await getCredentials(userCredentialId)
    if (!getCreds.status || !getCreds.data) redirect('/uac/credentials')

    const products = await getProducts()

    const categories = await getCategoryList()
    .then(cl => {
        const joinedList:categoryOptionList = []
        for (const [productId, categoryList] of Object.entries(cl)) {
            const product = products.find( p => p.id.toString() === productId )
            if (!product) continue

            const formattedList = categoryList.map( c => ({ id: c.id, name: c.name }) )
            joinedList.push( {
                product: { id: product.id, name: product.name },
                categories: formattedList
            } )
        }
        return joinedList
    })
    
    return <main>
        <EditCredential credential={getCreds.data} categories={categories} />
    </main>
}
