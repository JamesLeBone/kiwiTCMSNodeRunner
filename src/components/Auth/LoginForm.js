'use client'

import { PopOut } from '@/components/Popout.js'
import { useState } from 'react'
import { useMessage } from '@/components/ServerResponse'

export default function LoginForm({onSubmit}) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const serverMessage = useMessage()

    const set = (e) => {
        e.preventDefault()
        const key = e.target.name ?? null
        if (key == null) return

        if (key === 'username') setUsername(e.target.value)
        if (key === 'password') setPassword(e.target.value)
    }

    const doLogin = e => {
        e.preventDefault()
        onSubmit(username,password)
            .then(serverResponse => {
                console.debug('Login response', serverResponse)
                serverMessage['error']('Invalid login')
            })
    }

    return <PopOut title={'Sign in'}>
        <form onSubmit={doLogin}>
            {serverMessage.message}
            <input type="text" name="username" placeholder="Username" value={username} onChange={set} />
            <input type="password" name="password" placeholder="Password" value={password} onChange={set} />
            <input type="submit" value="Sign in" />
        </form>
    </PopOut>
}
