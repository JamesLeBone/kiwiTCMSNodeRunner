/**
 * SQLite3 database interface for Node.js using the built-in sqlite module.
 * Requires Node.js v22 or later.
 */
import { transform } from './functions'
import * as DBCommon from './DBCommon'

// Included in node v22
import {DatabaseSync, SQLInputValue} from 'node:sqlite';
const db = new DatabaseSync('db.sqlite3')

const errorHeader = 'Database.node.sqlite error:'

// Type for SQL parameters - can be array, object, or null/undefined
type SQLParams = SQLInputValue[] | Record<string, SQLInputValue> | null | undefined

const dbQueryAll = async (sql:string, params: SQLParams = [], fallbackValue:any) => {
    sql = sql.replaceAll(/NOW\(\)/g, 'CURRENT_TIMESTAMP')

    let resultSet = []
    try {
        const statementSync = db.prepare(sql)
        // https://nodejs.org/api/sqlite.html#statementallnamedparameters-anonymousparameters
        if (Array.isArray(params) && params.length > 0) {
            resultSet = statementSync.all(...params)
        } else if (params && typeof params === 'object' && !Array.isArray(params) && Object.keys(params).length > 0) {
            resultSet = statementSync.all(params)
        } else {
            resultSet = statementSync.all()
        }
    } catch (error) {
        console.error(errorHeader, {sql, params}, error)
        return fallbackValue || []
    }

    if (!resultSet) return fallbackValue || []

    return resultSet.map(row => transform.camelKeys(row))
}

async function run(sql:string, params: SQLParams = null) {
    params = params || []
    sql = sql.replaceAll(/NOW\(\)/g, 'CURRENT_TIMESTAMP')

    try {
        const rows = await dbQueryAll(sql, params, [])
        if (!rows) {
            return false
        }
        if (!Array.isArray(rows)) {
            console.warn(
                'Expected array result from run query',
                typeof rows, rows
            )
            return true
        }
        return rows.map(row => transform.camelKeys(row))
    } catch (error) {
        console.error(errorHeader, {sql, params} , error)
        return false
    }
}

let isDatabaseReady : null | boolean = null
async function check() {
    if (isDatabaseReady != null) return isDatabaseReady
    let rows:number = 0
    try {
        const st = db.prepare(`SELECT count(*) as c FROM credential_types`)
        const row = st.get()
        
        if (row && row.c) {
            rows = row.c as number
        }
    } catch (error) {
        isDatabaseReady = false
        return false
    }
    
    isDatabaseReady = rows > 0
    return isDatabaseReady
}

const insert = async (table:string, params:Array<Object>) => {
    const { columns, values } = DBCommon.createSqlParams(params)
    const sql = `INSERT INTO ${table} (${columns})
    VALUES ${values}
    RETURNING *`

    return dbQueryAll(sql, null, [])
}

/**
 * Fetches rows from the database using the provided SQL query and parameters.
*/
const fetch = (sql:string, params: SQLParams = []) => dbQueryAll(sql, params, [])
const fetchOne = async (sql:string, params: SQLParams = []) => {
    const result = await dbQueryAll(sql, params, null)
    if (result === null) return null
    
    if (!result || result.length === 0) return null
    if (result.length != 1) return null
    return result[0]
}

class Transaction {
    #error = false
    #state = 0
    constructor() {}

    begin() {
        if (this.#state > 0) {
            console.warn('Transaction already started')
            return Promise.resolve(false)
        }
        this.#state = 1
        db.exec('BEGIN')
        return Promise.resolve(true)
    }
    close() {
        if ([0,2].indexOf(this.#state) !== -1) {
            return Promise.resolve(true)
        }
        if (this.#state == 0) {
            console.warn('Transaction not started')
            return Promise.resolve(false)
        }
        this.#state = 2
        if (this.#error) {
            db.exec('ROLLBACK')
        } else {
            db.exec('COMMIT')
        }
        return Promise.resolve(null)
    }
    cancel() {
        if ([0,2].indexOf(this.#state) !== -1) {
            return Promise.resolve(true)
        }
        this.#state = 2
        db.exec('ROLLBACK')
        return Promise.resolve(true)
    }
    setError() { this.#error = true; }
    get isError() { return this.#error ? true : false; }
    get status() {
        if (this.#state == 0) return 'not started'
        if (this.#state == 1) return 'in progress'
        if (this.#state == 2) return this.#error ? 'error' : 'committed'
        return 'invalid state'
    }
}

export const dbi = {
    check,
    methods: {
        fetch,
        fetchOne,
        run,
        insert,
        dates: DBCommon.dates,
        Transaction
    }
}
