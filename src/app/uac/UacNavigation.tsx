'use client'
import Link from 'next/link'

export default function UACNavigation() {
    return <nav>
        <Link href="/uac">Settings</Link>
        <Link href="/uac/credentials">Credential Store</Link>
        <Link href="/setup" className='right'>Setup Wizard</Link>
    </nav>
}
