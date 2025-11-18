'use server'

import Link from 'next/link'
import { PasswordReset } from './uac/PasswordReset'
import { LoginWidget   } from './uac/LoginForm'

export async function generateMetadata({ params, searchParams },parent) {
    return {
        title: 'Toolbox'
    }
}


export default async function Home() {

    return <main>
        <Link href="https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.html#module-tcms.rpc.api">Kiwi API Docs</Link>
        <Link href="http://kiwi.ftg.sil0.net/">Kiwi</Link>

        <LoginWidget />
        <PasswordReset />
    </main>
}
