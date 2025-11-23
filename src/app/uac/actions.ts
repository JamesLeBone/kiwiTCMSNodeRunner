'use server'
import { cookies } from 'next/headers.js'

export async function logout(): Promise<boolean> {
    const cs =await cookies()
    cs.delete('sessionId')
    return true
}
