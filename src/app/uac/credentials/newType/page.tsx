
import CreateCredentialType from './CreateCredentialType'

export async function generateMetadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Create Credential Type`
    }
}


export default async function Page() {
    return <main>
        <CreateCredentialType />
    </main>
}
