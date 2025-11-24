'use server'
import * as Auth from '@server/Auth'
import * as Users from '@server/Users'

import FrontendUsers from './FrontendUsers.js'
import { ActionBar } from '@/components/Actions'
import SessionManagement from './SessionManagement'

import { PasswordReset, SetPassword } from './PasswordReset'
import { LoginWidget   } from './LoginForm'
import EmailVerification from './EmailVerification'
import type { OperationResult } from '@lib/Operation.js'

// This only works on server components, on the client side you need to use useEffect to set document.title
export async function metadata() {
    return { title: 'Toolbox - User accounts' }
}

declare type verfiedUser = {
    verifiedUser: any,
    accessToken: string,
    userId: number
}
const determineUser = async (searchParams : { accessToken?: string, userId?: string }) : Promise<verfiedUser | false | OperationResult> => {
    if (typeof searchParams.accessToken == 'undefined' || typeof searchParams.userId == 'undefined') {
        return Auth.currentUser()
    }
    if (isNaN(Number.parseInt(searchParams.userId))) {
        return Auth.currentUser()
    }
    if (typeof searchParams.accessToken !== 'string' || searchParams.accessToken.length < 10) {
        return Auth.currentUser()
    }
    const userIdNumber = Number.parseInt(searchParams.userId)
    if (isNaN(userIdNumber) || userIdNumber < 1) {
        return Auth.currentUser()
    }

    const vfUser = await Users.verifyToken(userIdNumber, searchParams.accessToken)
    if (!vfUser.status) {
        console.info('Access token rejected', vfUser)
        return false
    }
    console.info('Access token accepted', vfUser.data)
    return {
        verifiedUser: vfUser.data,
        accessToken: searchParams.accessToken,
        userId: userIdNumber
    } as verfiedUser
}

function LoggedOut() {
    return <main>
        <LoginWidget />
        <PasswordReset />
    </main>
}

export default async function UserPage({params,searchParams} : NextPageProps) {
    const sp = await searchParams

    const cuserOperation = await determineUser(sp)
    if (!cuserOperation) return <LoggedOut />

    if ('verifiedUser' in cuserOperation) {
        const verifiedUser = cuserOperation as verfiedUser
        return <main>
            <SetPassword username={verifiedUser.verifiedUser.username} userId={verifiedUser.userId} accessToken={verifiedUser.accessToken} />
        </main>
    }
    const currentUser = (cuserOperation as OperationResult).data

    const userList = await Users.list()
    .then(response => response.status ? response.data : [])

    return <main>
        <ActionBar>
            <a href="/uac/credentials">Credential Store</a>
        </ActionBar>
        <FrontendUsers users={userList} currentUserId={currentUser.userId} />
        <SessionManagement />
        <EmailVerification />
    </main>
}

