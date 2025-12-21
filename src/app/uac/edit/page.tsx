'use server'
import * as Auth from '@server/Auth'
import * as Users from '@server/lib/Users'

import { redirect } from 'next/navigation'
import { UserEdit } from './UserEdit'

export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Edit User`
    }
}

export default async function UserPage({params,searchParams} : NextPageProps) {
    const currentUser = await Auth.currentUser()
    if (!currentUser || !currentUser.data) redirect('/uac')

    let user = currentUser.data

    const suppliedId = (await searchParams).userId
    if (suppliedId != null && Array.isArray(suppliedId) === false) {
        const dbUser = await Users.getUser(Number.parseInt(suppliedId))
        if (!dbUser) {
            return <p>User not found</p>
        }
        return <main>
            <UserEdit user={dbUser} />
        </main>
    }
    
    return <main>
        <UserEdit user={user} />
    </main>
}