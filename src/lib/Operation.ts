/**
 * This module defines the Operation class used to represent the result of an operation.
 * Operations have details on the result of an action performed by the server.
 * Operations can be serialized to simple objects for transmission over JSON.
 * 
 * Each operations should use a unique ID to identify it,
 * especially if bulk operations return simmilar results
 * and for testing purposes.
 */
export declare type statusType = 'error' | 'info' | 'success' | 'warning' | 'loading' | 'blank'

export interface Operation {
    id: string
    status: boolean
    message: string
    statusType?: statusType
}

export interface StatusOperation extends Operation {
    statusType: statusType
}

export interface OperationResult extends Operation {
    id: string
    data?: any
}
export interface TypedOperationResult<T> extends Operation {
    id: string
    data?: T
}

export interface ComplexResult extends Operation {
    data?: any
    operations: OperationResult[]
}
export interface TypedComplexResult<T> extends ComplexResult {
    data?: T
}

export const unauthorised = {
    id: 'unauthorised',
    status: false,
    message: 'You are not logged in'
} as Operation

export const updateOpError = (op: Operation, message: string) => {
    op.status = false
    op.message = message
    op.statusType = 'error'
    return op
}
export const updateOpSuccess = (op: Operation, message: string) => {
    op.status = true
    op.message = message
    op.statusType = 'success'
    return op
}
export const prepareStatus = (id: string) : StatusOperation => {
    return {
        id: id,
        status: false,
        message: 'Operation failed',
        statusType: 'error'
    } as StatusOperation
}
