'use server'
import { getDetail } from '@server/kiwi/TestPlan'
import TestPlanSearch from '@/components/kiwi/TestPlanSearch'
import TestPlanEdit from './TestPlanEdit'
import TestPlanAttachments from './TestPlanAttachments'

export async function generateMetadata(props : NextPageProps) {
    const id = (await props.params).id
    const metaData = {title: process.env.APP_TITLE + ` - Test Plan`}
    if (id) metaData.title += ` #${id}`
    return metaData
}

export default async function PlanPage(params: NextPageProps) {
    const searchParams = await params.searchParams
    if (!searchParams || !searchParams.id) return <TestPlanSearch />

    const testPlanId = Number.parseInt(searchParams.id as string)
    if (isNaN(testPlanId)) return <TestPlanSearch />

    const response = await getDetail(testPlanId)
    if (!response.status || !response.data) {
        return <TestPlanSearch />
    }
    const testPlan = response.data

    return <>
        <TestPlanEdit testPlan={testPlan} />
        <TestPlanAttachments testPlan={testPlan} />
    </>
}
