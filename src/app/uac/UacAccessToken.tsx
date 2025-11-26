
import { SetPassword } from './PasswordReset'
import type { verifiedUser } from '@server/lib/Users'

declare type props = {
    verifiedUser: verifiedUser,
    accessToken: string,
    userId: number
}
export default async function UacAccessToken({verifiedUser, accessToken, userId}: props) {
    
    return <main>
        <SetPassword username={verifiedUser.username} userId={userId} accessToken={accessToken} />
    </main>
}
