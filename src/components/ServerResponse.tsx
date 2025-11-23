
import { useState } from 'react';

function useMessage(defaultMessage?:ServerReply) {
    const [messageType,setMessageType] = useState(defaultMessage?.statusType || '')
    const [message,setMessage] = useState(defaultMessage?.message || '')
    const clear = () => {
        setMessageType('')
        setMessage('')
    }

    return {
        errorHandler: (e:Error) => {
            setMessageType('error')
            setMessage(e.message || 'An error occurred')
        },
        statusResponse: (response:ServerReply) => {
            if (response.status) {
                setMessageType('success')
            } else {
                setMessageType('error')
            }
            setMessage(response.message)
            return response.status
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

function ServerResponseComponent({children,type='success'}) {
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
            icon = ''
            hasResponse = ''
        break
    }

    return <div className={'serverResponse ' + type + hasResponse}>
        <span><span className={icon}></span></span>
        <div className={type}>{children}</div>
    </div>
}



export { useMessage }

