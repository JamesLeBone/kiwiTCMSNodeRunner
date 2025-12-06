
import { PasswordReset } from './PasswordReset'
import { LoginWidget   } from './LoginForm'
import Link from 'next/link'

export default async function UacUnauthorised() {
    
    return <main>
        <nav>
            <Link href="/setup">Setup</Link>
        </nav>
        <LoginWidget />
        <PasswordReset />
    </main>
}
