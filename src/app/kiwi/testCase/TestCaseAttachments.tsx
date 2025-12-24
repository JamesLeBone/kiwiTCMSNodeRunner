'use client'

import type { AmalgomatedComponent } from '@server/kiwi/Component'
import type { TestPlan } from '@server/kiwi/TestPlan'
import type { TestExecution } from '@server/kiwi/Execution'

import { TabbedComponentSection } from '@/components/ComponentSection'
import { TagList } from '@/components/kiwi/Tags'
import TestPlanSearch, { TestPlanTable } from '@/components/kiwi/TestPlanSearch'
import { useState } from 'react'
import { TestCaseDetail } from '@server/kiwi/TestCase'
import TestCaseLineage from './TestCaseLineage'

import KiwiComments from '@/components/kiwi/KiwiComments'

type TestCaseAttachmentsProps = {
    testCaseId: number
    details: TestCaseDetail
}
export default function TestCaseAttachments(props: TestCaseAttachmentsProps) {
    const tags = props.details.tags.map(t => t.name)
    const testCaseId = props.testCaseId
    const { testCase, components, plans, executions, children, comments } = props.details

    const tabs = [
        {id : 'components', label: 'Components', content: <ComponentSection components={components} />},
        {id : 'tags', label: 'Tags', content: <TagList tags={tags} entityType="TestCase" entityId={testCaseId} />},
        {id : 'plans', label: 'Test Plans', content: <TestPlanSection plans={plans} />},
        {id : 'executions', label: 'Test Executions', content: <TestExecutionSection executions={executions} />},
        {id : 'lineage', label: 'Lineage', content: <TestCaseLineage testCaseId={testCaseId} script={testCase.script} children={children} /> },
        {id : 'comments', label: 'Comments', content: <KiwiComments id={testCaseId} comments={comments} /> }
    ]

    return <TabbedComponentSection tabs={tabs} />
}

function ComponentSection({components}: {components: Array<AmalgomatedComponent>}) {
    if (components.length === 0) return <div>No components attached.</div>
    return <div>
        Components Section
    </div>
}

type tpsProps = {
    plans: TestPlan[]
}
function TestPlanSection(props: tpsProps) {
    const [planList, setPlanList] = useState<TestPlan[]>(props.plans)
    const addPlan = (plan: TestPlan) => {
        setPlanList([...planList, plan])
    }

    return <div>
        <TestPlanTable plans={planList} />
        <TestPlanSearch addPlan={addPlan} />
    </div>
}

type tesProps = {
    executions: TestExecution[]
}
function TestExecutionSection(props: tesProps) {
    if (props.executions.length === 0) return <p>No executions found.</p>
    return <div>
        { props.executions.map(execution => 
            <div key={execution.id}>
                Execution #{execution.id} - Status: {execution.status}
            </div>
        ) }
    </div>
}
