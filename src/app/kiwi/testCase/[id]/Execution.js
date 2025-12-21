
import Link from 'next/link'
import { useStreamRunner } from '@/components/StreamRunner.js'

import { ComponentSection } from '@/components/ComponentSection'
import { IconButton } from '@/components/IconButton'
import { ActionBar } from '@/components/Actions'

function ExecutionSummary({id,run,startDate,stopDate,status,testedBy}) {
    const url = `/kiwi/execution/${id}`
    startDate == null ? '' : (new Date(startDate)).toLocaleString()
    stopDate == null ? '' : (new Date(stopDate)).toLocaleString()
    
    const hideTime = (startDate == null & stopDate == null) || status == 'idle'
    return <div>
        <Link href={url}>{id}</Link>
        <span className={status.name}> {status.name}</span>
        <div className={(hideTime ? ' hidden' : '')}>
            <label>Started:</label>
            <span>{startDate}</span>
            <label>Finished:</label>
            <span>{stopDate}</span>
        </div>
    </div>
}


export default function Execution({testCaseId,executions}) {
    const streamRunner = useStreamRunner('testCase/'+testCaseId)

    return <ComponentSection header="Executions" style={{gridColumn:'span 1'}}>
        <div style={{maxHeight:'5em', overflow:'auto'}}>
            {executions.map(execution => <ExecutionSummary key={execution.id} {...execution} />)}
        </div>
        <div className="executionResults">
            {streamRunner.results}
        </div>
        <ActionBar>
            <IconButton title="Execute" action={streamRunner.execute} className={streamRunner.buttonIcon}>Execute</IconButton>
        </ActionBar>
    </ComponentSection>
}
