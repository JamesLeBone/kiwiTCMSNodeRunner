import * as Auth from '@server/Auth'
import * as Users from '@server/lib/Users'

import { EditUser } from '../UserEdit'

export const metadata = {
    title: 'Toolbox - Create User Account'
}

export default async function UserPage({params,searchParams}) {
    const currentUser = await Auth.currentUser()
    if (!currentUser) {
        return <p>You are not logged in</p>
    }

    const suppliedId = (await searchParams).userId ?? null
    if (suppliedId == null) {
        return <p>No user ID supplied</p>
    }
    const user = await Users.getUser(suppliedId)
    if (!user) {
        return <p>User not found</p>
    }
    
    return <main>
        <EditUser user={user} />
    </main>
}