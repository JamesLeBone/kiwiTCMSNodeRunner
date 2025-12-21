
import { transform } from './functions'
import * as DBCommon from './DBCommon'
import type {convertableValue,inputValue,dataSetRow,dataSetRowConvertible,queryParams} from './DBCommon'

// import * as dbc from './Database.sqlite3' // if running on older Node.js versions
import {dbi} from './Database.nodeSqlite'

export async function check() : Promise<boolean> {
    return dbi.check()
}

const getSqliteValue = (value:convertableValue) : inputValue => {
    if (value instanceof Date) {
        return DBCommon.dates.toSql(value)
    }
    if (value && typeof value === 'object') {
        return JSON.stringify(value)
    }
    return value as inputValue
}

const getDataSetRow = (row:dataSetRowConvertible) : dataSetRow => {
    const result:dataSetRow = {}
    for (const [k,v] of Object.entries(row)) {
        const snakeKey = transform.snakeKey(k)
        result[snakeKey] = getSqliteValue(v)
    }
    return result
}

const methods = {
    get: async (table:string, id:string|number, key='id') => {
        const sql = `SELECT * FROM ${table} WHERE ${key} = ?`;
        const params = [id]
        return dbi.methods.fetchOne(sql, params)
    },
    getAll: async (table:string) => {
        const sql = `SELECT * FROM ${table}`;
        return dbi.methods.fetch(sql)
    },
    update: async (table:string, id:string|number, data:dataSetRowConvertible, pk='id') => {
        const dataRow = getDataSetRow(data)

        const values = Object.keys(dataRow).map(k => `"${k}"`)
        const setClause = values.map(k => `${k} = ?`).join(', ')
        const sql = `UPDATE ${table} SET ${setClause} WHERE ${pk} = ? RETURNING *`;

        const params = [...Object.values(dataRow),id]

        return dbi.methods.fetchOne(sql, params)
    },
    fetchProps: (table:string, fields:string[], props:dataSetRowConvertible={}) => {
        const nProps = Object.keys(props).length
        const queryValues = nProps > 0 ? getDataSetRow(props) : {}

        let sql = 'SELECT ' + fields.map(k => `"${transform.snakeKey(k)}"`).join(', ')
            +`\nFROM ${table}`
        if (nProps > 0) {
            sql += `\nWHERE ${Object.keys(props).map(k => `"${transform.snakeKey(k)}" = ?`).join(' AND ')}`
        }
        return dbi.methods.fetch(sql, queryValues)
    },
    insert: async (table:string, data:dataSetRowConvertible) => {
        const params = getDataSetRow(data)
        const keys = Object.keys(params)
        
        const sql = `INSERT INTO ${table} (${keys.map(k => `"${k}"`).join(', ')}) 
            VALUES (${Object.keys(params).map(k => '?').join(', ')})
            RETURNING *`;
        return dbi.methods.fetch(sql, Object.values(params))
    },
    upsert: async (table:string, idFieldName:string, data:dataSetRowConvertible, keyValues=[]) => {
        const keyDataValues: dataSetRowConvertible = {}
        for (const k of keyValues) {
            keyDataValues[k] = data[k]
        }
        const exists = await methods.fetchProps(table, keyValues, keyDataValues)
        if (exists.length == 0) {
            return methods.insert(table, data)
        }
        const id = exists[0][idFieldName]
        return methods.update(table, id, data, transform.snakeKey(idFieldName))
    }
}

export const db = {
    ...dbi.methods,
    ...methods
}

