'use client'

import * as Auth from '@server/Auth'
import { useState, useEffect } from 'react'
import { useMessage } from '@/components/ServerResponse'
import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar } from '@/components/Actions'
import { InputField } from '@/components/InputField'
import { FormField } from '@/components/FormField'
import type { verifiedUser } from '@server/lib/Users'

function UserInfo({user}: {user: verifiedUser}) {
    const {firstName, lastName} = user
    return <div>
        You are logged in as {firstName} {lastName}.
    </div>
}

type loginState = verifiedUser | false

export function LoginWidget() {
    const loggedIn = useState(false as loginState) // Placeholder for actual auth state
    useEffect(() => {
        Auth.currentUser().then(cuo => {
            if (!cuo.data) {
                loggedIn[1](false)
                return
            }
            loggedIn[1](cuo.data)
        })
    }, [])
    
    if (loggedIn[0] === null) {
        return <LoadingForm />
    }

    if (loggedIn[0] === false) {
        return <LoginForm loginState={loggedIn} />
    }

    const uiActions = <ActionBar>
        <button onClick={() => Auth.logout().then(() => loggedIn[1](false))}>Log Out</button>
    </ActionBar>

    return <ComponentSection header="User Info" actionbar={uiActions}>
        <UserInfo user={loggedIn[0]} />
    </ComponentSection>
}


function LoadingForm() {
    return <div>Loading...</div>
}

function LoginForm({loginState} : {loginState: [loginState: loginState, setLoginState: (state: loginState) => void]}) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const serverMessage = useMessage()

    const doLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        Auth.login({username, password}).then(res => {
            if (!serverMessage.statusResponse(res)) return
            if (!res.data) return
            loginState[1](res.data)
        })
    }


    return <ComponentSection header="Login">
        <form onSubmit={doLogin} id="login-form">
            {serverMessage.message}
            <fieldset>
                <FormField label="Username">
                    <InputField name="username" value={username} onChange={setUsername} />
                </FormField>
                <FormField label="Password">
                    <InputField type="password" name="password" value={password} onChange={setPassword} />
                </FormField>
            </fieldset>
            <ActionBar>
                <input type="submit" value="Sign in" />
            </ActionBar>
        </form>
    </ComponentSection>
}
