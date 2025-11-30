'use client'

import * as Sessions from '@server/Sessions'
import { ActionBar, ActionButton } from '@/components/Actions'
import { ComponentSection } from '@/components/ComponentSection'

import { useState, useEffect } from 'react'
import { logout } from '../actions'

import UaParser from 'my-ua-parser'

const formatUa = (ua: string) => {
    if (!ua || ua == '') return 'N/A'
    const parsed = UaParser(ua)
    if (!parsed) return ua

    const {browser, os, device} = parsed
    let parts = []
    if (browser.name) parts.push(browser.name + (browser.version ? ' ' + browser.version : ''))
    if (os.name) parts.push(os.name + (os.version ? ' ' + os.version : ''))
    if (device.vendor) parts.push(device.vendor + (device.model ? ' ' + device.model : ''))
    return parts.join(' / ')
}

function SessionRow({session, deactivateFn}: {session: any, deactivateFn: (id:number) => void}) {
    const {host,ua,userIp} = session.sessionTypeId || {}
    const expiry = session.expiresAt

    const hasExpired = (new Date(expiry) < new Date())
    const button = session.isCurrent || hasExpired ?  '' : <ActionButton onClick={() => deactivateFn(session.id)}>Deactivate</ActionButton>

    const agentString = formatUa(ua)

    return <tr>
        <td>{session.id}{session.isCurrent ? ' (current)' : ''}</td>
        <td>{agentString}</td>
        <td>{userIp || 'N/A'}</td>
        <td>{expiry}</td>
        <td>{button}</td>
    </tr>
}

function SessionList({sessionListState} : {sessionListState: [sessionDisplayItem[], React.Dispatch<React.SetStateAction<sessionDisplayItem[]>>]}) {
    const deactivate = (id:number) => {
        Sessions.deactivate(id).then(result => {
            if (!result) return
            const newList = sessionListState[0].filter(s => s.id !== id)
            sessionListState[1](newList)
        })
    }

    const sessionList = sessionListState[0]
    return <tbody>
        {sessionList.map((s,i) => <SessionRow key={i} session={s} deactivateFn={deactivate} />)}
    </tbody>
}

declare type sessionDisplayItem = {
    id: number,
    isCurrent: boolean,
    sessionTypeId: {
        host?: string,
        ua?: string,
        userIp?: string
    } | null,
    expiresAt: string

}
export default function SessionManagement() {
    const sessionState = useState([] as sessionDisplayItem[])

    useEffect(() => {
        Sessions.list().then(reply => {
            const {list, currentSessionId} = reply
            const newList = [] as sessionDisplayItem[]
            
            for (let l of list) {
                const {expiresAt} = l
                if (expiresAt == null || expiresAt < new Date()) {
                    continue
                }
                const di = {
                    id: l.id,
                    isCurrent: (l.id+ '' === currentSessionId),
                    sessionTypeId: l.sessionTypeId,
                    expiresAt: expiresAt.toLocaleString()
                } as sessionDisplayItem
                newList.push(di)
            }
            // console.log('Sessions:', list, currentSessionId)
            sessionState[1](newList)
        })
    }, [])

    return <ComponentSection header='Session Management' className={['session-management']}>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>User Agent</th>
                    <th>IP Address</th>
                    <th>Expires At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <SessionList sessionListState={sessionState} />
        </table>
        <form onSubmit={logout} >
            <ActionBar>
                <input type='submit' value='Log out' />
            </ActionBar>
        </form>
    </ComponentSection>
}
