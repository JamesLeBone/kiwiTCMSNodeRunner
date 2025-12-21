'use client'
// Kill this
import styles from './page.module.css'

// React imports
import { useState,useEffect } from 'react';
import { formatSummary, kiwiBaseUrl } from '@lib/Functions'

// Server side imports
import * as TestCase from '@server/kiwi/TestCase.js'

// General components
import { useMessage } from '@/components/ServerResponse'
import { SelectBoolean, Selection } from '@/components/Selection'
import { JsonEditor } from '@/components/JsonEditor'

import { DateDisplay } from '@/components/DateDisplay'
import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { InputField } from '@/components/InputField'
import { ActionBar, ActionButton } from '@/components/Actions'
import { MarkdownSection } from '@/components/MarkDownDisplay'

// Kiwi specfic components
import TestPlanList from './TestPlanList'
import CaseScript from './CaseScript';
import ChildrenScripts from './ChildrenScripts';
import { RelatedComponents } from '@/components/kiwi/Component';
import Link from 'next/link'
import Execution from './Execution'

import { TagList } from '@/components/kiwi/Tags'
import KiwiComments from '@/components/kiwi/KiwiComments'

const statusList = [
    {value:1, name:'Proposed'},
    {value:2, name:'Confirmed'},
    {value:3, name:'Disabled'},
    {value:4, name:'Update Required'}
]

const kiwiUrl = (id:number) => kiwiBaseUrl()+'/case/'+id
/**
 * This is the server workaround that can only return resolve if returned successfully from the backend.
 * It then needs to read the reply.status for success/fail of the operation.
 * @param {Object} reply 
 * @returns Promise
 */
const promisfyResponse = reply => new Promise((resolve,reject) => {
    return reply.then(reply =>
        reply.status ? resolve(reply.message) : reject(reply.message)
    )
})

// Things that should be hooks or refctored into their own components.
const useConnectionHook = (id, args, securityGroupId) => {
    const nf = (name) => {
        console.info('Feature needs refactor:'+name)
        return false
    }

    return {
        update: (sendData) => promisfyResponse(conn.update(id, sendData)),
        addToPlan: (testPlanId) => promisfyResponse(conn.addToPlan(id, testPlanId)),
        removeFromPlan: (testPlanId) => promisfyResponse(conn.removeFromPlan(id, testPlanId)),
        del: url => nf('del')
    }
}

function deHtmlEncode(string) {
    while (string.indexOf('&amp;') > -1) {
        string = string.replaceAll('&amp;', '&')
    }
    return string.replaceAll('&quot;', '`')
        .replaceAll('&#x27;', "'")
}

function useTestCaseArguments(tcArgs) {
    const args = useState(tcArgs)

    const setArgs = json => {
        const keyList = Object.keys(json).sort()
        const newJson = {}
        for (let key of keyList) {
            newJson[key] = json[key]
        }
        
        args[1](newJson)
    }
    
    return {
        set: setArgs,
        setKey: (key,value) => {
            const ar = args[0]
            ar[key] = value
            setArgs(ar)
        },
        removeKey: key => {
            const ar = args[0]
            delete ar[key]
            setArgs(ar)
            return ar
        },
        getObject: () => args,
        text: JSON.stringify(args[0],null,4)
    }
}

function TestCaseArguments({tcArgs}) {
    return <fieldset style={{gridTemplateColumns:'1fr'}}>
        <JsonEditor jsonState={tcArgs.getObject()} text={tcArgs.text} style={{gridColumn:'span 2'}} />
    </fieldset>
}

function ChangeTestCase({testCaseId}) {
    const [id,setId] = useState(testCaseId)
    const change = e => {
        if (testCaseId == id) return
        window.location = '/kiwi/testCase/'+id
    }

    return <div style={{display:'flex'}}>
        <input type="text" value={id} onChange={e=>setId(e.target.value)} />
        <ActionButton action={change} text="Load" />
    </div>
}

export default function TestCaseEdit({testCase,attachments,plans,children,comments,components,tags,executions}) {
    const id = testCase.id
    
    const isAutomated = useState(testCase.isAutomated)
    const summary = useState(testCase.summary)
    const status = useState({
        id: testCase.caseStatus.value,
        name: testCase.caseStatus.name
    })
    const text = useState(deHtmlEncode(testCase.text))
    
    const script = useState(testCase.script)
    const childrenScripts = useState(children)
    const securityGroup = useState(testCase.securityGroupId)

    const testPlans = useState(plans)

    const tcArgs = useTestCaseArguments(testCase.arguments)
    const tceStatus = useMessage()
    const useConnection = useConnectionHook(id,tcArgs,securityGroup)
        
    const updateKiwiWith = (sendData) => useConnection.update(sendData)
        .then(updatedTestCase => tceStatus.success( 'Update accepted'),
        reject => tceStatus.error( 'Update rejected',reject)
    )
    
    const updateKiwi = () => {
        const sendData = {
            text : text[0],
            summary: summary[0],
            is_automated: isAutomated[0],
            case_status: status[0].id,
            arguments: tcArgs.getObject()[0],
            securityGroupId: securityGroup[0]
        }
        updateKiwiWith(sendData)
    }
    
    const setAutomated = value => isAutomated[1](value)

    
    const clone = () => {
        const newArgs = tcArgs.getObject()[0]
        newArgs.securityGroupId = securityGroup[0]

        const sendData = {
            text : text[0],
            summary: summary[0],
            is_automated: isAutomated[0],
            arguments: newArgs,
            script: script[0] == '' ? id : script[0],
            case_status: status[0].id,
            category: testCase.category.value,
            priority: testCase.priority.value
        }
        console.debug('Cloning '+id , sendData)
        conn.clone(id, sendData)
        .then(serverResponse => {
            if (serverResponse.status) {
                tceStatus.success( `Clone accepted`)
                window.location = '/kiwi/testCase/'+serverResponse.message.id
                return
            }
            tceStatus.error( `Clone failed`, serverResponse.message)
        })
    }
    
    const formatSummaryText = () => {
        const securityGroupId = securityGroup[0]
        const newSummary = formatSummary(summary[0], securityGroupId)
        
        summary[1](newSummary)
        updateKiwiWith({summary: newSummary})
    }
    const setSecurity = v => {securityGroup[1](v), formatSummaryText()}
    const setScript = scriptId => {
        script[1](scriptId)
        updateKiwiWith({script: scriptId})
    }
    
    const setStatus = statusId => {
        const current = status[0]
        current.id = statusId
        
        let description = statusId
        for (let statusItem of statusList) {
            if (statusItem.value == statusId) {
                description = statusItem.name
                break
            }
        }
        
        status[1]({id:statusId, name:description})
    }
    
    const cn = styles.TestCaseEdit

    return <div className={styles.content}>
        { tceStatus.message }
            <ComponentSection header="Test Case Edit" className={styles.SpanAll}>
                <fieldset>
                    <span>Test Case: {id}</span>
                    <Link href={kiwiUrl(id)} target="kiwi">Kiwi</Link>
                    <ChangeTestCase testCaseId={id} />
                </fieldset>
                
                <fieldset>
                    <FormField label="Summary" style={{gridColumn:'1/-1'}}>
                        <InputField state={summary} />
                    </FormField>
                    <FormField label="Is Automated?">
                        <SelectBoolean value={isAutomated[0]} setVal={setAutomated} />
                    </FormField>
                    <FormField label="Status">
                        <Selection value={status[0].id} options={statusList} setVal={setStatus} />
                    </FormField>
                    <FormField label="Security Group">
                        <Selection value={securityGroup[0]} options={securityGroups} setVal={setSecurity} />
                    </FormField>
                </fieldset>

                <MarkdownSection state={text} />
                
                <fieldset>
                    <FormField label="Created">
                        <DateDisplay dateValue={testCase.createDate} />
                    </FormField>
                    <FormField label="Author">{testCase.author.username}</FormField>
                </fieldset>
                
                <TestCaseArguments tcArgs={tcArgs} />
                
                <ActionBar>
                    <ActionButton action={updateKiwi} text="Update Kiwi" />
                    <ActionButton action={formatSummaryText} text="Format Summary" />
                    <ActionButton action={clone} text="Clone" />
                </ActionBar>
            </ComponentSection>
            
            <ComponentSection header="Comments" className={styles.SpanAll}>
                <KiwiComments idValue={id} comments={comments} />
            </ComponentSection>
            
            <ComponentSection header="Scripts">
                <CaseScript testCaseId={id} className={styles.SpanOne} script={script} setValue={setScript} />
                <ChildrenScripts scriptList={childrenScripts[0]} />
            </ComponentSection>
            
            <RelatedComponents className={styles.SpanOne} parentId={id} entityName="TestCase" primaryKey="case_id" components={components} />
            <TagList testCaseId={id} className={styles.SpanOne} tags={tags} />
            
            <ComponentSection header="Test Plans" className={styles.SpanAll} >
                <TestPlanList testCaseId={id} list={testPlans[0]} />
            </ComponentSection>
            
            <Execution testCaseId={id} executions={executions} />
    </div>
}
