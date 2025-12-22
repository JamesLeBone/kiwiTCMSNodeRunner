'use server'

import TestCaseSearch from './TestCaseSearch'

export const generateMetadata = async (props : NextPageProps) => {
    return { title: process.env.APP_TITLE + ' - Search Test Cases' }
}

export default async function TestCase(params: NextPageProps) {
    return <div>
        <TestCaseSearch />
    </div>
}
