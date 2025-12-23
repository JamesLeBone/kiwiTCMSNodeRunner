'use client'

import styles from './Component.module.css'
import { useState, useActionState } from 'react'
import Form from 'next/form'
import Link from 'next/link'

import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'
import { AmalgomatedComponent, ComponentAttachable, search } from '@server/kiwi/Component'
import { OperationResult } from '@lib/Operation'


function ComponentSummaryItem({component} : {component: AmalgomatedComponent}) {
    const {id,name} = component
    const size = component.cases.length
    
    return <li>
        <span>{name}</span> <span>{size} cases</span>
    </li>
}

type ComponentListProps = {
    componentList: AmalgomatedComponent[]
}
export const ComponentList = ({componentList}: ComponentListProps) => {
    if (componentList.length == 0) return <div>No components</div>
    
    return <ul>
        {componentList.map(c => <ComponentSummaryItem key={c.id} component={c} />)}
    </ul>
}

export function ComponentSearch({}) {
    const components = useState([])

    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const list = await search(formData.get('name') as string)
            const newState : OperationResult = {
                id: 'searchComponents',
                status: list.length > 0,
                message: list.length > 0 ? `Found ${list.length} components` : 'No components found',
                data: list
            }
            return newState
        },
        blankStatus('searchingComponents')
    )
    
    return <div>
        <Form action={formAction}>
            <fieldset>
                <FormInputField label="Name" name="name" required={true} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={'Search'} />
        </Form>
        <fieldset className={styles.componentList}>{components[0]}</fieldset>
    </div>
}

