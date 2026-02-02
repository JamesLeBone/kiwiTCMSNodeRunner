'use client'
import { type credentialType } from '@server/lib/CredentialTypes'
import { updateType } from '@server/Credentials'

import { ComponentSection } from "@/components/ComponentSection"
import { FormField } from '@/components/FormField'
import { FormInputField, FormActionBar, blankStatus } from '@/components/FormActions'
import { groupedOptions, selectionOption, Selection, GroupedSelection, selectionOptionProps } from "@/components/Selection"

import { formDataValue } from "@lib/Functions"

import Form from 'next/form'
import { useActionState, useState } from "react"
import { StatusOperation } from '@lib/Operation'
import { credentialFieldSet } from '@server/lib/Credentials'
import TypeFieldsetEditor, {getFormDataValues} from '../../TypeFieldsetEditor'

import type { CategorySelectionOption } from '@lib/types'
const formPrefixString = 'credential'

type EditTypeProps = {
    type: credentialType
    selectionOptions: CategorySelectionOption[]
}
export default function EditType(props: EditTypeProps) {

    const [state, actionUpdate, isPending] = useActionState(
        async (prevState: StatusOperation, formData: FormData) => {
            const submissionData = {
                credentialTypeId: props.type.credentialTypeId,
                description: formDataValue.getString(formData, 'description'),
                productId: formDataValue.getOptionalNumber(formData, 'productId'),
                categoryId: formDataValue.getOptionalNumber(formData, 'categoryId'),
                fields: getFormDataValues(formData, formPrefixString),
                scriptPrefix: formDataValue.getString(formData, 'scriptPrefix')
            }
            
            const updateResult = await updateType(
                submissionData.credentialTypeId,
                submissionData.description,
                submissionData.fields,
                submissionData.scriptPrefix,
                submissionData.productId,
                submissionData.categoryId
            )
            return updateResult
        },
        blankStatus('actionUpdate')
    )

    return <ComponentSection header="Edit Credential Type">
        <Form action={actionUpdate}>
            <fieldset>
                <FormInputField label="Description" name="description" type="text" required={true} value={props.type.description} />
                <FormInputField label='Script Prefix' name='scriptPrefix' type='text' value={props.type.scriptPrefix} />
            </fieldset>
            <ProductCategorySelection productId={props.type.productId} categoryId={props.type.categoryId} selectionOptions={props.selectionOptions} />
            <TypeFieldsetEditor fieldList={props.type.fields} keyPrefix={formPrefixString} />
            
            <FormActionBar pendingState={isPending} state={state} actions={'Save'} />
        </Form>
    </ComponentSection>

}

const mapProductOptions = (categoryOptions: CategorySelectionOption[]) : selectionOptionProps => {
    const options:selectionOptionProps = {
        '': 'None'
    }
    for (const co of categoryOptions) {
        const productName = co.productName
        const productId = co.productId.toString()
        
        options[productId] = productName
    }
    return options
}
const mapCategoryOptions = (categoryOptions: CategorySelectionOption[]) : groupedOptions[] => {
    const options: groupedOptions[] = [
        {label: 'None', groupId: 'none', options: [ { value: '', label: 'None' } ] }
    ]
    for (const co of categoryOptions) {
        const productId = co.productId.toString()
        const productName = co.productName
        const option:groupedOptions = {
            label: productName,
            groupId: productId,
            options: co.categories.map( c => ({ value: c.id.toString(), label: c.name }) )
        }
        options.push(option)
    }
    return options
}

type pcsprops = {
    productId?: number
    categoryId?: number
    selectionOptions: CategorySelectionOption[]
}
function ProductCategorySelection(props: pcsprops) {
    const productId = props.productId ? props.productId.toString() : ''
    const categoryId = props.categoryId ? props.categoryId.toString() : ''

    const productOptions = mapProductOptions( props.selectionOptions )
    const categoryOptions = mapCategoryOptions( props.selectionOptions )


    const selectedProductState = useState(productId)
    const selectedCategoryState = useState(categoryId)
    const updateProduct = async (newProductId: string) => {
        selectedProductState[1](newProductId)
        // Reset category selection when product changes
        selectedCategoryState[1]('')
    }
    const updateCategory = (newCategoryId: string) => {
        selectedCategoryState[1](newCategoryId)
        for (const co of props.selectionOptions) {
            for (const c of co.categories) {
                if (c.id.toString() === newCategoryId) {
                    selectedProductState[1](co.productId.toString())
                    return
                }
            }
        }
        // Product not found for category, reset product selection
        // This should not normally happen but is safer than leaving it set.
        selectedProductState[1]('')
    }

    return <fieldset>
        <FormField label="Product">
            <Selection name="productId" options={productOptions} value={selectedProductState[0]} onChange={(newProductId) => updateProduct(newProductId)}  />
        </FormField>
        <FormField label="Category">
            <GroupedSelection selectAttribs={{name:'categoryId', value:selectedCategoryState[0]}} options={categoryOptions} onChange={updateCategory} />
        </FormField>
    </fieldset>
}
