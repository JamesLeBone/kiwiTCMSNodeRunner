'use server'
import CredentialTypeList from './CredentialTypeList'
import CredentialList from './CredentialList'
import { getCredentialTypes, listUserCredentials } from '@server/Credentials'

export async function generateMetadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Credentials`
    }
}


export default async function Page() {
    const types = await getCredentialTypes()
    const credentialList = await listUserCredentials().then(res => res.data ?? [])

    return <main>
        <div>
            <CredentialTypeList types={types} />
        </div>
        <CredentialList list={credentialList} />
    </main>
}
