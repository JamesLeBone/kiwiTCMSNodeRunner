'use server'
import { db } from '../db/Database'
import { getUser, getUserByUsername } from './Users'
import { SessionFingerprint } from './SessionFingerprint'

const genuuid = () => require('uuid').v4()
export type dbSession = {
    id: number,
    userId: number,
    sessionTypeId: Record<string,any>,
    createdAt: Date,
    expiresAt: Date
}

class DbSession {
    #expiresAt : Date|null = null
    id:number|null = null
    sessionTypeId: SessionFingerprint|null = null
    userId:number|null = null
    createdAt:Date|null = null

    static readDbRecord(record: Object): DbSession|null {
        if (!record) {
            console.warn('No record found')
            return null
        }
        const dbSession = new DbSession()
        for (let [k,v] of Object.entries(record)) {
            if (k == 'sessionTypeId') {
                try {
                    v = JSON.parse(v)
                    const sf = new SessionFingerprint(v.host, v.ua, v.userIp)
                    dbSession.sessionTypeId = sf
                } catch (e) {
                    console.error('Error parsing sessionTypeId:', e)
                    v = null
                }
                continue;
            }
            if (k == 'expiresAt' || k == 'createdAt') {
                dbSession[k] = new Date(Number.parseInt(v))
                continue;
            }
            if (k == 'id' || k == 'userId') {
                v = Number(v)
                dbSession[k] = v
            }
        }
        return dbSession
    }

    toSimpleObject() {
        if (this.id == null || this.userId == null || this.sessionTypeId == null || this.createdAt == null || this.expiresAt == null) {
            throw new Error('Do not return incomplete session object')
        }
        return {
            id: this.id,
            userId: this.userId,
            sessionTypeId: this.sessionTypeId,
            createdAt: this.createdAt,
            expiresAt: this.expiresAt
        } as dbSession
    }

    get expired() {
        if (!(this.#expiresAt instanceof Date)) return true
        return this.#expiresAt < new Date()
    }
    static newExpiry() {
        return new Date(new Date().getTime() + 1000*60*60*24*7)
    }
    renewExpiry() {
        if (this.id == null) return
        this.#expiresAt = DbSession.newExpiry()
        return db.update('sessions',this.id, {expiresAt: this.expiresAt})
    }

    /**
     * Creates a new session in the database.
     */
    static async create(userId:Number,secret:string) {
        const expiresAt = this.newExpiry()

        const sessionTypeId = await SessionFingerprint.fromHeaders()

        const insertData = {
            userId,
            expiresAt,
            createdAt: new Date(),
            secret,
            sessionTypeId: sessionTypeId.toString()
        }
        const result = await db.insert('sessions', insertData)
        if (result) {
            const newSession = {...insertData, id: result[0].id}
            return newSession
        }
        return false
    }

    static async getBySecret(secret:string) {
        if (typeof secret != 'string' || secret.length < 10) {
            throw new Error('Invalid session secret')
        }
        const record = await db.get('sessions', secret, 'secret')
        if (!record) return null
        return this.readDbRecord(record)
    }

    static async getById(sessionId:string) {
        const record = await db.get('sessions', sessionId)
        if (!record) return null
        return this.readDbRecord(record)
    }

    get expiresAt() { return this.#expiresAt }

    set expiresAt(expiresAt) {
        if (expiresAt instanceof Date) {
            this.#expiresAt = expiresAt
            return
        }
        if (expiresAt == null) {
            this.#expiresAt = null
            return
        }
        const expiry = parseInt(expiresAt)
        if (Number.isNaN(expiry)) {
            throw new Error('Invalid number type for expiresAt, must be an integer')
        }
        const read = db.dates.fromSql(expiry)
        if (read == null) {
            throw new Error('Invalid SQL date value for expiresAt')
        }
        if (Number.isNaN(read.getTime())) {
            throw new Error('Invalid SQL date string for expiresAt')
        }
        this.#expiresAt = read
        return
    }
}

const createSession = (userId:Number) => {
    const secret = genuuid()
    return DbSession.create(userId, secret)
}

type SessionVerification = {
    status: boolean,
    message: string,
    data?: VerifiedSessionData
}
type VerifiedSessionData = {
    user: any,
    sessionId: number|null
}

const verify = async (secret:string):Promise<SessionVerification> => {
    // console.info('Verifying session:', secret, sessionTypeId)
    const session = await DbSession.getBySecret(secret)
    if (!session) return {status: false, message: 'Session not found'}
    if (session.expired || session.sessionTypeId == null || session.userId == null) {
        return {status: false, message: 'Session expired'}
    }

    const currentFingerprint = await SessionFingerprint.fromHeaders()

    // Session type id is {host,ua,userIp} and serves as CSRF protection / fingerprinting
    if (!currentFingerprint.equals(session.sessionTypeId)) {
        if (session.id) {
            db.run('DELETE FROM sessions WHERE id = ?', [session.id])
        }
        console.info('lib/sessions', 'Session fingerprint mismatch', {expected: session.sessionTypeId, got: currentFingerprint.toString()})
        return {status: false, message: 'Session fingerprint mismatch'}
    }

    await session.renewExpiry()

    const user = await getUser(session.userId)
    if (!user) {
        return {status: false, message: 'User not found'}
    }

    const sessionData: VerifiedSessionData = {
        user,
        sessionId: session.id,
    }

    return {status: true, message: 'Session verified', data: sessionData}
}

const clear = async (username:string,sessionId:number|null) => {
    const user = await getUserByUsername(username)
    if (!user) {
        console.error('User not found:', username)
        return false
    }
    let sql = `
        DELETE FROM sessions
        WHERE user_id = ?
    `
    const where = [user.userId]

    if (sessionId != null) {
        sql += ' AND id = ?'
        where.push(sessionId)
    }

    try {
        const result = await db.run(sql, where)
        console.debug('Sessions cleared:', result)
        return true
    } catch (err) {
        console.error('Error clearing sessions:', err)
        return false
    }
}

const list = async (userId:number) : Promise<DbSession[]> => {
    const list = await db.fetch(`Select * FROM SESSIONS WHERE USER_ID = ?`, [userId])
    // console.debug('Session list for user', userId, ':', list)
    const sessionList = list.map((r:Object) => {
        const s = DbSession.readDbRecord(r)! // we know r is an object from db
        return s
    })
    return sessionList
}

const deactivate = async (userId:number, sessionId:number) => {
    const session = await db.fetchOne('SELECT * FROM sessions WHERE id = ? and user_id = ?', [sessionId, userId])
    if (!session) return false
    const update = await db.update('sessions', sessionId, {expiresAt: new Date()})
    return update ? true : false
}

export {
    createSession,
    verify,
    clear,
    list,
    deactivate
}
