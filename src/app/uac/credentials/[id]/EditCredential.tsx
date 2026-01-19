'use client'

import { ComponentSection } from "@/components/ComponentSection"
import { FormField } from '@/components/FormField'
import { FormInputField, FormActionBar, blankStatus } from '@/components/FormActions'
import { groupedOptions, selectionOption, Selection, GroupedSelection, selectionOptionProps } from "@/components/Selection"

import { StatusOperation } from "@lib/Operation"

import { credentialFieldSet } from "@server/lib/Credentials"
import { updateCredential } from "@server/Credentials"
import type { credentialDetails } from '@server/Credentials'

import Form from 'next/form'
import { useActionState } from "react"

import type { categoryOptionList } from './page'

const mapProductOptions = (categoryOptions: categoryOptionList) : selectionOptionProps => {
    const options:selectionOptionProps = {
        '': 'None'
    }
    for (const co of categoryOptions) {
        const productName = co.product.name
        const productId = co.product.id.toString()
        
        options[productId] = productName
    }
    return options
}
const mapCategoryOptions = (categoryOptions: categoryOptionList) : groupedOptions[] => {
    const options: groupedOptions[] = [
        {label: 'None', groupId: 'none', options: [ { value: '', label: 'None' } ] }
    ]
    for (const co of categoryOptions) {
        const productId = co.product.id.toString()
        const productName = co.product.name
        const option:groupedOptions = {
            label: productName,
            groupId: productId,
            options: co.categories.map( c => ({ value: c.id.toString(), label: c.name }) )
        }
        options.push(option)
    }
    return options
}

type ecprops = {
    credential: credentialDetails
    categories: categoryOptionList
}
export default function EditCredential(props : ecprops) {
    const { userCredentialId, description } = props.credential.credentials
    const fields = props.credential.credentials.credential
    const productOptions = mapProductOptions( props.categories )
    const categoryOptions = mapCategoryOptions( props.categories )

    const [state, actionUpdate, isPending] = useActionState(
        async (prevState: StatusOperation, formData: FormData) => {
            const credentialFS = {} as credentialFieldSet
            for (const [key, value] of formData.entries()) {
                const fieldMatch = key.match(/^credential\[(?<name>.+)\]$/)
                if (!fieldMatch || !fieldMatch.groups) continue
                const fieldName = fieldMatch.groups.name
                credentialFS[fieldName] = { 
                    ...fields[fieldName],
                    value: value as string
                }
            }

            const op = await updateCredential(userCredentialId, credentialFS)
            op.statusType = op.status ? 'success' : 'error'
            return op as StatusOperation
        },
        blankStatus('actionUpdate')
    )
    const header = `Edit ${description}`

    const productId = props.credential.product ? props.credential.product.id.toString() : ''
    const categoryId = props.credential.category ? props.credential.category.id.toString() : ''
    
    return <ComponentSection header={header}>
        <Form action={actionUpdate} >
            <fieldset>
                {Object.entries(fields).map(([fieldName, fieldDef]) => {
                    const inputName = `credential[${fieldName}]`
                    const inputType = fieldDef.type
                    
                    return <FormInputField 
                        key={fieldName} 
                        label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ':'} 
                        name={inputName} 
                        type={inputType} 
                        value={fieldDef.value ? fieldDef.value.toString() : ''} 
                    />
                })}
            </fieldset>
            <fieldset>
                <FormField label="Product">
                    <Selection name="product" options={productOptions} value={productId} />
                </FormField>
                <FormField label="Category">
                    <GroupedSelection selectAttribs={{name:'category', value:categoryId}} options={categoryOptions} />
                </FormField>
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Update' }]} />
        </Form>
    </ComponentSection>
}
