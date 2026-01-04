'use server'
import { getDetail } from '@server/kiwi/TestPlan'
import TestPlanSearch from '@/components/kiwi/TestPlanSearch'
import TestPlanEdit from './TestPlanEdit'
import TestPlanAttachments from './TestPlanAttachments'

import { ComponentSection } from '@/components/ComponentSection'

export async function generateMetadata(props : NextPageProps) {
    const id = (await props.searchParams).id
    const metaData = {title: process.env.APP_TITLE + ` - Test Plan`}
    if (id) metaData.title += ` #${id}`
    return metaData
}

function SearchComponentSection() {
    return <ComponentSection header="Test Plan Search" className={['fill']}>
        <TestPlanSearch actions={[]} />
    </ComponentSection>
}

export default async function PlanPage(params: NextPageProps) {
    const searchParams = await params.searchParams
    if (!searchParams || !searchParams.id) return <SearchComponentSection />

    const testPlanId = Number.parseInt(searchParams.id as string)
    if (isNaN(testPlanId)) return <SearchComponentSection />

    const response = await getDetail(testPlanId)
    if (!response.status || !response.data) {
        return <SearchComponentSection />
    }
    const testPlan = response.data

    return <>
        <TestPlanEdit testPlan={testPlan} />
        <TestPlanAttachments testPlan={testPlan} />
    </>
}
