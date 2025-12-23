'use client'

import type { AmalgomatedComponent } from '@server/kiwi/Component'
import type { AmalgomatedTag } from '@server/kiwi/Tag'
import type { TestPlan } from '@server/kiwi/TestPlan'
import type { TestExecution } from '@server/kiwi/Execution'

import { TabbedComponentSection } from '@/components/ComponentSection'
import { TagList } from '@/components/kiwi/Tags'

type TestCaseAttachmentsProps = {
    testCaseId: number
    components: Array<AmalgomatedComponent>
    tags: Array<AmalgomatedTag>
    plans: Array<TestPlan>
    executions: Array<TestExecution>
}
export default function TestCaseAttachments(props: TestCaseAttachmentsProps) {
    const tags = props.tags.map(t => t.name)

    const tabs = [
        {id : 'components', label: 'Components', content: <ComponentSection components={props.components} />},
        {id : 'tags', label: 'Tags', content: <TagList tags={tags} entityType="TestCase" entityId={props.testCaseId} />},
        {id : 'plans', label: 'Test Plans', content: <div>Test Plans Content</div>},
        {id : 'executions', label: 'Test Executions', content: <div>Test Executions Content</div>}
    ]

    return <TabbedComponentSection tabs={tabs} />
}

function ComponentSection({components}: {components: Array<AmalgomatedComponent>}) {
    if (components.length === 0) return <div>No components attached.</div>
    return <div>
        Components Section
    </div>
}
