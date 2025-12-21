// @see app/api/executions/%5BtestCaseId%5D/%5Bexecution%5D/route.js


import {testPlan} from '@server/kiwi/PuppeteerExec.js'


export async function GET(request, {params}) {
    const {testPlanId} = await params
    const cmd = await testPlan(testPlanId)

    return new Response(cmd, {headers: { 'Content-Type': 'text/plain' }})
}



