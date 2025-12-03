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

function SessionRow({session, deactivateFn}: {session: SessionDetail, deactivateFn: (id:number) => void}) {
    const expiry = session.expiresAt

    const hasExpired = expiry ? (new Date(expiry) < new Date()) : false
    // const button = session.isCurrent || hasExpired ?  '' : <ActionButton onClick={() => deactivateFn(session.id)}>Deactivate</ActionButton>

    const agentString = formatUa(session.ua || '')

    return <tr>
        <td>{session.id}</td>
        <td>{agentString}</td>
        <td>{session.userIp || 'N/A'}</td>
        <td>{expiry}</td>
        <td></td>
    </tr>
}

function SessionList({sessionList} : {sessionList: SessionDataList}) {
    const deactivate = (id:number) => {
        // Sessions.deactivate(id).then(result => {
        //     if (!result) return
        //     const newList = sessionList.list.filter(s => s.id !== id)
        //     // sessionListState[1](newList)
        // })
    }

    return <tbody>
        {sessionList?.list.map((s,i) => <SessionRow key={i} session={s} deactivateFn={deactivate} />)}
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
    const [sessionState, setSessionState] = useState({
        list: [],
        currentSessionId: null
    } as SessionDataList)

    useEffect(() => {
        Sessions.list().then(reply => setSessionState(reply))
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
            <SessionList sessionList={sessionState} />
        </table>
        <form onSubmit={logout} >
            <ActionBar>
                <input type='submit' value='Log out' />
            </ActionBar>
        </form>
    </ComponentSection>
}
