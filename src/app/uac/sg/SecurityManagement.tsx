'use client'

import { ComponentSection } from "@/components/ComponentSection"
import { useState, useActionState } from "react"
import * as sg from '@server/lib/SecurityGroups'
import Form from 'next/form'
import { FormInputField, FormActionBar, validationError, blankStatus } from '@/components/FormActions'
import Well from "@/components/Well"
import { IconButton } from "@/components/IconButton"

declare type eip = {
    securityItem: sg.SecurityGroup|null
}
function EditItem({securityItem} : eip) {
    const [state, editItem, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const name = formData.get('name') as string
            const description = formData.get('description') as string
            const securityGroupId = securityItem?.securityGroupId
            if (!securityGroupId) return prevState
            const defaultValue = formData.get('default') === 'on' ? true : false
            const csg: sg.SecurityGroup = {
                securityGroupId,
                name,
                description,
                isDefault: defaultValue
            }

            const nsg = await sg.update(csg)
            if (nsg) {
                return {
                    ...prevState,
                    message: "Security Group updated successfully.",
                    status: true,
                    statusType : 'success',
                }
            }
            
            return {
                ...prevState,
                message: 'Failed to update Security Group.',
                status: false,
                statusType : 'error',
            }
            
        },
        blankStatus('resetPassword')
    )

    if (!securityItem) return null


    return <ComponentSection header='Edit Security Group'>
        
        <Form action={editItem} key={securityItem.securityGroupId}>
            <h3>Edit Security Group</h3>
            <fieldset>
                <FormInputField name="securityGroupId" label="ID" required={true} value={securityItem.securityGroupId+''} />
                <FormInputField name="name" label="Name" required={true} value={securityItem.name} />
                <FormInputField name="description" label="Description" required={false} value={securityItem.description} />
                <FormInputField name="default" label="Default" value={securityItem.isDefault} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Update' }]} />
        </Form>
    </ComponentSection>
}

function SecurityListItem({sg, editItem}: {sg: sg.SecurityGroup, editItem: Function}) {
    return <tr key={sg.securityGroupId}>
        <td>{sg.name}</td>
        <td>{sg.description}</td>
        <td>{sg.isDefault ? "Default" : ""}</td>
        <td>
            <IconButton className="fa fa-pencil" title="Edit Security Group" action={editItem} />
        </td>
    </tr>
}

declare type slp = {
    securityGroupOptions: sg.SecurityGroup[],
    editItem: Function
}
function SecurityList({securityGroupOptions, editItem}: slp) {
    const [optionList, setOptionList] = useState(securityGroupOptions)

    const [state, createNew, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const name = formData.get('name') as string
            const description = formData.get('description') as string
            const nsg = await sg.create(name,description)

            const isSuccess = nsg.securityGroupId !== undefined
            if (isSuccess) {
                setOptionList([...optionList, nsg as sg.SecurityGroup])
                console.debug('New group', nsg)
            }
            
            return {
                ...prevState,
                message: isSuccess ? "Security Group created successfully." : "Failed to create Security Group.",
                status: isSuccess,
                statusType : isSuccess ? 'success' : 'error',
            }
            
        },
        blankStatus('resetPassword')
    )

    return <ComponentSection header="Security Groups">
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Default Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {optionList.map(sg => <SecurityListItem key={sg.securityGroupId} sg={sg} editItem={() => editItem(sg)} />)}
            </tbody>
        </table>
        <Form action={createNew}>
            <h3>Create new Security Group</h3>
            <fieldset>
                <FormInputField name="name" label="Name" required={true} />
                <FormInputField name="description" label="Description" required={false} />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Add new' }]} />
        </Form>
    </ComponentSection>
}

declare type smp = {
    list: sg.SecurityGroup[]
}
export default function SecurityManagement({list}: smp) {
    const [securityGroupOptions,setSecurityGroupOptions] = useState(list)
    const [securityItem,setSecurityItem] = useState<sg.SecurityGroup|null>(null)

    const editItem = (sg: sg.SecurityGroup) => {
        setSecurityItem(sg)
    }

    return <div>
        <Well title="Security Group Management">
            <p>Security Groups are a component of the test case arguments sent when running a test or plan.</p>
            <p>They are common across all tests to implement the same test can be tested against different roles.</p>
        </Well>
        <SecurityList securityGroupOptions={securityGroupOptions} editItem={editItem} />
        <EditItem securityItem={securityItem} />
    </div>
}