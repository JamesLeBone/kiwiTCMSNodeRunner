'use client'
import { useState } from 'react';
import * as Component from '@server/kiwi/Component.js'

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { InputField } from '@/components/InputField'
import { ActionBar, ActionButton } from '@/components/Actions'

import Link from 'next/link'

function ComponentTestCase({testCase}) {
    const {id,summary} = testCase
    return <Link href={`/kiwi/testCase/${testCase.id}`}>{id} - {summary}</Link>
}

function TestCaseList({cases}) {
    return <ComponentSection header="Cases">
        {cases.map(testCase => <ComponentTestCase key={testCase.id} testCase={testCase} />)}
    </ComponentSection>
}

export function ComponentEdit({component}) {
    const id = useState(component.id)
    const name = useState(component.name)
    const description = useState(component.description)
    
    const save = () => {
        Component.update(id[0], name[0], description[0])
        .then(result => {
            console.debug('Update result', result)
        })
    }
    
    return <div>
        <ComponentSection header="Component">
            <fieldset style={{justifyContent:'left'}}>
                <FormField label="Name">
                    <InputField state={name} />
                </FormField>
                <FormField label="Description">
                    <InputField state={description} />
                </FormField>
            </fieldset>
            <ActionBar>
                <ActionButton action={save} text="Save" />
            </ActionBar>
        </ComponentSection>
        <TestCaseList cases={component.cases} />
    </div>
}
