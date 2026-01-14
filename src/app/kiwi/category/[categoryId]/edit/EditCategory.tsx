'use client'
import { useState, useActionState, useEffect } from 'react'
import Form from 'next/form'
import Link from 'next/link'

import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection, FormAction } from '@/components/FormActions'
import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'

import type { Category } from '@server/kiwi/Category'
import { updateCategory } from '@server/kiwi/Category'

import { formDataValue } from '@lib/Functions'

export default function EditCategory(props: {category: Category, productName: string}) {
    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const name = formDataValue.getString(formData, 'name')
            const description = formDataValue.getString(formData, 'description', '')

            const result = await updateCategory(props.category.id, name, description)
            return result
        },
        blankStatus('updateProduct')
    )

    return <div>
        <ComponentSection header='Category Edit' style={{display:'grid'}}>
            <Form action={formAction}>
                <fieldset>
                    <FormField label='Product'>{props.productName}</FormField>
                    <FormField label='Category Id'>{props.category.id}</FormField>
                    <FormInputField label="Name" name="name" required={true} value={props.category.name} />
                </fieldset>
                <fieldset style={{display:'block'}}>
                    <FormInputField label="Description" name="description" value={props.category.description} type="textarea" />
                </fieldset>
                <FormActionBar pendingState={isPending} state={state} actions='Update' />
            </Form>
        </ComponentSection>
    </div>
}
