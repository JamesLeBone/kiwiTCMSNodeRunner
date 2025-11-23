
import { headers } from 'next/headers.js'

export class SessionFingerprint {
    host: string
    ua: string
    uaSignature: string
    userIp: string

    constructor(host:string, ua:string, userIp:string) {
        this.host = host
        this.ua = ua
        this.userIp = userIp
        this.uaSignature = SessionFingerprint.compressUa(ua)
    }

    private static compressUa(ua:string) : string {
        // User-Agent: Mozilla/5.0 (<system-information>) <platform> (<platform-details>) <extensions>
        const uad = ua.match(/(?<product>.+) \((?<system>[^)]+)\) (?<platform>\w+)/)
        if (!uad || uad.length < 4) return ua
        // ignore platform verions etc for fingerprinting
        return [uad[1],uad[2],uad[3]].join(' ').replaceAll(/[^a-z]/ig, '')
    }

    static async fromHeaders() {
        const headersList = await headers()
        const host = headersList.get('host')
        const ua = headersList.get('user-agent')
        const userIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip')
        return new SessionFingerprint(host || '', ua || '', userIp || '')
    }

    equals(other: SessionFingerprint) : boolean {
        return this.toString() === other.toString()
    }

    toString() : string {
        return JSON.stringify({
            host: this.host,
            ua: this.uaSignature,
            userIp: this.userIp
        })
    }

    static parseStringified(str:string) : SessionFingerprint|null {
        try {
            const obj = JSON.parse(str)
            return new SessionFingerprint(obj.host, obj.ua, obj.userIp)
        } catch (e) {
            console.error('Error parsing SessionFingerprint string:', e)
        }
        return null
    }
}
