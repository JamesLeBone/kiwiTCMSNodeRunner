'use server'
import { getCredentialTypes } from '@server/Credentials'
import { redirect } from 'next/navigation'
import CreateCredential from './CreateCredential'

export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Create Credential`
    }
}


export default async function Page({params, searchParams}: NextPageProps) {
    const searchQuery = await searchParams
    const credentialTypeId = searchQuery.typeId as string | undefined
    if (!credentialTypeId) redirect('/uac/credentials')

    const types = await getCredentialTypes()
    const type = types.find(t => t.credentialTypeId.toString() === credentialTypeId)
    if (!type) redirect('/uac/credentials')

    return <main>
        <CreateCredential type={type} />
    </main>
}
