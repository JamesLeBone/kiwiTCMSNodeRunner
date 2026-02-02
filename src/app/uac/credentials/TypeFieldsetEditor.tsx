'use client'

import { useState } from 'react'
import type { credentialFieldSet } from '@server/lib/Credentials'

import { FormInputField, FormSelection } from '@/components/FormActions'
import { ActionBar, ActionButtonText } from '@/components/Actions'
import { useMessage } from '@/components/useMessage'
import { IconButton } from '@/components/IconButton'

import './TypeFieldsetEditor.css'

const formInputOptions = {
    text: 'Text',
    password: 'Password',
    number: 'Number',
    email: 'Email'
}

type CredentialPropProps = {
    name: string
    type: string
    value?: string | number
    keyPrefix: string
    remove: () => void
    rekey: (newName:string) => boolean
}
function CredentialProp(props:CredentialPropProps) {
    const [baseName, setBaseName] = useState(props.keyPrefix+'[' + props.name + ']')
    const stringValue = props.type === 'password' ? ''  : props.value ? props.value.toString() : ''

    const updateName = (newName:string) => {
        if (!props.rekey(newName)) return
        setBaseName(props.keyPrefix+'[' + newName + ']')
    }

    return <div className='CredentialProperty'>
        <fieldset>
            <FormInputField name={props.keyPrefix+'[name]'} label='Name:' type="text" value={props.name} onChange={(newName) => updateName(newName)} />
            <FormSelection  label='Data Type:' name={baseName + '[type]'} value={props.type} options={formInputOptions} />
            <FormInputField label='Default Value:' name={baseName + '[value]'} type={props.type} value={stringValue} />
        </fieldset>
        <ActionBar>
            <IconButton className="fa fa-trash" title='Remove Field' onClick={() => props.remove()} />
        </ActionBar>
    </div>
}

/**
 * Extract form values from the TypesFieldsetEditor form inputs
 */
export function getFormDataValues(formData: FormData, keyPrefix: string) : credentialFieldSet {
    const fieldSet: credentialFieldSet = {}
    for (const [key, value] of formData.entries()) {
        if (!key.startsWith(keyPrefix + '[')) continue
        const match = key.match(new RegExp(`^${keyPrefix}\\[(?<key>.+?)\\]\\[(?<prop>(type|value))\\]$`))
        if (!match || !match.groups) continue
        const fieldKey = match.groups.key

        if (!fieldSet[fieldKey]) {
            fieldSet[fieldKey] = { type: 'string', value: '' }
        }

        // this is either 'type' or 'value'
        const fieldProp = match.groups.prop
        if (fieldProp === 'type') {
            fieldSet[fieldKey].type = value as string
        } else {
            fieldSet[fieldKey].value = value as string
        }
    }
    return fieldSet
}

type TypeFieldsetEditorProps = {
    fieldList: credentialFieldSet
    keyPrefix: string
}
export default function TypeFieldsetEditor(props: TypeFieldsetEditorProps) {
    const [fieldList, setFieldList] = useState<credentialFieldSet>(props.fieldList)
    const usm = useMessage()
    
    const addNewField = async (title:string) => {
        if (!title || title.length === 0) {
            usm.error('Field name cannot be empty')
            return
        }

        for (const key of Object.keys(fieldList)) {
            if (key === title) {
                usm.error('Field name already exists')
                return
            }
        }
        usm.clear()

        const newField = { type: 'string', value: '' }
        const newState = { ...fieldList, [title]: newField }
        setFieldList(newState)
    }

    const remove = (prop:string) => {
        const newState = { ...fieldList }
        delete newState[prop]
        usm.clear()
        setFieldList(newState)
    }

    const reKey = (oldKey:string, newKey:string) => {
        if (oldKey === newKey) return false
        if (Object.keys(fieldList).includes(newKey)) {
            usm.error('Field name already exists')
            return false
        }
        const newState = { ...fieldList }
        newState[newKey] = newState[oldKey]
        delete newState[oldKey]
        usm.clear()
        setFieldList(newState)
        return true
    }

    return <div className='TypeFieldsetEditor'>
        <header>
            <span>Credential Fields</span>
        </header>
        { usm.message }
        {
            Object.entries(fieldList).map(([prop, credentialField], index) => {                
                return <CredentialProp key={prop} name={prop} type={credentialField.type} value={credentialField.value} keyPrefix={props.keyPrefix} remove={() => remove(prop)} rekey={(newKey) => reKey(prop, newKey)} />
            })
        }
        <ActionBar>
            <ActionButtonText onClick={addNewField}>Add Field</ActionButtonText>
        </ActionBar>
    </div>
}
