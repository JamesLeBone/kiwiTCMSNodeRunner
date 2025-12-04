
import { transform } from './functions'

const dates = {
    toSql: (dt: Date) : number => dt.getTime(),
    fromSql: (dts: string|number) : Date | null => {
        if (dts == null || dts == '') return null
        if (typeof dts == 'number')
            return new Date(dts)
        // toSql will store it witha a .0 suffix?
        return new Date(Number.parseInt(dts))
    }
}
/**
 * Creates SQL parameters for a bulk insert operation.
 * Key names must match per entry
 * @param params example [{userId, date, notes}, {...}, ...]
 */
const createSqlParams = (params: {[key: string]: any}[]): { columns: string, values: string } => {
    const values = []

    const keySig = JSON.stringify(Object.keys(params[0]))
    const sqlParams = Object.keys(params[0]).map(k => `"${transform.snakeKey(k)}"`)
    for (const row of params) {
        const rowKeySig = JSON.stringify(Object.keys(row))
        if (rowKeySig !== keySig) {
            throw new Error('All rows must have the same keys for bulk insert')
        }
        values.push(...Object.values(row))
    }
    const valuesClause = params.map(() => `(${sqlParams.map(() => '?').join(', ')})`).join(', ')
    return {
        columns: sqlParams.join(', '),
        values: valuesClause
    }
}

declare type inputValue = string|number|null
declare type dataSetRow = { [key: string]: inputValue }
declare type convertableValue = string|number|Date|null|object
declare type dataSetRowConvertible = { [key: string]: convertableValue }
declare type queryParams = dataSetRowConvertible[]

export { 
    createSqlParams,
    dates
}
export type {
    inputValue,
    dataSetRow,
    convertableValue,
    dataSetRowConvertible,
    queryParams
}