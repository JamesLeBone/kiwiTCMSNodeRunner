'use server'
import { cookies } from 'next/headers.js'

export async function get(name: string): Promise<string | null> {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(name)
    return cookie ? cookie.value : null
}
export async function set(name:string,value:string|number) {
    const cookieStore = await cookies()
    if (typeof value === 'number') value = value.toString()
    cookieStore.set(name, value)
}
export async function del(name:string) {
    const cookieStore = await cookies()
    cookieStore.delete(name)
}