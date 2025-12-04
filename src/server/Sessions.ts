'use server'
import * as Sessions from './lib/Sessions'
import { currentUser } from './lib/Auth'

export declare type SessionList = {
    list: SessionDetail[]
    currentSessionId?: number
}
export declare type SessionDetail = {
    id: number
    host?: string
    ua?: string
    userIp?: string
    expiresAt?: string
    createdAt?: string
}

const list = async (): Promise<SessionList> => {
    const user = await currentUser()
    if (!user) return {list: []}

    const {userId,sessionId} = user
    const list = await Sessions.list(userId)
    .then (l => l.map(s => {
        const rawFingerprint = s.sessionTypeId
        
        return {
            id: s.id,
            host: rawFingerprint ? rawFingerprint.host : undefined,
            ua: rawFingerprint ? rawFingerprint.ua : undefined,
            userIp: rawFingerprint ? rawFingerprint.userIp : undefined,
            expiresAt: s.expiresAt ? s.expiresAt.toISOString() : undefined,
            createdAt: s.createdAt ? s.createdAt.toISOString() : undefined
        } as SessionDetail
    }))

    return {
        list: list,
        currentSessionId: sessionId
    }
}
const deactivate = async (id:number) => {
    const user = await currentUser()
    if (!user) return false

    const {userId} = user
    return Sessions.deactivate(userId, id)
}

export {
    list,
    deactivate
}
