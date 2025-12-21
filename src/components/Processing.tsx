export declare type statuses = 'processing' | 'done' | 'error' | 'disabled' | 'idle'

export default function Processing({status}: {status: statuses}) {
    if (status == 'processing') {
        return <span className={'processing'}>
            <i className='fa fa-spinner'></i>
        </span>
    }
    if (status == 'done') {
        return <i className='fa fa-check'></i>
    }
    if (status == 'disabled') {
        return <i className='fa fa-minus'></i>
    }
    if (status == 'idle') {
        return <i className='fa fa-circle'></i>
    }
    return <i className='fa fa-xmark'></i>
}
