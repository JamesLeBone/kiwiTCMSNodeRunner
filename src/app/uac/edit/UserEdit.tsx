'use client'
import { useState } from 'react'
import { useMessage } from '@/components/ServerResponse'

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { ActionBar } from '@/components/Actions'
import { InputField } from '@/components/InputField'

import * as Users from '@server/Users'

const ns = (ob, invar) => {
    const v = ob[invar]
    const r = (v ?? null) ? v : ''
    return r
}

export function UserEdit({onSubmit,userState}) {
    const hasUserId = typeof userState[0].userId != 'undefined'
    const header = hasUserId ? 'Edit User' : 'Create User'

    const ust = useMessage()

    const setUserEvent = e => {
        e.preventDefault()
        onSubmit()
        .then(operation => ust.info(operation[1]))
    }

    const pedit = (userState,prop) => {
        return {
            value: ns(userState[0],prop),
            onChange: v => {
                const st = {...userState[0]}
                st[prop] = v
                userState[1](st)
            }
        }
    }

    return <ComponentSection header={header} style={{display:'inline-grid'}}>
        { ust.message }
        <form onSubmit={setUserEvent}>
            <fieldset style={{gridTemplateColumns:'350px'}}>
                <FormField label="Username">
                    <InputField name="username" {...pedit(userState,'username')} />
                </FormField>
                <FormField label="First Name">
                    <InputField name="firstName" {...pedit(userState,'firstName')} />
                </FormField>
                <FormField label="Last Name">
                    <InputField name="lastName" {...pedit(userState,'lastName')} />
                </FormField>
                <FormField label="Email">
                    <InputField name="email" {...pedit(userState,'email')} />
                </FormField>
            </fieldset>
            <ActionBar>
                <input type="submit" value="Save" />
            </ActionBar>
        </form>
    </ComponentSection>
}

export function EditUser({user}) {
    const userState = useState(user)
    const userId = user.userId

    const updateUser = async () => {
        const {firstName, lastName, email, username } = userState[0]
        return Users.update(userId, lastName, firstName, email, username)
    }

    return <UserEdit userState={userState} onSubmit={updateUser} />
}

export function CreateUser({}) {
    const userState = useState({})

    const createUser = async () => {
        await Users.create(userState[0])
        .then(operation => {
            if (operation.status == 'success') {
                userState[1]({})
            }
            return operation
        })
    }

    return <UserEdit userState={userState} onSubmit={() => createUser()} />
}