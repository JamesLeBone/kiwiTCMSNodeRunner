'use client'

import { search, getTestCase } from '@server/kiwi/TestCase'
import type { TestCase } from '@server/kiwi/TestCase'

import { useState } from 'react';
import { ComponentSection } from '@/components/ComponentSection'

import TestCaseList from '@/components/kiwi/TestCaseList'

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
        <TestCaseList cases={testCaseList} />
    </ComponentSection>
}
