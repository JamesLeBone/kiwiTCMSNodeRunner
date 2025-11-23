'use client'

import { useState } from 'react';

import { ActionBar, ActionButton } from '@/components/Actions'
import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'

import { SelectBoolean, Selection } from '@/components/Selection'

import Link from 'next/link'

import * as TestCase from '@server/kiwi/TestCase.js'

const securityGroups = [
    {value:'FULLADMIN', name:'Admin'},
    {value:'FLEXADMIN', name:'Flexadmin'},
    {value:'MARKETING', name:'Marketing'},
    {value:'SALESAGENT', name:'Sales Agent'},
    {value:'STAFF', name:'Staff'},
    {value:'TUTOR', name:'Tutor'},
    {value:'STUDENT', name:'Student'},
    {value:'APPLICANT', name:'Applicant'},
    {value:'PUBLIC', name:'Public / None'}
]
const statusList = [
    {value:1, name:'Proposed'},
    {value:2, name:'Confirmed'},
    {value:3, name:'Disabled'},
    {value:4, name:'Update Required'}
]

export default function CreateTestCase() {
    // Fields
    const isAutomated = useState(true)
    const [summary,setSummary] = useState('')
    const status = useState(2)
    const text = useState('')

    const [securityGroup,setSecurityGroup] = useState('FULLADMIN')

    const reset = () => {
        isAutomated[1](true)
        setSummary('')
        status[1](2)
        text[1]('')
        setSecurityGroup('FULLADMIN')
    }
    
    const createTestCase = () => {
        const sendData = {
            text : text[0],
            summary: summary,
            is_automated: isAutomated[0],
            securityGroupId: securityGroup,
            case_status: status[0]
        }
        TestCase.create(sendData)
        .then(serverResponse => {
            if (!serverResponse.status) {
                return
            }
            const testCase = serverResponse.message
            console.info(testCase)
            reset()
            const testCaseId = testCase.id
            createdTestCase[1](testCaseId)
            return
        })
    }
    
    const setAutomated = value => isAutomated[1](value)
    const updateText = e => text[1](e.target.value)
    const setStatus = statusId => status[1](statusId)
    
    // useEffect(() => {
    //     setSummary(TestCaseLib.TestCase.formatSummary(summary, securityGroup))
    // }, [securityGroup,summary])

    const createdTestCase = useState(-1)


    return <div>
        <form id="TestCaseEdit">
            <ComponentSection header="New Test Case">
                <fieldset>
                    <FormField label="Summary" style={{gridColumn:'span 4'}}>
                        <InputField value={summary} onChange={setSummary} />
                    </FormField>
                    <FormField label="Is Automated?">
                        <SelectBoolean value={isAutomated[0]} onChange={setAutomated} />
                    </FormField>
                    <FormField label="Status">
                        <Selection  value={status[0]} options={statusList} onChange={setStatus} />
                    </FormField>
                    <FormField label="Security Group">
                        <Selection  value={securityGroup[0]} options={securityGroups} onChange={securityGroupId => setSecurityGroup(securityGroupId)} />
                    </FormField>
                    <FormField label="Description" style={{gridColumn:'1/-1'}}>
                        <textarea rows="5" cols="20" value={text[0]} onChange={updateText} />
                    </FormField>
                </fieldset>
            </ComponentSection>

            <TestCaseLink testCaseId={createdTestCase[0]} />
            
            <ActionBar>
                <ActionButton action={createTestCase} className={['primary']} text="Create" />
            </ActionBar>
        </form>
        <div className="vertical-spacer"></div>
    </div>
}

function TestCaseLink({testCaseId}) {
    if (testCaseId == -1) {
        return null
    }
    return <ComponentSection header="Created Test Case">
        <Link href={"/kiwi/testCase/"+testCaseId}>{testCaseId}</Link>
    </ComponentSection>
}
