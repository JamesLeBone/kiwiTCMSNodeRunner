import mariadb from 'mariadb'

export declare type MariaDbConfig = {
    host: string
    database: string
    user: string
    password: string
    port?: number
}

export async function verify(config: MariaDbConfig) : Promise<boolean> {
    const pool = mariadb.createPool(config)
    const conn = await pool.getConnection()
    .catch(err => {
        console.error('Error connecting to MariaDB:', err)
        return false
    })
    if (typeof conn == 'boolean') return false
    conn.end()
    pool.end()
    return true
}

type updatePacket = {
    affectedRows: number
    insertId: number
    warningStatus: number
}

export class SinglePoolConnection {
    private pool: mariadb.Pool
    private connection: mariadb.Connection
    private transactionActive: boolean = false

    static async init(config: MariaDbConfig) : Promise<SinglePoolConnection> {
        const pool = mariadb.createPool(config)
        const connection = await pool.getConnection()
        .catch(err => {
            throw err
        })

        return new Promise(resolve => {
            const instance = new SinglePoolConnection(pool,connection)
            connection.beginTransaction()
            resolve(instance)
        })
    }
    private constructor(pool: mariadb.Pool, connection: mariadb.Connection) {
        this.pool = pool
        this.connection = connection
        this.transactionActive = true
    }

    public get isTransactionActive() : boolean {
        return this.transactionActive
    }

    public async query(sql: string, params?: any[]) : Promise<updatePacket | any[] | null> {
        if (!this.transactionActive) return null

        const result = await this.connection.query(sql, params)
        .catch(err => {
            console.error('Error executing query:', err)
            return null
        })
        if (result === null || result.warningStatus && result.warningStatus > 0) {
            await this.connection.rollback()
            this.connection.end()
            this.pool.end()
            this.transactionActive = false
            return null
        }

        if (typeof result.affectedRows == 'number') {
            return result as updatePacket
        }
        return result as any[]
    }

    public async selection(sql: string, params?: any[]) : Promise<any[] | null> {
        if (!this.transactionActive) return null
        const result = await this.connection.query(sql, params)
        .catch(err => {
            console.error('Error executing selection:', err)
            return null
        })
        if (result === null || !Array.isArray(result)) {
            console.error('Selection did not return an array', result)
            await this.connection.rollback()
            this.connection.end()
            this.pool.end()
            this.transactionActive = false
            return null
        }
        return result as any[]
    }

    public async update(sql: string, params?: any[]) : Promise<updatePacket | null> {
        if (!this.transactionActive) return null
        const result = await this.connection.query(sql, params)
        .catch(err => {
            console.error('Error executing update:', err)
            return null
        })
        if (result === null || typeof result.affectedRows != 'number') {
            console.error('Update did not return affectedRows', result)
            await this.connection.rollback()
            this.connection.end()
            this.pool.end()
            this.transactionActive = false
            return null
        }
        return result as updatePacket
    }

    public async end() {
        if (!this.transactionActive) return
        this.transactionActive = false
        await this.connection.commit()
        await this.connection.end()
        await this.pool.end()
    }
}

