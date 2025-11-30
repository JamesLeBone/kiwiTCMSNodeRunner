
import FrontendUsers from './FrontendUsers'
import { verifiedUser, list as listUsers } from '@server/lib/Users'

import SessionManagement from './SessionManagement'
import EmailVerification from './EmailVerification'

declare type pageProps = {
    currentUser: verifiedUser
}
export default async function UACControls({currentUser} : pageProps) {
    
    const userList = await listUsers()
    .then(response => response.status ? response.data : [])

    return <main>
        <nav>
            <a href="/uac/credentials">Credential Store</a>
        </nav>
        <FrontendUsers users={userList} currentUserId={currentUser.userId} />
        <SessionManagement />
        <EmailVerification />
    </main>
}
