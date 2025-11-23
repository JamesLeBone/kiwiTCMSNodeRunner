'use client'

import { useState } from 'react';
import * as TestPlan from '@server/kiwi/TestPlan.js'
import { CheckboxBoolean } from '@/components/Selection'

import { MarkdownSection } from '@/components/MarkDownDisplay'
import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { InputField } from '@/components/FormField'
import { ActionBar, ActionButton } from '@/components/Actions'

// import styles from './page.module.css'

// http://localhost:3001/kiwi

export default function PlanPage() {
    const name = useState('')
    const isActive = useState(true)
    const description = useState('')
    
    const status = useState('')
    const link = useState('')
    
    const create = () => {
        const sendData =  {
            summary:description[0],
            isActive:isActive[0],
            name:name[0]
        }
        TestPlan.create(sendData)
        .then(serverResponse => {
            if (!serverResponse.status) {
                status[1](`Failed to create test plan: ${serverResponse.message}`)
                return
            }
            const newPlan = serverResponse.message

            const testPlandId = newPlan.id
            status[1](`Created test plan ${testPlandId}`)
            window.location.href = `/kiwi/plan/${testPlandId}`
            // link[1](<a href={`/kiwi/plan/${testPlandId}`}>View Test plan {testPlandId}</a>)
        })
    }
    
    return <main>
        <ComponentSection header="Test Plan">
            <div>{status[0]}</div>
            <fieldset>
                <FormField label="Name">
                    <InputField state={name} />
                </FormField>
                <FormField label="Is Active?">
                    <CheckboxBoolean value={isActive[0]} onChange={val => isActive[1](val)} />
                </FormField>
                
            </fieldset>
            
            <MarkdownSection state={description} label="Full description" open={true} />
            
            <ActionBar>
                <ActionButton text="Create" action={create} />
                {link[0]}
            </ActionBar>
        </ComponentSection>
    </main>
}
