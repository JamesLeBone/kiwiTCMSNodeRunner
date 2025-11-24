
export declare type statusType = 'error' | 'info' | 'success' | 'warning'

export interface OperationResult {
    id: string
    status: statusType
    message: string
    data?: any
}
export type OperationResultPromise = Promise<OperationResult>

export class Operation {
    id:string
    status:statusType
    message:string
    data:any
    constructor(id:string, status:statusType='info', message:string='Result not determined', data:any=null) {
        this.id = id
        this.status = status
        this.message = message
        this.data = data
    }
    setError(message:string, data:any=null) {
        this.status = 'error'
        this.message = message
        this.data = data
        return this
    }
    setSuccess(message:string, data:any=null) {
        this.status = 'success'
        this.message = message
        this.data = data
        return this
    }
    setInfo(message:string, data:any=null) {
        this.status = 'info'
        this.message = message
        this.data = data
        return this
    }
    setWarning(message:string, data:any=null) {
        this.status = 'warning'
        this.message = message
        this.data = data
        return this
    }

    get isSuccess() {
        return this.status === 'success'
    }
    get isError() {
        return this.status === 'error'
    }

    toSimpleObject() : OperationResult {
        return {
            id: this.id,
            status: this.status,
            message: this.message,
            data: this.data
        } as OperationResult
    }
    static fromSimpleObject(obj:OperationResult) : Operation {
        const operation = new Operation(obj.id)
        operation.status = obj.status
        operation.message = obj.message
        operation.data = obj.data
        return operation
    }

    static get dbFailure() {
        return Operation.error('db-failure', 'Database interface failed')
    }

    static success(id:string, message:string, data:any=null) {
        return new Operation(id, 'success', message, data)
    }
    static error(id:string, message:string, data:any=null) {
        return new Operation(id, 'error', message, data)
    }
    static info(id:string, message:string, data:any=null) {
        return new Operation(id, 'info', message, data)
    }
    static warning(id:string, message:string, data:any=null) {
        return new Operation(id, 'warning', message, data)
    }

}
