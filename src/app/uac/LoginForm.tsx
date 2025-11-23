'use client'

import * as Auth from '@server/Auth'
import { useState, useEffect } from 'react'
import { useMessage } from '@/components/ServerResponse'
import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar } from '@/components/Actions'

function UserInfo({user}) {
    const {firstName, lastName} = user
    return <div>
        You are logged in as {firstName} {lastName}.
    </div>
}

export function LoginWidget() {
    const loggedIn = useState(null) // Placeholder for actual auth state
    useEffect(() => {
        Auth.currentUser().then(currentUser => {
            if (!currentUser) {
                loggedIn[1](false)
                return
            }
            loggedIn[1](currentUser)
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

function LoginForm({loginState}) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const serverMessage = useMessage()

    const setUn = e => {
        e.preventDefault()
        setUsername(e.target.value)
    }
    const setPw = e => {
        e.preventDefault()
        setPassword(e.target.value)
    }
    const doLogin = e => {
        e.preventDefault()
        Auth.login({username, password}).then(res => {
            if (!serverMessage.statusResponse(res)) return
            loginState[1](res.data)
        })
    }


    return <ComponentSection header="Login">
        <form onSubmit={doLogin} id="login-form">
            {serverMessage.message}
            <input type="text" name="username" placeholder="Username" value={username} onChange={setUn} />
            <input type="password" name="password" placeholder="Password" value={password} onChange={setPw} />
            <ActionBar>
                <input type="submit" value="Sign in" />
            </ActionBar>
        </form>
    </ComponentSection>
}
