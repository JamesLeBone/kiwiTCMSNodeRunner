
import { PasswordReset } from './PasswordReset'
import { LoginWidget   } from './LoginForm'

export default async function UacUnauthorised() {
    
    return <main>
        <LoginWidget />
        <PasswordReset />
    </main>
}
