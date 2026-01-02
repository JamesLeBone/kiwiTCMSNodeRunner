'use client'

import { useState, useActionState } from 'react'
import Form from 'next/form'
import Link from 'next/link'

import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'
import { AmalgomatedComponent, ComponentAttachable, search } from '@server/kiwi/Component'
import { OperationResult } from '@lib/Operation'
import { DynamicTable } from '../DynamicTable'


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

type ComponentSearchProps = {
    onRowClick?: (component: AmalgomatedComponent) => void
}
export function ComponentSearch(props: ComponentSearchProps) {
    const components = useState<AmalgomatedComponent[]>([])

    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const list = await search(formData.get('name') as string)
            const newState : OperationResult = {
                id: 'searchComponents',
                status: list.length > 0,
                message: list.length > 0 ? `Found ${list.length} components` : 'No components found',
                data: list
            }
            components[1](list)
            return newState
        },
        blankStatus('searchingComponents')
    )

    const headers = ['id', 'name', 'cases']
    if (props.onRowClick) headers.push('actions')
    const selectionButton = (component: AmalgomatedComponent) => {
        if (!props.onRowClick) return null
        return <td><button onClick={() => {
            if (props.onRowClick) {
                props.onRowClick(component)
            }
        }}>Select</button></td>
    }
    
    return <div>
        <Form action={formAction}>
            <fieldset>
                <FormInputField label="Name" name="name" required={true} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={'Search'} />
        </Form>
        <DynamicTable data={state.data} headers={headers}>
            {components[0].map(component => 
                <tr key={component.id}>
                    <td><Link href={`/kiwi/component/?id=${component.id}`}>{component.id}</Link></td>
                    <td>{component.name}</td>
                    <td>{component.cases.length}</td>
                    {selectionButton(component)}
                </tr>
            )}
        </DynamicTable>
    </div>
}

