'use client'
import { useState } from 'react'
import { ActionInputField } from './FormActions'
import { Selection } from './Selection'
import { IconButton } from './IconButton'

declare type FormFieldProps = {
    label: string
    children: React.ReactNode
    className?: string
    [key: string]: any
}
export function FormField({label,children, ...props} : FormFieldProps) {
    props.className = 'FormField ' + (props.className ? props.className : '')

    return <div {...props}>
        <label title={props.title}>{label}</label>
        <div>{children}</div>
    </div>
}

declare type FormFieldAlternatingProps = {
    label: string
    name: string
    required?: boolean
    options: Record<string, string>
    value?: string
    title?: string
    onChange?: (value: string) => void
}
export function FormFieldAlternating({label, name, title, required=false, options, value, onChange} : FormFieldAlternatingProps) {
    const [clsSelect, setClsSelect] = useState(true)
    
    return <div className="FormField FormFieldAlternating">
        <label title={title}><span>{label}</span></label>
        <div>
            {clsSelect ? 
                <Selection name={name} value={value} required={required} options={options} onChange={v => onChange && onChange(v+'')} /> :
                <ActionInputField name={name} value={value} required={required} onChange={v => onChange && onChange(v)} />
            }
            <IconButton className='fa fa-rotate' title='Toggle Input Type' onClick={() => setClsSelect(!clsSelect)} />
        </div>
    </div>
}
