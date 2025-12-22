'use server'

import Link from 'next/link'

export default async function TestCaseLayout({children} : {children: React.ReactNode}) {
    return <>
    <nav>
        <Link href="/kiwi/testCase/create">Create Test Case</Link>
        <Link href="/kiwi/testCase/search">Search Test Cases</Link>
    </nav>
    {children}
    </>
}
