
import SetPassword from './SetPassword'
import type { verifiedUser } from '@server/lib/Users'

declare type props = {
    verifiedUser: verifiedUser,
    accessToken: string
}
export default async function UacAccessToken({verifiedUser, accessToken}: props) {
    
    return <main>
        <SetPassword username={verifiedUser.username} userId={verifiedUser.userId} accessToken={accessToken} />
    </main>
}
