'use server'
import * as Sessions from './lib/Sessions'
import {getCurrentUser} from './lib/Auth'

const list = async () => {
    const user = await getCurrentUser()
    if (!user) return {
        list: [],
        currentSessionId: null
    }

    const {userId,sessionId} = user
    console.debug(sessionId)
    return {
        list: await Sessions.list(userId),
        currentSessionId: sessionId
    }
}
const deactivate = async (id:number) => {
    const user = await getCurrentUser()
    if (!user) return false

    const {userId} = user
    return Sessions.deactivate(userId, id)
}

export {
    list,
    deactivate
}
