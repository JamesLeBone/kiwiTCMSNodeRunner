import * as Auth from '@server/Auth'

export const metadata = {
    title: 'Toolbox - Credential Store'
}

export default async function Page({params,searchParams}) {
    const currentUser = await Auth.currentUser()
    if (!currentUser) {
        return <p>You are not logged in</p>
    }

    return <main>
    </main>
}
