'use server'

import Link from 'next/link'

export default async function TestPlanLayout({children} : {children: React.ReactNode}) {
    return <>
    <nav>
        <Link href="/kiwi/plan/create">Create Test Plan</Link>
        <Link href="/kiwi/plan/search">Search Test Plans</Link>
    </nav>
    {children}
    </>
}
