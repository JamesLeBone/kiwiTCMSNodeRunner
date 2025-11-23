import TestCaseSearch from '@/components/kiwi/TestCaseSearch'
import TestPlanSearch from '@/components/kiwi/TestPlanSearch'
import { ComponentSearch } from '@/components/kiwi/Component'
import { TagSearch } from '@/components/kiwi/Tags'

// Static metadata for the page
export const metadata = {
    title: 'Kiwi Testing'
}

export default function Home() {

    return (
        <main>
            <TestCaseSearch />
            <TestPlanSearch />
            <ComponentSearch />
            <TagSearch />
        </main>
    )
}
