'use server'
import * as Sessions from './lib/Sessions'
import { currentUser } from './lib/Auth'

export declare type SessionList = {
    list: SessionDetail[]
    currentSessionId: string | null
}
export declare type SessionDetail = {
    id: number
    host?: string | null,
    ua?: string | null,
    userIp?: string | null,
    expiresAt?: string | null,
    createdAt?: string | null
}

const list = async (): Promise<SessionList> => {
    const user = await currentUser()
    if (!user) return {
        list: [],
        currentSessionId: null
    }

    const {userId,sessionId} = user
    const list = await Sessions.list(userId)
    .then (l => l.map(s => {
        const rawFingerprint = s.sessionTypeId
        
        return {
            id: s.id,
            host: rawFingerprint ? rawFingerprint.host : null,
            ua: rawFingerprint ? rawFingerprint.ua : null,
            userIp: rawFingerprint ? rawFingerprint.userIp : null,
            expiresAt: s.expiresAt ? s.expiresAt.toString() : null,
            createdAt: s.createdAt ? s.createdAt.toString() : null
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
