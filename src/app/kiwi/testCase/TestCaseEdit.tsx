'use client'
import pageStyles from './page.module.css'

// React imports
import { useState,useEffect } from 'react';
import { formatSummary } from '@lib/Functions'

// Server side imports
import * as TestCase from '@server/kiwi/TestCase'
import type { CaseStatus } from '@server/kiwi/TestCaseStatus'

// General components
import { SelectBoolean, Selection } from '@/components/Selection'
import { ArgumentEditor, useArgumentHook, ArgumentEditHook } from '@/components/ArgumentEditor'

import { DateDisplay } from '@/components/DateDisplay'
import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { InputField } from '@/components/InputField'
import { ActionBar, ActionButton } from '@/components/Actions'
import { IconButton } from '@/components/IconButton'
import { MarkdownSection } from '@/components/MarkDownDisplay'

import Form from 'next/form'
import { useActionState } from 'react'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import Link from 'next/link'

declare type EditProps = {
    details: TestCase.TestCaseDetail
    statuses: CaseStatus[]
    kiwiUrl: string
}
export default function TestCaseEdit(props: EditProps) {
    const testCase = props.details.testCase
    const id = testCase.id
    
    const [summary, setSummary] = useState(testCase.summary)
    const textState = useState(testCase.text)
    
    const securityGroup = useState(testCase.securityGroupId)
    const tcArgs = useArgumentHook('arguments', testCase.arguments)
        
    // const clone = () => {
    //     const newArgs = tcArgs.getObject()[0]
    //     newArgs.securityGroupId = securityGroup[0]

    //     const sendData = {
    //         text : text[0],
    //         summary: summary[0],
    //         is_automated: isAutomated[0],
    //         arguments: newArgs,
    //         script: script[0] == '' ? id : script[0],
    //         case_status: status[0].id,
    //         category: testCase.category.value,
    //         priority: testCase.priority.value
    //     }
    //     console.debug('Cloning '+id , sendData)
    //     conn.clone(id, sendData)
    //     .then(serverResponse => {
    //         if (serverResponse.status) {
    //             tceStatus.success( `Clone accepted`)
    //             window.location = '/kiwi/testCase/'+serverResponse.message.id
    //             return
    //         }
    //         tceStatus.error( `Clone failed`, serverResponse.message)
    //     })
    // }
    
    const formatSummaryText = () => {
        const securityGroupId = securityGroup[0]
        const newSummary = formatSummary(summary, securityGroupId)
        setSummary(newSummary)
    }
    // const setSecurity = v => {securityGroup[1](v), formatSummaryText()}

    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const jsonEncodedArgString = formData.get('arguments') as string
            let jsonAgs : Record<string,string> = {}
            try {
                jsonAgs = JSON.parse(jsonEncodedArgString)
            } catch(e) {
                return validationError('updateKiwi', 'Arguments are not valid JSON')
            }
            const summary = formData.get('summary') as string
            const isAutomated = formData.get('isAutomated') == 'true' ? true : false
            const caseStatusId = parseInt(formData.get('caseStatus') as string)
            const description = formData.get('description') as string

            const result = await TestCase.update(
                id,
                { summary, isAutomated, caseStatusId, description, arguments: jsonAgs }
            )
            return result
        },
        blankStatus('updateKiwi')
    )

    const actions = [
        { label: "Update Kiwi", id: 'updateKiwi' },
        { label: "Format Summary", id: 'formatSummary', onClick: formatSummaryText },
        // { label: "Clone", id: 'clone' }
    ]
    const statusOptions = props.statuses.reduce( (acc, status) => {
        acc[status.id+''] = status.description
        return acc
    }, {} as Record<string,string> )

    return <div>
        <ComponentSection header='Test Case Edit' style={{display:'grid'}} id="testCaseEditForm">
            <Form action={formAction}>
                <fieldset id={pageStyles.identifiers}>
                    <span>Test Case: {id}</span>
                    <Link href={props.kiwiUrl + id} target="kiwi" rel="external">Kiwi</Link>
                </fieldset>
                <fieldset id={pageStyles.fields}>
                    <FormInputField className={pageStyles.summary} label="Summary" value={summary} name="summary" required={true}>
                        <IconButton onClick={formatSummaryText} title='Format' className='fa fa-wand-magic' />
                    </FormInputField>
                    <FormInputField label="Automated?" name="isAutomated" type="checkbox" value={testCase.isAutomated} />
                    <FormSelection label="Status" name="caseStatus" value={testCase.caseStatus.value+''} required={true} options={statusOptions} />
                    <MarkdownSection name="description" className={pageStyles.MarkdownEditor} label="Description" state={textState} />
                </fieldset>
                <fieldset>
                    <legend>Arguments</legend>
                    <ArgumentEditor hook={tcArgs} />
                </fieldset>
                <fieldset id={pageStyles.audit}>
                    <FormField label="Created" className='no-input'>
                        <DateDisplay date={testCase.createDate} />
                    </FormField>
                    <FormField label="Author" className='no-input'>{testCase.author.username}</FormField>
                </fieldset>
                <FormActionBar pendingState={isPending} state={state} actions={actions} />
            </Form>
        </ComponentSection>
    </div>
}
/*
            
            <RelatedComponents className={styles.SpanOne} parentId={id} entityName="TestCase" primaryKey="case_id" components={components} />
            <TagList testCaseId={id} className={styles.SpanOne} tags={tags} />
            
            <ComponentSection header="Test Plans" className={styles.SpanAll} >
                <TestPlanList testCaseId={id} list={testPlans[0]} />
            </ComponentSection>
            
            <Execution testCaseId={id} executions={executions} />
    </div>
}

*/