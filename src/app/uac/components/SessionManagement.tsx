'use client'

import * as Sessions from '@server/Sessions'
import { ActionBar, ActionButton } from '@/components/Actions'
import { ComponentSection } from '@/components/ComponentSection'
import type {
    SessionList as SessionDataList
    , SessionDetail
} from '@server/Sessions'

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

type srp = {
    isCurrent: boolean
    session: SessionDetail
    deactivateFn: (id:number) => void
}

function SessionRow({session,isCurrent, deactivateFn}: srp) {
    const expiry = session.expiresAt ? new Date(session.expiresAt).toLocaleString() : 'N/A'

    const agentString = formatUa(session.ua || '')

    return <tr>
        <td>{session.id}</td>
        <td>{agentString}</td>
        <td>{session.userIp || 'N/A'}</td>
        <td>{expiry}</td>
        <td>
            {isCurrent ? 'Current Session' : <ActionButton onClick={() => deactivateFn(session.id)}>Deactivate</ActionButton>}
        </td>
    </tr>
}

type slp = {
    sessionList: SessionDataList
    removeItem: (id:number) => void
}
function SessionList({sessionList, removeItem }: slp) {
    const deactivate = (id:number) => removeItem(id)

    return <tbody>
        {sessionList.list.map((s,i) => <SessionRow key={i} isCurrent={s.id === sessionList.currentSessionId} session={s} deactivateFn={deactivate} />)}
    </tbody>
}

type sessionDisplayItem = {
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
    const [sessionState, setSessionState] = useState({
        list: []
    } as SessionDataList)

    useEffect(() => {
        Sessions.list().then(reply => {
            setSessionState(reply)
        })
    }, [])

    const removeItem = (id:number) => {
        Sessions.deactivate(id).then(result => {
            if (!result) return
            const newList = sessionState.list.filter(s => s.id !== id)
            setSessionState({list: newList, currentSessionId: sessionState.currentSessionId})
        })
    }

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
            <SessionList sessionList={sessionState} removeItem={removeItem} />
        </table>
        <form onSubmit={logout} >
            <ActionBar>
                <input type='submit' value='Log out' />
            </ActionBar>
        </form>
    </ComponentSection>
}
