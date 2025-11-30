'use client'
import { useState, useEffect } from 'react'
import ChecklistItem, { clip } from '@app/setup/components/ChecklistItem'
import * as hc from '@server/HealthCheck'
import {statuses}  from '@/components/Processing'
import UserStatus from './UserStatus'

export default function DatabaseStatus() {
    const [status, setStatus] = useState('processing' as statuses)
    const [message, setMessage] = useState('Checking database status...')
    const [buttonDisabled, setButtonDisabled] = useState(true)
    const [buttonText, setButtonText] = useState('Loading...')

    // On auto init DB or on button trigger result.
    const initdb = async () => {
        setButtonDisabled(true)
        setButtonText('Initializing...')

        const {status,message} = await hc.initializeDatabase()
        setStatus(status ? 'done' : 'error')
        setMessage(message)
        setButtonDisabled(status)
    }

    useEffect(() => { initdb() }, [])
    const actionProps = {
        action: initdb,
        isLoading: buttonDisabled,
        actionText: buttonText
    }

    return <>
        <ChecklistItem status={status} message={message} actionProps={actionProps} />
        <UserStatus dbStatus={status} />
    </>
}
