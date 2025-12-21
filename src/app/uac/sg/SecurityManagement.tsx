'use client'

import { ComponentSection } from "@/components/ComponentSection"
import { useState, useActionState } from "react"
import * as sg from '@server/lib/SecurityGroups'
import Form from 'next/form'
import { FormInputField, FormActionBar, validationError, blankStatus } from '@/components/FormActions'
import Card from '@/components/Card'
import { IconButton } from "@/components/IconButton"

declare type eip = {
    securityItem: sg.SecurityGroup|null,
    updatedItem: (group: sg.SecurityGroup) => void
}
function EditItem({securityItem, updatedItem} : eip) {
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
                updatedItem(csg)
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

function SecurityListItem({sg, editItem, deleteItem}: {sg: sg.SecurityGroup, editItem: Function, deleteItem: Function}) {
    return <tr key={sg.securityGroupId}>
        <td>{sg.name}</td>
        <td>{sg.description}</td>
        <td>{sg.isDefault ? "Default" : ""}</td>
        <td>
            <IconButton className="fa fa-pencil" title="Edit Security Group" action={editItem} />
            <IconButton className="fa fa-trash" title="Delete Security Group" action={deleteItem} />
        </td>
    </tr>
}

declare type slp = {
    securityGroupOptions: sg.SecurityGroup[],
    setSecurityGroupOptions: (sg: sg.SecurityGroup[]) => void,
    editItem: Function,
    deleteItem: (securityGroupId: number) => void
}
function SecurityList({securityGroupOptions, setSecurityGroupOptions, editItem, deleteItem}: slp) {

    const [state, createNew, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const name = formData.get('name') as string
            const description = formData.get('description') as string
            const op = await sg.create(name,description)
            if (!op.status || !op.data) {
                return op
            }
            const nsg = op.data
            setSecurityGroupOptions([...securityGroupOptions, nsg])
            return op
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
                {securityGroupOptions.map(sg => <SecurityListItem key={sg.securityGroupId} sg={sg} editItem={() => editItem(sg)} deleteItem={() => deleteItem(sg.securityGroupId)} />)}
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
    const updateListItem = (nsg: sg.SecurityGroup) => {
        const newOptions = securityGroupOptions.map(csg => 
            csg.securityGroupId === nsg.securityGroupId ? nsg : csg
        )
        setSecurityGroupOptions(newOptions)
    }

    const deleteItem = async (sgn: number) => {
        console.debug('Deleting security group', sgn)
        const res = await sg.remove(sgn)
        if (!res) return false
        const newOptions = securityGroupOptions.filter(sg => sg.securityGroupId !== sgn)
        setSecurityGroupOptions(newOptions)
        setSecurityItem(null)
        return true
    }

    return <div>
        <Card header="Security Group Management">
            <p>Security Groups are a component of the test case arguments sent when running a test or plan.</p>
            <p>They are common across all tests to implement the same test can be tested against different roles.</p>
        </Card>
        <SecurityList securityGroupOptions={securityGroupOptions} setSecurityGroupOptions={setSecurityGroupOptions} editItem={editItem} deleteItem={deleteItem} />
        <EditItem securityItem={securityItem} updatedItem={nsg => updateListItem(nsg)} />
    </div>
}