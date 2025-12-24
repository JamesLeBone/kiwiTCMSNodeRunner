'use client'
import { DetailedTestPlan } from '@server/kiwi/TestPlan'
import { TabbedComponentSection } from '@/components/ComponentSection'
import type { TestRun } from '@server/kiwi/TestRun'

import Link from 'next/link'
import { DateDisplay } from '@/components/DateDisplay'
import { TestCase } from '@server/kiwi/TestCase'
import TestCaseList from '@/components/kiwi/TestCaseList'

export default function TestPlanAttachments({ testPlan }: { testPlan: DetailedTestPlan }) {
    const { id } = testPlan
    const tabs = [
        {id:'children', label: 'Children Test Plans', content: <ChildrenTestPlans parentId={id} children={testPlan.children} />},
        {id:'runs', label: 'Recent Test Runs', content: <TestRuns runs={testPlan.runs} />},
        {id:'cases', label: 'Test Cases', content: <TestCases cases={testPlan.testCases} /> }
    ]

    return <TabbedComponentSection tabs={tabs} />
}

/*
    <TestPlanRunner planId={id} />
<TestCaseList testPlanId={id} cases={kiwiTestPlan.testCases} />
*/
type ctp = {
    parentId: number
    children: {
        id: number
        name: string
        isActive: boolean
    }[]
}
function ChildrenTestPlans({parentId, children} : ctp) {
    if (children.length == 0) {
        return <div>No child test plans</div>
    }
    return <ul>
        {children.map(c => {
            const {id,name,isActive} = c
            const activeDisplay = isActive ? '' : ' (Inactive)'
            return <li key={id}>
                <Link href={'/kiwi/plan/'+id}>{name}{activeDisplay}</Link>
            </li>
        })}
    </ul>
}

const Run = (run: TestRun) => {
    const url = '/kiwi/run/'+run.id
    
    return <>
        <Link href={url}>{run.id}</Link>
        <span className='date'>
            <DateDisplay date={run.startDate} />
            <DateDisplay date={run.stopDate} />
        </span>
        <span className='executor'>
            Executor: {run.executor.username}
        </span>
    </>
}

type trp = {
    runs: TestRun[]
}
function TestRuns({runs} : trp) {
    const limitedRuns = []
    const nowDate = new Date()
    const offset = new Date(nowDate.setMonth(nowDate.getMonth() - 1))

    for (let run of runs) {
        if (!run.startDate) continue
        const startDate = run.startDate
        if (startDate >= offset) {
            limitedRuns.push(run)
        }
    }

    return limitedRuns.map((run) => <Run key={run.id} {...run} />)
}

function TestCases({cases} : {cases: TestCase[]}) {
    return <TestCaseList cases={cases} />
}
