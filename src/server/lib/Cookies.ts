'use server'
import { cookies } from 'next/headers.js'

const get = async (name: string): Promise<string | null> => {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(name)
    return cookie ? cookie.value : null
}
const set = async (name:string,value:string|number) => {
    const cookieStore = await cookies()
    if (typeof value === 'number') value = value.toString()
    cookieStore.set(name, value)
}
const del = async (name:string) => {
    const cookieStore = await cookies()
    cookieStore.delete(name)
}

export {
    get,
    set,
    del
}