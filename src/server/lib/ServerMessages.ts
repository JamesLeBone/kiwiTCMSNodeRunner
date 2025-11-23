import { Operation } from './Operation'

export class ServerReply {
    status: boolean
    message: string
    statusType?: 'error' | 'info' | 'success' | 'warning'
    data?: any
    operations: Operation[]
    constructor(status:boolean, data?:any) {
        this.status = status
        this.message = status ? 'success' : 'an error occurred'
        this.statusType = status ? 'success' : 'error'
        this.data = data
        this.operations = []
    }

    addOperation(op:Operation) {
        this.operations.push(op)
    }

    static fromOperation(op:Operation) : ServerReply {
        const r = new ServerReply(!op.isError)
        r.message = op.message
        r.data = op.data
        return r
    }
}

export const info = (message:string) => {
    const r = new ServerReply(true)
    r.statusType = 'info'
    r.message = message
    return r
}
export const success = (message:string, data?: any) => {
    const r = new ServerReply(true,data)
    r.statusType = 'success'
    r.message = message
    return r
}
export const warning = (message:string) => {
    const r = new ServerReply(false)
    r.message = message
    r.statusType = 'warning'
    return r
}
export const error = (message:string) => {
    const r = new ServerReply(false)
    r.message = message
    r.statusType = 'error'
    return r
}
