'use client'
import pageStyles from './page.module.css'

// React imports
import { useState,useActionState } from 'react'
import { formatSummary, formDataValue } from '@lib/Functions'

// Server side imports
import * as TestCase from '@server/kiwi/TestCase'
import type { CaseStatus } from '@server/kiwi/TestCaseStatus'

// General components
import { ArgumentEditor, useArgumentHook, ArgumentEditHook } from '@/components/ArgumentEditor'

import { DateDisplay } from '@/components/DateDisplay'
import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { IconButton } from '@/components/IconButton'
import { MarkdownSection } from '@/components/MarkDownDisplay'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import { redirect } from 'next/navigation'
import Form from 'next/form'
import Link from 'next/link'
import type { SecurityGroup } from '@server/lib/SecurityGroups'

type EditProps = {
    details: TestCase.TestCaseDetail
    statuses: CaseStatus[]
    securityGroups: SecurityGroup[]
    kiwiUrl: string
}
export default function TestCaseEdit(props: EditProps) {
    const testCase = props.details.testCase
    const id = testCase.id
    
    const [summary, setSummary] = useState(testCase.summary)
    const textState = useState(testCase.text)
    
    const securityGroup = useState(testCase.securityGroupId)
    const tcArgs = useArgumentHook('arguments', testCase.arguments)
    
    const formatSummaryText = () => {
        const securityGroupId = securityGroup[0]
        const newSummary = formatSummary(summary, securityGroupId)
        setSummary(newSummary)
    }//45
    // const setSecurity = v => {securityGroup[1](v), formatSummaryText()}

    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const jsonAgs = formDataValue.getJson(formData, 'arguments')
            const summary = formDataValue.getString(formData, 'summary')
            const isAutomated = formData.get('isAutomated') == 'true' ? true : false
            const caseStatusId = parseInt(formData.get('caseStatus') as string)
            const description = formData.get('description') as string
            const securityGroupId = formData.get('securityGroupId') as string

            const action = (formData.get('action') as string).trim()
            if (action == 'Clone') {
                const cloneResult = await TestCase.clone(
                    id,
                    {
                        summary,
                        isAutomated,
                        caseStatusId,
                        description,
                        arguments: jsonAgs
                    }
                )
                if (cloneResult.status && cloneResult.data) {
                    const newId = cloneResult.data.id
                    redirect( '/kiwi/testCase/?id=' + newId )
                }
                return cloneResult
            }

            const result = await TestCase.update(
                id,
                { summary, isAutomated, caseStatusId, description, arguments: jsonAgs }
            )
            return result
        },
        blankStatus('updateKiwi')
    )

    const actions = [
        { label: "Update Kiwi" },
        { label: "Format Summary", onClick: formatSummaryText },
        { label: "Clone" }
    ]
    const statusOptions = props.statuses.reduce( (acc, status) => {
        acc[status.id+''] = status.description
        return acc
    }, {} as Record<string,string> )

    const securityGroupOptions = props.securityGroups.reduce( (acc, sg) => {
        acc[sg.securityGroupId+''] = sg.description
        return acc
    }, { '' : 'None' } as Record<string,string> )

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
                    <FormSelection label="Status" name="caseStatus" value={testCase.caseStatus.id+''} required={true} options={statusOptions} />
                    <FormSelection label="Security Group" name="securityGroupId" value={testCase.securityGroupId+''} options={securityGroupOptions} />
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
