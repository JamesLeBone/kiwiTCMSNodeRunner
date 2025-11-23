
export class Operation {
    id:string
    status:string
    message:string
    data:any
    constructor(id:string, status:string='info', message:string='Result not determined', data:any=null) {
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

    toJSON() {
        return {
            id: this.id,
            status: this.status,
            message: this.message,
            data: this.data
        }
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
