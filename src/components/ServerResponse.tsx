
import type { statusType } from '@lib/Operation'
type ServerResponseProps = {
    children: React.ReactNode
    type?: statusType
}
export default function ServerResponse({children,type='blank'}: ServerResponseProps) {
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
