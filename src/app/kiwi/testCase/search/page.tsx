'use server'

import ServerResponse from '@/components/ServerResponse'
import TestCaseSearch from './TestCaseSearch'

export const generateMetadata = async (props : NextPageProps) => {
    return { title: process.env.APP_TITLE + ' - Search Test Cases' }
}

async function parseError(params: NextPageProps) : Promise<React.ReactNode | undefined> {
    const error = (await params.searchParams)?.error as string | undefined
    if (!error) return undefined
    
    return <ServerResponse type="error">{error}</ServerResponse>
}

export default async function TestCase(params: NextPageProps) {

    const errorMessage = await parseError(params)
    return <div>
        {errorMessage}
        <TestCaseSearch />
    </div>
}
