
import { ActionButton } from '@/components/Actions'
import Processing, {statuses}  from '@/components/Processing'

export type clip = {
    status: statuses
    message: string
    actionProps: ActionProps
}
export type ActionProps = {
    action: Function
    isLoading: boolean
    actionText: string
}

function ActionHandler({status, actionProps} : {status: statuses, actionProps: ActionProps}) {
    if (status === 'done') return <span></span>
    return <ActionButton onClick={() => actionProps.action()} disabled={actionProps.isLoading}>
        {actionProps.isLoading ? 'Processing...' : actionProps.actionText}
    </ActionButton>
}

export default function ChecklistItem({status,message, actionProps} : clip) {
    return <>
        <span style={{padding: '4px'}}>
            <Processing status={status} />
        </span>
        <span style={{padding: '4px'}}>
            {message}
        </span>
        <ActionHandler status={status} actionProps={actionProps} />
    </>
}
