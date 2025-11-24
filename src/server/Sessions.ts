'use server'
import * as Sessions from './lib/Sessions'
import { currentUser } from './lib/Auth'

const list = async () => {
    const user = await currentUser()
    if (!user) return {
        list: [],
        currentSessionId: null
    }

    const {userId,sessionId} = user
    const list = await Sessions.list(userId)
    .then (l => l.map(s => s.toSimpleObject()))

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
