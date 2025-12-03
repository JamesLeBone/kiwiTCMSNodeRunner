'use client'
import { useState } from 'react'
import { FormField } from './FormField'
import { ActionBar } from './Actions'
import type { OperationResult, StatusOperation } from '@lib/Operation'
import { ServerResponseComponent } from './ServerResponse'

declare type FormInputProps = {
    label: string
    name: string
    type?: string
    value?: string
    required?: boolean
}
export function FormInputField({label,name,value='', type='text', required=false} : FormInputProps) {
    const [val,setVal] = useState(value)
    return <FormField label={label}>
        <ActionInputField name={name} type={type} value={val} required={required} onChange={(e) => setVal(e)} />
    </FormField>
}

declare type apropset = {
    name: string
    value?: string
    type?: string
    onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void
    [key: string]: any
}
/**
 * As opposed to the above where state is outside the coponent,
 * this component manages its own state.
 * it can still call an onChange handler as a callback.
 * 
 * I will be using this for form submissions where the state is not visible.
 */
export function ActionInputField({name, onChange, value='', type='text', ...props} : apropset) {
    const [val,setVal] = useState(value)

    const changeEvent = (event : React.ChangeEvent<HTMLInputElement>) => {
        setVal(event.target.value)
        if (onChange) {
            onChange(event.target.value, event)
        }
    }

    return <input name={name} type={type} value={val} onChange={(e) => changeEvent(e)} {...props} />
}

declare type FormActionBarProps = {
    pendingState: boolean
    state: OperationResult
    actions: { label: string, id?: string }[]
}
export function FormActionBar({pendingState, state, actions} : FormActionBarProps) {
    return <ActionBar>
        {actions.map((action) => {
            const ident = action.id || action.label.toLowerCase().replace(/\s+/g, '_')
            return <input key={ident} type="submit" value={action.label} name='action' disabled={pendingState} />
        })}
        <ServerResponseComponent type={state.statusType}>{state.message}</ServerResponseComponent>
    </ActionBar>
}

export function validationError(id:string, message:string) : StatusOperation {
    return {
        id : id, status: false, message: message, statusType: 'error'
    }
}
export function blankStatus(id:string) : StatusOperation {
    return {id : id, status: false, message: '', statusType: 'blank'}
}
