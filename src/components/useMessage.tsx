'use client'
/**
 * This could be in it's own hook folder, but I only have one so far.
 */
import { useState } from 'react'
import type { Operation, OperationResult, statusType } from '@lib/Operation'
import ServerResponse from '@/components/ServerResponse'

function useMessage(defaultMessage?:Operation) {
    const [messageType,setMessageType] = useState<statusType>(defaultMessage?.statusType || 'blank')
    const [message,setMessage] = useState(defaultMessage?.message || '')
    const clear = () => {
        setMessageType('info')
        setMessage('')
    }

    return {
        errorHandler: (e:Error) => {
            setMessageType('error')
            setMessage(e.message || 'An error occurred')
        },
        statusResponse: (response:OperationResult, verifyData = true) => {
            let status = response.status
            if (verifyData && typeof response.data == 'undefined') status = false

            if (typeof response.statusType != 'undefined') {
                setMessageType(response.statusType)
            } else if (status) {
                setMessageType('success')
            } else {
                setMessageType('error')
            }
            setMessage(response.message)
            return status
        },
        error: (message:string) => {
            setMessageType('error')
            setMessage(message)
        },
        success: (message:string) => {
            setMessageType('success')
            setMessage(message)
        },
        info: (message:string) => {
            setMessageType('info')
            setMessage(message)
        },
        warning: (message:string) => {
            setMessageType('warning')
            setMessage(message)
        },
        clear,
        loading: () => {
            setMessageType('loading')
            setMessage('Loading...')
        },
        message: <ServerResponse type={messageType}>{message}</ServerResponse>,
    }
}

export { useMessage }

