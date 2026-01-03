'use client'

import { useState, useActionState } from 'react'
import Form from 'next/form'
import Link from 'next/link'

import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'
import { AmalgomatedComponent, ComponentAttachable, search } from '@server/kiwi/Component'
import { OperationResult } from '@lib/Operation'
import { DynamicTable } from '../DynamicTable'

type ComponentSummaryItemProps = {
    component: AmalgomatedComponent
    actions?: GenericClickEvent[]
}
function ComponentSummaryItem(props : ComponentSummaryItemProps) {
    const name = props.component.name
    const size = props.component.cases.length

    if (!props.actions || props.actions.length == 0) {
        return <tr>
            <td>{name}</td>
            <td>{size}</td>
        </tr>
    }
    const buttons = props.actions.map((action) => {
        const clickEvent = () => {
            action.callback(props.component)
        }
        return <button key={action.buttonText} onClick={clickEvent}>{action.buttonText}</button>
    })
    
    return <tr>
        <td>{name}</td>
        <td>{size}</td>
        <td>{buttons}</td>
    </tr>
}

type ComponentListProps = {
    componentList: AmalgomatedComponent[]
    listActions?: GenericClickEvent[]
}
export const ComponentList = (props: ComponentListProps) => {
    if (props.componentList.length == 0) return <div>No components</div>
    // console.debug('Rendering ComponentList with', props)
    const headers = ['Name', '# Test Cases']
    if (props.listActions) headers.push('Actions')
    
    return <DynamicTable headers={headers}>
        {props.componentList.map(c => <ComponentSummaryItem key={c.id} component={c} actions={props.listActions} />)}
    </DynamicTable>
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
                data: list,
                statusType: list.length > 0 ? 'success' : 'info'
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

