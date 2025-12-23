
import UserList from './UserList'
import { verifiedUser, list as listUsers } from '@server/lib/Users'

import SessionManagement from './SessionManagement'
import EmailVerification from './EmailVerification'

type pageProps = {
    currentUser: verifiedUser
}
export default async function UACControls({currentUser} : pageProps) {
    
    const userList = await listUsers()
    .then(response => response.data ? response.data : [])

    return <main>
        <div className='ComponentGrid' style={{gridTemplateColumns: '1fr 1fr'}}>
            <UserList users={userList} currentUserId={currentUser.userId} />
            <SessionManagement />
            <EmailVerification />
        </div>
    </main>
}
