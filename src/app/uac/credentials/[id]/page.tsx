'use server'

import { getCredentials } from '@server/Credentials'
import { redirect } from 'next/navigation'
import EditCredential from './EditCredential'

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

export default async function Page({params, searchParams}: NextPageProps) {
    const userCredentialId = await readCredentialId(params)
    if (!userCredentialId) redirect('/uac/credentials')
    
    const getCreds = await getCredentials(userCredentialId)
    if (!getCreds.status || !getCreds.data) redirect('/uac/credentials')
    
    return <main>
        <EditCredential credential={getCreds.data} />
    </main>
}
