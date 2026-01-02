'use client'
import { useState } from 'react'
import { FormField } from './FormField'
import { ActionBar } from './Actions'
import type { OperationResult, StatusOperation } from '@lib/Operation'
import { ServerResponseComponent } from './ServerResponse'
import { Selection } from './Selection'
import { NumberInput } from './InputField'
import BooleanInput from './BooleanInput'

type FormInputProps = {
    label: string
    name?: string
    type?: string
    value?: string|boolean
    required?: boolean
    children?: React.ReactNode
    className?:string
    onChange?: (value: string) => void
    step?: number
    style?: React.CSSProperties
    placeholder?: string
    maxLength?: number
    title?: string
}
export function FormInputField({className,maxLength,placeholder,style,label,title,name,value='', type='text', children, required=false, step, onChange} : FormInputProps) {
    const [val,setVal] = useState(value)

    const setValAction = (v:string) => {
        setVal(v)
        if (onChange) {
            onChange(v)
        }
    }

    if (!name || name.length === 0) {
        return <FormField label={label}>{value}</FormField>
    }
    if (typeof value === 'boolean') {
        type = 'checkbox'
    }

    const fieldClassName = (className ? className + ' ' : '') + `FormField-${type}`

    return <FormField label={label} title={title} className={fieldClassName} style={style}>
        <ActionInputField maxLength={maxLength} name={name} type={type} placeholder={placeholder} value={val} step={step} required={required} onChange={setValAction} />
        {children}
    </FormField>
}

type FormSelectionProps = {
    label: string
    name: string
    value?: string | number
    required?: boolean
    children?: React.ReactNode
    options: Record<string, string>
}
export function FormSelection({label,name,required,value='',children,options} : FormSelectionProps) {
    const [val,setVal] = useState(value)
    const onChangeAction = (v:string) => {
        setVal(v)
    }

    return <FormField label={label}>
        <Selection name={name} value={val} required={required} options={options} onChange={v => onChangeAction(v+'')} />
        {children}
    </FormField>
}

type ChangeEvent = React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>
type apropset = {
    name?: string
    value?: string|boolean|number
    type?: string
    onChange?: (value: string, event: ChangeEvent) => void
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

    const changeEvent = (event : ChangeEvent) => {
        setVal(event.target.value)
        if (onChange) {
            onChange(event.target.value, event)
        }
    }

    if (typeof value === 'boolean' || type == 'checkbox') {
        return <BooleanInput name={name} checked={val as boolean} setVal={(v:boolean) => setVal(v)} {...props} />
    }
    if (type === 'textarea') {
        return <textarea name={name} rows={5} cols={30} value={val as string} onChange={(e) => changeEvent(e)} {...props} />
    }
    if (type === 'number') {
        const numValue = typeof val === 'number' ? val : ''
        return <NumberInput name={name} onChange={(e) => changeEvent(e)} value={numValue} type={type} {...props} />
    }

    return <input name={name} type={type} value={val as string} onChange={(e) => changeEvent(e)} {...props} />
}

export type FormAction = {
    label: string
    id?: string
    onClick?: () => void
}

type FormActionBarProps = {
    pendingState: boolean
    state: OperationResult
    actions: FormAction[] | string
}
export function FormActionBar({pendingState, state, actions} : FormActionBarProps) {
    if (typeof actions === 'string' && actions.length) {
        actions = [{ label: actions }]
    } else if (typeof actions === 'string') {
        actions = [{ label: actions }]
    }

    return <ActionBar>
        {actions.map((action) => {
            const ident = action.id || action.label.toLowerCase().replace(/\s+/g, '_')
            if (action.onClick) {
                return <span key={ident} onClick={action.onClick}>{action.label}</span>
            }
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
export function blankStatus(id?:string) : StatusOperation {
    return {id : id ?? '', status: false, message: '', statusType: 'blank'}
}
