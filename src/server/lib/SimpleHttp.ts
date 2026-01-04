/**
 * HTTP call wrapper
 * 
 * This class is a wrapper/handler around http requests with cookie handling.
 * 
 * @author jamesxbone@gmail.com
 * @version 1.2
 * 
 */

import http from 'http'
import https from 'https'
import fs from 'fs'

const protocols = {
    'http' : http,
    'https' : https
}

type responseCookies = {[key:string]: HTTPCookie}
export class HTTPResponse {
    cookies: responseCookies
    statusCode: number
    statusMessage: string
    headers: {[key:string]: string}
    body: string
    
    constructor(res : http.IncomingMessage) {
        this.statusCode = res.statusCode || 0
        this.statusMessage = res.statusMessage || ''
        this.headers = res.headers as {[key:string]: string}
        this.cookies = {}
        this.body = ''
        
        if (typeof this.headers['set-cookie'] != 'undefined') {
            const responseCookies = res.headers['set-cookie']
            if (typeof responseCookies != 'undefined') {
                for (let cookie of responseCookies) {
                    const hcookie = new HTTPCookie(cookie)
                    if (hcookie.isValid) {
                        this.cookies[hcookie.name] = hcookie
                    }
                }
            }
        }
    }
    get isError() {
        return (this.statusCode+'')[0] != '2'
    }
    get isJson() {
        const contentType = this.headers['content-type']
        if (contentType.indexOf('application/json') == -1) return false
        return true
    }
    get json() {
        if (!this.isJson) {
            return null
        }
        return JSON.parse(this.body)
    }
}

class HTTPCookie {
    name:string
    value:string
    
    properties: {[key:string]: any} = {}
    
    rawString:string
    
    /**
     * @throws Error if cookie string cannot be parsed
     */
    constructor(stringIn:string) {
        this.rawString = stringIn
        let match = stringIn.match(/^(?<name>\w*)=(?<value>.*?);(?<rest>.*)$/)
        if (match == null || !match.groups) {
            throw new Error('Could not parse cookie string: '+stringIn)
        }
        this.name = match.groups.name
        this.value = match.groups.value
        this.properties = {}
        
        for (let v of match.groups.rest.split(/; ?/)) {
            v = v.trim()
            if (v == 'HttpOnly') {
                this.properties.httpOnly = true
                continue
            }
            if (v == 'Secure') {
                this.properties.secure = true
                continue
            }

            let m = v.match(/(?<prop>\w*)=(?<value>.*)/)
            if (m == null || !m.groups) {
                console.warn('could not parse cookie value', v, stringIn)
                continue
            }
            const propName = m.groups.prop
            const value = propName == 'expires' ? new Date(m.groups.value) : m.groups.value
            this.properties[propName] = value
        }
    }
    toString() { return this.rawString }
    get isValid() {
        if (typeof this.name == 'undefined') return false
        if (typeof this.properties.expires == 'undefined') return true
        const expiry = new Date(this.properties.expires)
        const now = new Date()
        return expiry > now
    }
}

export type HTTPMethod = 'GET'|'POST'|'PUT'|'DELETE'|'PATCH'
export type HTTPProtocol = 'http'|'https'
export interface HTTPHostConfig {
    hostname: string
    protocol: HTTPProtocol
    port: number
}
export type headerType = {key:string, value:string}
export type headerSet = Map<string, string>|{[key:string]:string}
export type postData = string|headerSet
type cookieSet = {[key:string]: HTTPCookie}

class CookieStore {
    #cookiePath: string|null = null
    #cachedCookies: cookieSet
    
    constructor(cookiePath?:string) {
        this.#cachedCookies = {}
        if (typeof cookiePath == 'undefined' || !fs.existsSync(cookiePath)) {
            return
        }
        
        this.#cookiePath = cookiePath
    }

    get cookieFile() {
        if (this.#cookiePath == null) return null
        return this.#cookiePath+'/cookies.json'
    }
    
    clearSession() {
        if (this.#cookiePath == null) {
            this.#cachedCookies = {}
            return
        }
        const filename = this.cookieFile
        if (!filename ||!fs.existsSync(filename)) return
        fs.rmSync(this.cookieFile)
    }
    getCookies() {
        if (Object.keys(this.#cachedCookies).length > 0) return this.#cachedCookies
        const raw = this.#readCookies()
        this.#cachedCookies = raw
        return raw
    }
    get cookieString() {
        const cookies = this.getCookies()
        const arr = []
        for (let cookie of Object.values(cookies)) {
            const hcookie = cookie as HTTPCookie
            arr.push(`${hcookie.name}=${hcookie.value}`)
        }
        return arr.join('; ')
    }

    #readCookies() : {[key:string]: HTTPCookie} {
        if (!this.cookieFile || !fs.existsSync(this.cookieFile)) return {} as {[key:string]: HTTPCookie}
        const fileContent = fs.readFileSync(this.cookieFile, 'utf-8')
        if (fileContent.length == 0) return {}
        
        let cookieStrings: string[]
        try {
            cookieStrings = JSON.parse(fileContent)
        } catch (e) {
            console.warn('Failed to parse cookie file, resetting cookies')
            return {}
        }
        
        let set = {} as {[key:string]: HTTPCookie}
        for (let cookieString of cookieStrings) {
            try {
                const cookieObj = new HTTPCookie(cookieString)
                set[cookieObj.name] = cookieObj
            } catch (e) {
                console.warn('Failed to parse cookie:', cookieString)
            }
        }
        return set
    }
    storeCookies(cookies: responseCookies) {
        // Store in memory cache
        for (let cookie of Object.values(cookies)) {
            this.#cachedCookies[cookie.name] = cookie
        }
        
        // Also persist to file if cookiePath is set
        if (this.#cookiePath == null || !this.cookieFile) return
        const destination = this.#cookiePath
        if (!fs.existsSync(destination)) {
            return
        }
        const currentCookies = this.getCookies()
        const cookieStrings = []
        for (let cookie of Object.values(currentCookies)) {
            cookieStrings.push(cookie.rawString)
        }
        
        const data = JSON.stringify(cookieStrings,null,4)
        return fs.writeFileSync(this.cookieFile, data)
    }
}

/**
 * HTTP handler class
 */
export class SimpleHttp {
    #defaultHeaders: Map<string,string> = new Map<string,string>()
    #hostConfig : HTTPHostConfig = {
        hostname: 'localhost',
        protocol: 'http',
        port: 80
    }
    #ignoreCertErrors = false
    #cookieStore = new CookieStore()
    #debugMode = false

    get config() { return this.#hostConfig }

    constructor(config: HTTPHostConfig) {
        this.#hostConfig = config
        this.#defaultHeaders.set('User-Agent', 'simpleHTTP/2.0')
        this.#defaultHeaders.set('Content-Type', 'application/json')
    }
    set cookiePath(cookiePath:string) { 
        this.#cookieStore = new CookieStore(cookiePath)
    }
    set header(header: headerType) {
        this.#defaultHeaders.set(header.key, header.value)
    }
    set ignoreCertErrors(ignore: boolean) {
        this.#ignoreCertErrors = ignore
    }

    getRequest(path:string, query?: Record<string, any>) {
        if (!query) return this.request(path,'GET')
        const queryString = new URLSearchParams(query as Record<string, string>).toString()
        path += '?'+queryString
        return this.request(path,'GET')
    }
    post(path:string, postData?:postData, headers?: headerSet) {
        return this.request(path, 'POST', postData, headers)
    }
    
    request(path:string, method: HTTPMethod, postData?:postData, headers?: headerSet): Promise<HTTPResponse> {
        const {hostname, protocol, port} = this.#hostConfig

        const requestHeaders = this.#defaultHeaders
        if (headers) {
            if (headers instanceof Map) {
                for (let [key, value] of headers.entries()) {
                    requestHeaders.set(key, value)
                }
            } else {
                for (let key of Object.keys(headers)) {
                    requestHeaders.set(key, headers[key])
                }
            }
        }

        let sendBody = ''
        if (method != 'GET' && typeof postData != 'undefined') {
            if (['PUT','POST'].indexOf(method) > -1 && typeof postData == 'undefined') {
                throw new Error('Content required for PUT and POST requests')
            }
            if (typeof postData == 'object') {
                sendBody = JSON.stringify(postData)
                requestHeaders.set('Content-Length', Buffer.byteLength(sendBody)+'')
            } else if (typeof postData == 'string') {
                sendBody = postData
                requestHeaders.set('Content-Length', Buffer.byteLength(postData)+'')
            }
        }

        const cookies = this.#cookieStore.cookieString
        if (cookies) {
            requestHeaders.set('Cookie', cookies)
            if (this.#debugMode)
                console.debug(`[SimpleHttp] Sending cookies: ${cookies}`)
        } else {
            if (this.#debugMode)
                console.debug(`[SimpleHttp] No cookies to send for ${method} ${path}`)
        }
        
        return new Promise((resolve,reject) => {
            const options: http.RequestOptions | https.RequestOptions = {
                hostname: hostname,
                path: path,
                protocol: protocol+':',
                method: method,
                headers: Object.fromEntries(requestHeaders),
                port
            }
            if (this.#ignoreCertErrors && protocol == 'https') {
                (options as https.RequestOptions).rejectUnauthorized = false
            }
            
            const libMethod = protocols[protocol]
            let req;
            try {
                req = libMethod.request(options, res => {
                    const data = [] as Buffer[]
                    const response = new HTTPResponse(res)
                    
                    if (this.#debugMode) {
                        console.debug(`[SimpleHttp] Response ${res.statusCode} from ${method} ${protocol}://${hostname}:${port}${path}`)
                        if (Object.keys(response.cookies).length > 0) {
                            console.debug(`[SimpleHttp] Received cookies:`, Object.keys(response.cookies))
                        }
                    }
                    
                    this.#cookieStore.storeCookies(response.cookies)
        
                    res.on('data', d => { data.push(d) })
                    res.on('error', error => { reject(error) })
                    res.on('end', () => {
                        response.body = (Buffer.concat(data)).toString()
                        
                        // Handle redirects (3xx status codes)
                        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                            const redirectUrl = res.headers.location
                            const url = new URL(redirectUrl)
                            
                            // Update host config for redirect
                            const newProtocol = url.protocol.replace(':', '') as HTTPProtocol
                            const newPort = url.port ? parseInt(url.port) : (newProtocol === 'https' ? 443 : 80)
                            
                            this.#hostConfig = {
                                hostname: url.hostname,
                                protocol: newProtocol,
                                port: newPort
                            }
                            
                            // Follow the redirect
                            this.request(url.pathname + url.search, method, postData, headers)
                                .then(resolve)
                                .catch(reject)
                            return
                        }
                        
                        resolve(response)
                    })
                })

                // Critical: Handle request-level errors (connection failures, ENOTFOUND, etc.)
                req.on('error', error => {
                    console.warn('HTTP Request Error:', error.message)
                    reject(error)
                })

            } catch (e) {
                console.warn('Failed to make request', e)
                reject(e)
                return
            }

            try {
                if (sendBody != '') req.write(sendBody)
            } catch (e) {
                console.error('Failed to write body', e)
                reject(e)
                return
            }
            
            try {
                req.end()
            } catch (e) {
                console.error('Failed to end request', e)
                reject(e)
            }
        })
    }

    sendContent(type:string,data:string,path:string,method:HTTPMethod = 'POST') {
        const headers = {
            'Content-Type': type,
            'Content-Length': Buffer.byteLength(data)+''
        }
        return this.request(path, method, data, headers)
    }
    
    commonRequest(method: HTTPMethod, path:string, postData?:postData, headers?:headerSet) {
        console.info('Deprecated: use request() method instead of commonRequest()')
        return this.request(path, method, postData, headers)
    }
}

export function remote(hostname:string, protocol: 'http'|'https', cookiePath=null, defaultHeaders?:headerSet) {
    const instance = new SimpleHttp({
        hostname, protocol, port: protocol == 'https' ? 443 : 80
    })
    if (cookiePath != null) instance.cookiePath = cookiePath
    if (defaultHeaders) {
        if (defaultHeaders instanceof Map) {
            for (let [key, value] of defaultHeaders.entries()) {
                instance.header = {key, value}
            }
        } else if (typeof defaultHeaders == 'object') {
            for (let [k,v] of Object.entries(defaultHeaders)) {
                instance.header = {key: k, value: v}
            }
        }
    }

    
    return instance
}

