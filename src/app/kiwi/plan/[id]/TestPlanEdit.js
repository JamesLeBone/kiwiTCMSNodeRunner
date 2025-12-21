'use client'

import { useState } from 'react';

import { ActionBar, ActionButton } from '@/components/Actions'
import { SelectBoolean } from '@/components/Selection'

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { DateDisplay } from '@/components/DateDisplay'
import { InputField } from '@/components/InputField'
import { MarkdownSection } from '@/components/MarkDownDisplay'

import Link from 'next/link'

import * as tp from '@server/kiwi/TestPlan.js'
import './page.css'
import { kiwiBaseUrl } from '@lib/Functions'

import TestCaseList from './TestCaseList';
import { TestPlanRunner } from '@/components/kiwi/ScriptExecution'

const useTestPlanConn = testPlanId => {
    return {
        get: () => tp.get(testPlanId),
        search: (conditions) => tp.search(conditions),
        updatePlan: (name,text,isActive) => tp.update(testPlanId,{
            name:name,
            text:text,
            isActive:isActive
        })
    }
}

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
    const limitedRuns = []
    const nowDate = new Date()
    const offset = new Date(nowDate.setMonth(nowDate.getMonth() - 1))

    for (let run of runs) {
        const startDate = new Date(run.startDate)
        if (startDate >= offset) {
            limitedRuns.push(run)
        }
    }

    return <ComponentSection header="Recent Runs (since 1 month ago)">
        <div className='test-runs'>
            {limitedRuns.map((run) => <Run key={run.id} {...run} />)}
        </div>
    </ComponentSection>
}

function UpdateParentPlan({currentPlanId, value,onChange}) {
    const [editParentId, setEditParentId] = useState(value ?? '')
    const doSet = e => {
        e.preventDefault()
        let parentPlan = null;

        tp.get(editParentId).then(r => {
            if (!r.status) {
                console.error(r)
                return false
            }
            parentPlan = r.message
            return true
        })
        .then(parentPlan => {
            if (!parentPlan) return
            return tp.update(currentPlanId, { parent: editParentId })
            .then(updateResponse => {
                if (!updateResponse.status) {
                    console.error(updateResponse)
                    return false;
                }
                const {id,name} = updateResponse.message
                onChange(id,name)
            })

        })
    }

    return <div>
        <input type="number" name="parentId" value={editParentId} onChange={e => setEditParentId(e.target.value)} />
        <button onClick={doSet}>Set Parent Plan</button>
    </div>
}

function ParentLink({currentPlanId, parent}) {
    const [parentId, setParentId] = useState(parent ? parent.id : false)
    const [parentName, setParentName] = useState(parent ? parent.name : 'No Parent')

    const url = '/kiwi/plan/'+parentId
    const display = parentId ? <Link href={url}>{parentName}</Link> : parentName
    return <span>
        {display}
        <UpdateParentPlan currentPlanId={currentPlanId} value={parentId} onChange={(id,name) => {setParentId(id); setParentName(name)}} />
    </span>
}

function ChildrenTestPlans({parentId, children}) {
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

export default function TestPlan(kiwiTestPlan) {
    // console.debug(kiwiTestPlan)
    const {id,createDate,parent} = kiwiTestPlan
    const text  = useState(kiwiTestPlan.text)
    const name  = useState(kiwiTestPlan.name)
    const isActive = useState(kiwiTestPlan.isActive)
    const version = useState(kiwiTestPlan.productVersion.value)
    const kiwiUrl = (id:number) => kiwiBaseUrl()+'/plan/'+id

    const conn = useTestPlanConn(id)

    const updatePlan = () => conn.updatePlan(name[0],text[0],isActive[0])

    const reformatName = () => {
        const newName = name[0].trim()
            .replaceAll(/\&gt;/g,'-')
        if (newName == '') return
        name[1](newName)
        updatePlan()
    }
    const setVersion = () => {
        tp.update(id, { productVersion: '5' })
        // updatePlan()
    }

    return <div>
        <ComponentSection header={id}>
            <fieldset>
                <FormField label="Kiwi URL">
                    <Link href={kiwiUrl} target="kiwi">{kiwiUrl}</Link>
                </FormField>
                <FormField label="Parent Test Plan">
                    <ParentLink currentPlanId={id} parent={parent} />
                </FormField>
                <FormField label="Version">
                    {version[0]}
                </FormField>
            </fieldset>
            <fieldset>
                <FormField label="Name">
                    <InputField state={name} />
                </FormField>
                <FormField label="Created">
                    <DateDisplay state={createDate} />
                </FormField>
                <FormField label="Is Active?">
                    <SelectBoolean value={isActive[0]} onChange={val => isActive[1](val)} />
                </FormField>
            </fieldset>
            <MarkdownSection state={text} label="Text" />
            <ActionBar>
                <ActionButton action={reformatName} text="Reformat name" />
                <ActionButton action={updatePlan} text="Update" />
                <ActionButton action={setVersion} text="Set to version 5" />
            </ActionBar>
        </ComponentSection>
        <ComponentSection header="Children test plans">
            <ChildrenTestPlans parentId={id} children={kiwiTestPlan.children} />
        </ComponentSection>
        <TestPlanRunner planId={id} />
        <TestRuns runs={kiwiTestPlan.runs} />
        <TestCaseList testPlanId={id} cases={kiwiTestPlan.testCases} />
    </div>
}
