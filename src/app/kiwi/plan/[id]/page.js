import TestPlanEdit from './TestPlanEdit.js'
import TestPlanView from './TestPlanView.js'
// import * as TestCase from '@server/kiwi/TestCase.js'
import * as TestPlan from '@server/kiwi/TestPlan.js'
import * as Auth from '@server/Auth'

// This only works on server components, on the client side you need to use useEffect to set document.title
const metadata = {
    title: 'Test Plan Edit'
}

export async function generateMetadata({ params, searchParams },parent) {
    const id = (await params).id
    const planRequest = await TestPlan.get(id)

    if (planRequest.status) {
        metadata.title = `Test Plan Edit - ${id} - ${planRequest.message.name}`
        return metadata
    }
    metadata.title = `Test Plan Edit - Test plan #${id}`
    return metadata
}


export default async function TestPlanPage({params,searchParams}) {
    const testPlanId = (await params).id ?? null

    if (testPlanId == null) {
        return <div>Test Plan ID is required</div>
    }

    const currentUser = await Auth.currentUser()

    // uses our server.
    const response = await TestPlan.getDetail(testPlanId)
    if (!response.status) {
        return <div>Test Plan {testPlanId}: {response.message}</div>
    }
    const testPlan = response.message

    if (!currentUser) {
        return <TestPlanView {...testPlan} />
    }
    // console.debug(response.message)

    return <TestPlanEdit {...testPlan} />
}

