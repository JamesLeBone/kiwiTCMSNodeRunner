'use client'
// Widget for handling logins
import * as Auth from '@server/Auth'
import LoginForm from './LoginForm.js'
import { useState, useEffect } from 'react'
import Menu from '@app/Menu.js'

function DisplayComponent({user,logout}) {
    const signOutAction = e => {
        e.preventDefault()
        e.stopPropagation()
        logout()
    }

    const links = [
        {url:'/uac', title:'User Access Control'}
    ]

    return <Menu list={links}>
        <a className='button' onClick={signOutAction}>Sign out {user.firstName}</a>
    </Menu>
}

const useAuth = () => {
    const userState = useState(false)

    const serverResponse = (status,message) => {return {status,message}}
    const serverCall = (name, params, onSuccess) => Auth[name](params)
    .then(response => {
        console.debug('Server response', response)
        if (!response.status) {
            return serverResponse('error', response.message)
        }
        onSuccess(response.body)
    }, reject => {
        console.error(reject)
        return serverResponse('error','Server request failed')
    })

    return {
        login: (username,password) => Auth.login({username,password})
        .then(response => {
            if (!response.status) return response
            userState[1](response.data)
        }),
        logout: () => serverCall('logout',{},() => {
            userState[1](false)
            window.location = '/'
        }),
        verify: () => {
            Auth.currentUser().then(currentUser => {
                if (!currentUser) {
                    userState[1](false)
                    return
                }
                serverResponse('success','User verified')
                if (currentUser) {
                    userState[1](currentUser)
                }
            })
        },
        user: userState[0]
    }

}

export default function UserAccessControl() {
    const authhandler = useAuth()

    useEffect(() => {
        authhandler.verify()
    },[])
    
    return <div className='right'>
        {authhandler.user ? <DisplayComponent user={authhandler.user} logout={authhandler.logout} />  : <LoginForm onSubmit={authhandler.login} />}
    </div>
}
