'use client'
import { useState,useActionState } from 'react'
import { formatSummary, formDataValue } from '@lib/Functions'

import * as Component from '@server/kiwi/Component'

import type { AmalgomatedComponent } from '@server/kiwi/Component'

import { ComponentSection } from '@/components/ComponentSection'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import Link from 'next/link'
import Form from 'next/form'

function ComponentTestCase({testCase} : {testCase: any}) {
    const {id,summary} = testCase
    return <Link href={`/kiwi/testCase/${testCase.id}`}>{id} - {summary}</Link>
}

function TestCaseList({cases} : {cases: any[]}) {
    return <ComponentSection header="Cases">
        {cases.map(testCase => <ComponentTestCase key={testCase.id} testCase={testCase} />)}
    </ComponentSection>
}

export function ComponentEdit({component} : {component: AmalgomatedComponent}) {
    const id = useState(component.id)
    const name = useState(component.name)
    const description = useState(component.description ?? '')
    
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const name = formDataValue.getString(formData, 'name')
            const description = formDataValue.getString(formData, 'description')

            const result = await Component.update(component.id, name, description)
            
            return result
        },
        blankStatus('updateKiwi')
    )

    const save = () => {
        Component.update(id[0], name[0], description[0])
        .then(result => {
            console.debug('Update result', result)
        })
    }
    
    return <div>
        <ComponentSection header="Component">
            <Form action={formAction}>
                <fieldset style={{justifyContent:'left'}}>
                    <FormInputField label="Name" name="name" value={name[0]} />
                    <FormInputField label="Description" name="description" value={description[0]} />
                </fieldset>
                <FormActionBar pendingState={isPending} state={state} actions={'Update'} />
            </Form>
        </ComponentSection>
        <TestCaseList cases={component.cases} />
    </div>
}
