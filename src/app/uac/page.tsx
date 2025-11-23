'use server'
import * as Auth from '@server/Auth'
import * as Users from '@server/Users'

import FrontendUsers from './FrontendUsers.js'
import { ActionBar } from '@/components/Actions'
import SessionManagement from './SessionManagement'

import { PasswordReset, SetPassword } from './PasswordReset'
import { LoginWidget   } from './LoginForm'
import EmailVerification from './EmailVerification'

// This only works on server components, on the client side you need to use useEffect to set document.title
export async function metadata() {
    return { title: 'Toolbox - User accounts' }
}

const determineUser = async (searchParams) => {
    if (typeof searchParams.accessToken == 'undefined' || typeof searchParams.userId == 'undefined') {
        return Auth.currentUser()
    }
    if (isNaN(Number.parseInt(searchParams.userId))) {
        return Auth.currentUser()
    }
    if (typeof searchParams.accessToken !== 'string' || searchParams.accessToken.length < 10) {
        return Auth.currentUser()
    }

    const vfUser = await Users.verifyToken(searchParams.userId, searchParams.accessToken)
    if (!vfUser.status) {
        console.info('Access token rejected', vfUser)
        return false
    }
    console.info('Access token accepted', vfUser.data)
    return vfUser.data
}

function LoggedOut() {
    return <main>
        <LoginWidget />
        <PasswordReset />
    </main>
}

export default async function UserPage({params,searchParams}) {
    const sp = await searchParams

    const currentUser = await determineUser(sp)

    if (!currentUser) return <LoggedOut />

    const doPrompt = await Users.promptPasswordReset(currentUser.userId)
    .then(r => r.status && r.data)
    // console.debug('Prompt password reset result', doPrompt)

    if (doPrompt) {
        return <main>
            <SetPassword username={currentUser.username} userId={sp.userId} accessToken={sp.accessToken} />
        </main>
    }

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

