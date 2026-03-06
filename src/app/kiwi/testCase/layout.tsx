'use server'

import Link from 'next/link'
import { TestCase as TestCasePath } from '@lib/Paths'

export default async function TestCaseLayout({children} : {children: React.ReactNode}) {
    return <>
    <nav>
        <Link href={TestCasePath.create}>Create Test Case</Link>
        <Link href={TestCasePath.search}>Search Test Cases</Link>
    </nav>
    {children}
    </>
}
