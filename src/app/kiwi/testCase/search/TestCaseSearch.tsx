'use client'

import { search, getTestCase } from '@server/kiwi/TestCase'
import type { TestCase } from '@server/kiwi/TestCase'

import { useState } from 'react';
import Link from 'next/link'
import { DynamicTable } from '@/components/DynamicTable'
import { ComponentSection } from '@/components/ComponentSection'

import Form from 'next/form'
import { useActionState } from 'react'
import { FormInputField, FormActionBar, blankStatus, validationError } from '@/components/FormActions'

export default function TestCaseSearch() {
    const [testCaseList, setTestCaseList] = useState<TestCase[]>([])

    const [state, doSearch, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const testCaseId = formData.get('testCaseId') as string

            if (testCaseId) {
                const id = parseInt(testCaseId)
                if (isNaN(id) || id <= 0) {
                    return validationError('searchTestCase', 'Invalid Test Case ID')
                }
                const op = await getTestCase(id)
                const list: TestCase[] = []
                if (op.data) list.push(op.data)
                setTestCaseList(list)
                return op
            }
            if (!formData.has('testName')) {
                return validationError('searchTestCase', 'Please provide at least Test Case ID or Test Name to search')
            }
            const testName = formData.get('testName') as string

            if (testName.trim().length == 0) {
                return validationError('searchTestCase', 'Test Name cannot be empty')
            }
            
            const searchResult = await search({summary:testName.trim()})
            console.debug("Search Result:", searchResult.data)
            if (searchResult.data) setTestCaseList(searchResult.data)

            return searchResult
        },
        blankStatus('searchTestCase')
    )
    
    return <ComponentSection header="Search Test Cases" className={['fill']}>
        <div>
            <Form action={doSearch}>
                <fieldset style={{display:'grid',gridTemplateColumns:'200px'}}>
                    <FormInputField label="Test Case ID" name="testCaseId" type="number" step={1} />
                </fieldset>
                <fieldset style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, 200px)'}}>
                    <FormInputField label="Test Name" name="testName" />
                </fieldset>
                <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Search' }]} />
            </Form>
        </div>
        <DynamicTable headers={['ID','Automated','Summary','Status']}>
            {testCaseList.map(tc => <TestCaseSummary key={tc.id} testCase={tc} />)}
        </DynamicTable>
    </ComponentSection>
}


function TestCaseSummary({testCase} : {testCase: TestCase}) {
    const path = "/kiwi/testCase?id="+testCase.id
        
    const status = testCase.caseStatus.description

    return <tr>
        <td className="numeric">
            <Link href={path} style={{padding:'4px'}}>{testCase.id}</Link>
        </td>
        <td className="status">{testCase.isAutomated ? 'Automated' : 'Manual'}</td>
        <td className="textual">{testCase.summary}</td>
        <td className="status" style={{textAlign:'right',textTransform:'capitalize',paddingRight:'1em'}}>{status}</td>
    </tr>
}
