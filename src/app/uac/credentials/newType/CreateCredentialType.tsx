'use client'

import { useState } from 'react'
import { ComponentSection } from '@/components/ComponentSection'
import { addNewType } from '@server/Credentials'
import type { credentialFieldSet } from '@server/lib/Credentials'

import { useActionState } from 'react'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import Form from 'next/form'
import { StatusOperation } from '@lib/Operation'

const formInputOptions = {
    text: 'Text',
    password: 'Password',
    number: 'Number',
    email: 'Email'
}

function CredentialProp({name, type, value}:{name:string, type:string, value?:string|number}) {
    const [baseName, setBaseName] = useState('credential[' + name + ']')
    const stringValue = type === 'password' ? ''  : value ? value.toString() : ''

    const style = {
        display: 'inline-grid',
        gridGap: '8px',
        padding : '8px',
    }
    const updateName = (newName:string) => {
        setBaseName('credential[' + newName + ']')
    }

    return <fieldset style={style}>
        <FormInputField label='Name:' type="text" value={name} onChange={(newName) => updateName(newName)} />
        <FormSelection  label='Data Type:' name={baseName + '[type]'} value={type} options={formInputOptions} />
        <FormInputField label='Default Value:' name={baseName + '[value]'} type="text" value={stringValue} />
    </fieldset>
}

function TypeEditor({fieldList, setFieldList}:{fieldList:credentialFieldSet, setFieldList: (fields:credentialFieldSet)=>void}) {
    return <>
        {Object.entries(fieldList).map(([prop, credentialField], index) => 
            <CredentialProp key={prop} name={prop} type={credentialField.type} value={credentialField.value} />
        )}
    </>
}

export default function CreateCredentialType() {
    const [fieldList, setFieldList] = useState({
        'username': { type: 'string', value: '' },
        'password': { type: 'password', value: '' }
    } as credentialFieldSet)

    const addNewField = () => {
        const newFieldName = `field${Object.keys(fieldList).length + 1}`
        const newField = { type: 'string', value: '' }
        const newState = { ...fieldList, [newFieldName]: newField }
        // console.info('Adding new field:', newFieldName)
        setFieldList(newState)
    }

    const [state, send, isPending] = useActionState(
        async (prevState: StatusOperation, formData: FormData) => {
            const action = formData.get('action')
            // console.debug('Form action:', action)
            if (action != 'Create Credential Type') return prevState

            const formDataObj = {
                description: formData.get('description') as string,
                fields: {} as credentialFieldSet
            }

            for (const [key, value] of formData.entries()) {
                if (!key.startsWith('credential[')) continue
                // credential[fieldName][type|value]
                const match = key.match(/^credential\[(?<key>.+?)\]\[(?<prop>.+?)\]$/)
                if (!match || !match.groups) continue
                const fieldKey = match.groups.key
                const fieldProp = match.groups.prop

                if (!formDataObj.fields[fieldKey]) {
                    formDataObj.fields[fieldKey] = { type: 'string', value: '' }
                }
                if (fieldProp === 'type') {
                    formDataObj.fields[fieldKey].type = value as string
                } else if (fieldProp === 'value') {
                    formDataObj.fields[fieldKey].value = value as string
                }
            }

            return await addNewType(formDataObj.description, formDataObj.fields)
        },
        blankStatus('createCredentialType')
    )

    const formActions = [
        { label: 'Create Credential Type', id: 'create' },
        { label: 'Add Field', id: 'addField', onClick: () => addNewField() }
    ]

    return <ComponentSection header="Create Credential Type">
        <Form action={send}>
            <fieldset>
                <FormInputField label="Description" name="description" type="text" required={true} />
            </fieldset>
            <TypeEditor fieldList={fieldList} setFieldList={setFieldList} />
            
            <FormActionBar pendingState={isPending} state={state} actions={formActions} />
        </Form>
    </ComponentSection>
}