/**
 * Bridge between server and client messages
 * Used to send structured messages from server to client
 * 
 * As we cannot return complex class instances via JSON,
 * we define a simple interface ServerMessage that can be serialized with toSimpleObject()
 * 
 * So you will have a single message success/fail/etc... for the primary operation,
 * but can also list results for bulk operations in the operations array.
 * @see Operation
 */
import { Operation, statusType } from './Operation'

export interface ServerMessage {
    status: boolean
    message: string
    statusType?: statusType
    data?: any
    operations?: Operation[]
}
export type serverMessagePromise = Promise<ServerMessage>

export class ServerReply {
    status: boolean
    message: string
    statusType?: statusType
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

    /**
     * For reconstructing from a simple object received from the frontend
     */
    static fromSimpleObject(obj:ServerMessage) : ServerReply {
        const r = new ServerReply(obj.status, obj.data)
        r.message = obj.message
        r.statusType = obj.statusType
        if (obj.operations) {
            r.operations = obj.operations.map(o => {
                const op = new Operation(o.id,o.status,o.message,o.data)
                return op
            })
        }
        return r
    }

    /**
     * For sending to the frontend as a simple object
     */
    static fromOperation(op:Operation) : ServerMessage {
        const r = new ServerReply(!op.isError)
        r.message = op.message
        r.data = op.data
        return r.toSimpleObject()
    }

    toSimpleObject() : ServerMessage {
        return {
            status: this.status,
            message: this.message,
            statusType: this.statusType,
            data: this.data,
            operations: this.operations.map(op => op.toSimpleObject())
        } as ServerMessage
    }
}

export const info = (message:string) : ServerMessage => {
    const r = new ServerReply(true)
    r.statusType = 'info'
    r.message = message
    return r.toSimpleObject()
}
export const success = (message:string, data?: any) : ServerMessage => {
    const r = new ServerReply(true,data)
    r.statusType = 'success'
    r.message = message
    return r.toSimpleObject()
}
export const warning = (message:string) : ServerMessage => {
    const r = new ServerReply(false)
    r.message = message
    r.statusType = 'warning'
    return r.toSimpleObject()
}
export const error = (message:string) : ServerMessage => {
    const r = new ServerReply(false)
    r.message = message
    r.statusType = 'error'
    return r.toSimpleObject()
}
