'use server'
import * as Auth from '@server/Auth'

import UACControls from './components/UacControls'
import UacUnauthorised from './components/UacUnauthorised'

// This only works on server components, on the client side you need to use useEffect to set document.title
export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - User accounts`
    }
}

export default async function UserPage({params,searchParams} : NextPageProps) {
    const userInfo = await Auth.currentUser()
    if (!userInfo.status || !userInfo.data) {
        console.info('User unauthorised')
        return <UacUnauthorised />
    }

    return <UACControls currentUser={userInfo.data} />

}

