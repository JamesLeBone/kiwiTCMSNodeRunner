
import CredentialTypeList from './CredentialTypeList'
import { getCredentialTypes } from '@server/Credentials'

export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Credentials`
    }
}


export default async function Page() {
    const types = await getCredentialTypes()

    return <main>
        <CredentialTypeList types={types} />
    </main>
}
