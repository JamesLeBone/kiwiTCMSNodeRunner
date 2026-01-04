
import { useState } from 'react'
import type { Operation, OperationResult, statusType } from '@lib/Operation'

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
        message: <ServerResponseComponent type={messageType}>{message}</ServerResponseComponent>,
    }
}

type ServerResponseProps = {
    children: React.ReactNode
    type?: statusType
}
function ServerResponseComponent({children,type='blank'}: ServerResponseProps) {
    let hasResponse = ' hasResponse'

    let icon = 'status-icon '
    switch (type) {
        case 'error':
            icon += 'fa-solid fa-xmark'
        break
        case 'warning':
            icon += 'fa-solid fa-triangle-exclamation'
        break
        case 'info':
            icon += 'fa-solid fa-circle-info'
        break
        case 'loading':
            icon += 'fa-solid fa-spinner fa-spin'
            hasResponse = ''
        break
        case 'success':
            icon += 'fa-solid fa-check'
        break
        default:
        case 'blank':
            icon = ''
            hasResponse = ''
        break
    }

    return <div className={'serverResponse ' + type + hasResponse}>
        <span><span className={icon}></span></span>
        <div className={type}>{children}</div>
    </div>
}



export { useMessage, ServerResponseComponent }

