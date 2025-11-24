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

declare type responseCookies = {[key:string]: HTTPCookie}
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
            let m = v.match(/(?<prop>\w*)=(?<value>.*)/)
            if (m == null || !m.groups) {
                console.warn('could not parse cookie value', v)
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

export declare type HTTPMethod = 'GET'|'POST'|'PUT'|'DELETE'|'PATCH'
export declare type HTTPProtocol = 'http'|'https'
export interface HTTPHostConfig {
    hostname: string
    protocol: HTTPProtocol
    port: number
}
export declare type headerType = {key:string, value:string}
export declare type headerSet = Map<string, string>|{[key:string]:string}
export declare type postData = string|headerSet
declare type cookieSet = {[key:string]: HTTPCookie}

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
        return raw
    }
    get cookieString() {
        const cookies = this.getCookies()
        const arr = []
        for (let cookie of Object.values(cookies)) {
            const hcookie = cookie as HTTPCookie
            arr.push(hcookie.toString())
        }
        return arr.join('; ')
    }

    #readCookies() : {[key:string]: HTTPCookie} {
        if (!this.cookieFile || !fs.existsSync(this.cookieFile)) return {} as {[key:string]: HTTPCookie}
        const arr = fs.readFileSync(this.cookieFile, 'utf-8')
        if (arr.length == 0) return {}
        let set = {} as {[key:string]: HTTPCookie}
        for (let cookie of arr) {
            const cookieObj = new HTTPCookie(cookie)
            set[cookieObj.name] = cookieObj
        }
        return set
    }
    storeCookies(cookies: responseCookies) {
        if (this.#cookiePath == null || !this.cookieFile) return
        const destination = this.#cookiePath
        if (!fs.existsSync(destination)) {
            return
        }
        const currentCookies = this.getCookies()
        for (let cookie of Object.values(cookies)) {
            // Update
            currentCookies[cookie.name] = cookie
        }
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
        if (cookies) requestHeaders.set('Cookie', cookies)
        
        return new Promise((resolve,reject) => {
            const options = {
                hostname: hostname,
                path: path,
                protocol: protocol+':',
                method: method,
                headers: Object.fromEntries(requestHeaders),
                port
                // rejectUnauthorized : false, // ignore https cert errors
            } as http.RequestOptions
            if (this.#ignoreCertErrors && protocol == 'https') {
                (options as any).insecureHTTPParser = true
                // options.rejectUnauthorized = false
            }
            
            const libMethod = protocols[protocol]
            let req;
            try {
                req = libMethod.request(options, res => {
                    const data = [] as Buffer[]
                    const response = new HTTPResponse(res)
                    this.#cookieStore.storeCookies(response.cookies)
        
                    res.on('data', d => { data.push(d) })
                    res.on('error', error => { reject(error) })
                    res.on('end', () => {
                        response.body = (Buffer.concat(data)).toString()
                        resolve(response)
                    })
                })

                // Critical: Handle request-level errors (connection failures, ENOTFOUND, etc.)
                req.on('error', error => {
                    console.error('HTTP Request Error:', error.message)
                    reject(error)
                })

            } catch (e) {
                console.error('Failed to make request', e)
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

