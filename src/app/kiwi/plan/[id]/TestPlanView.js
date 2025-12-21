'use client'

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { DateDisplay } from '@/components/DateDisplay'
import { MarkdownDisplay } from '@/components/MarkDownDisplay'

import Link from 'next/link'
import './page.css'
import { kiwiBaseUrl } from '@lib/Functions'

import { TestCaseViewList } from './TestCaseList';

const Run = ({id,startDate,stopDate,manager}) => {
    const url = '/kiwi/run/'+id
    return <>
        <Link href={url}>{id}</Link>
        <span className='date'>
            <DateDisplay dateValue={startDate} />
            <DateDisplay dateValue={stopDate} />
        </span>
        <span className='executor'>
            Executor: {manager.username}
        </span>
    </>
}

function TestRuns({runs}) {
    return <ComponentSection header="Test Runs">
        <div className='test-runs'>
            {runs.map((run) => <Run key={run.id} {...run} />)}
        </div>
    </ComponentSection>
}

function ParentLink({parent}) {
    if (parent == null) return <div></div>
    
    const url = '/kiwi/plan/'+parent.id
    return <span>
        Parent test plan: <Link href={url}>{parent.name}</Link>
    </span>
}

export default function TestPlan(kiwiTestPlan) {
    // console.debug(kiwiTestPlan)
    const {id,createDate,parent} = kiwiTestPlan
    const text  = kiwiTestPlan.text
    const name  = kiwiTestPlan.name
    const isActive = kiwiTestPlan.isActive ? 'Yes' : 'No'
    const version = kiwiTestPlan.productVersion.value
    const kiwiUrl = kiwiBaseUrl()+'/plan/'+id

    return <div>
        <ComponentSection header={id}>
            <div>
                <Link href={kiwiUrl} target="kiwi">Kiwi</Link>
                <ParentLink parent={parent} />
                <span className='version'>Version: {version}</span>
            </div>
            <fieldset>
                <FormField label="Name"><p>{name}</p></FormField>
                <FormField label="Created"><DateDisplay state={createDate} /></FormField>
                <FormField label="Is Active?"><p>{isActive}</p></FormField>
            </fieldset>
            <FormField label="Description">
                <MarkdownDisplay state={text} />
            </FormField>
        </ComponentSection>
        <TestRuns runs={kiwiTestPlan.runs} />
        <TestCaseViewList cases={kiwiTestPlan.testCases} />
    </div>
}
