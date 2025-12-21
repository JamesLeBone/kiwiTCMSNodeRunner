// Fetch is refusing to send the cookies
// have to use other request methods
// import { request } from 'http'
import { StatusOperation } from '@lib/Operation'
import { SimpleHttp } from '../lib/SimpleHttp'
import { 
    DjangoEntity,
    BasicRecord,
    checkDate,
    htmlEntityDecode
} from './Django'

// These are for caching the user cookies locally in the user's temp directory
import os from 'os'
import path from 'path'
import fs from 'fs'

import { getFirstCredentialOfType } from '@server/Credentials'
const kiwiCredentialTypeId = 1
declare type methodParameters = Object | Array<any> | null

declare interface RPCReply {
    jsonrpc: string, // float: "2.0"
    id: string,
    result?: any,
    error?: {
        code: number,
        message: string,
        data?: any // can be null.
    }
}
declare interface JsonRPCError extends RPCReply {
    error: {
        code: number,
        message: string,
        data?: any // can be null.
    }
}

const autoUnauthroised = (requestId: string) => {
    return {
        id : requestId,
        jsonrpc : '2.0',
        error : {
            code: -32001,
            message: 'Kiwi session has expired or is unauthorised. Please check your Kiwi credentials.',
            data: null
        }
    } as JsonRPCError
}

const queryListValues = (list: BasicRecord[]) : BasicRecord[] => {
    const entities = [] as BasicRecord[]
    for (let item of list as BasicRecord[]) {
        const dji = new DjangoEntity()
        dji.loadDjango(item, {autoDates:true})
        entities.push(dji.values)
    }
    return entities
}

// In your container:
// /venv/lib/python3.11/site-packages/tcms/
// see: tcms/rpc/api/

class KiwiCall {
    #loggedIn = false
    #kiwiHttp: SimpleHttp
    #currentUser: string | null = null
    
    constructor() {
        const kiwiProtocol = process.env.KIWI_PROTOCOL === 'https' ? 'https' : 'http'
        // Keep the HTTP connection in the instance to seperate sessions per user

        const kiwiHttp = new SimpleHttp({
            protocol: kiwiProtocol,
            hostname: process.env.KIWI_DOMAIN || 'localhost',
            port: process.env.KIWI_PORT ? parseInt(process.env.KIWI_PORT) : (kiwiProtocol === 'https' ? 443 : 80)
        })
        
        // Set up cookie persistence directory
        const cookiePath = path.join(os.tmpdir(), 'kiwitcms-session')
        if (!fs.existsSync(cookiePath)) {
            fs.mkdirSync(cookiePath, { recursive: true })
        }
        kiwiHttp.cookiePath = cookiePath
        
        kiwiHttp.ignoreCertErrors = process.env.KIWI_SSL_VERIFY === 'false' ? true : false
        // TOOD: pass locale through where available
        kiwiHttp.header = {key:'content-language',value:'en-AU'}
        this.#kiwiHttp = kiwiHttp
    }

    async logout() : Promise<void> {
        if (!this.#loggedIn) return
        try {
            const logout = await this.call('Auth.logout', undefined, 'logout')
            this.#loggedIn = false
            this.#currentUser = null
            console.debug('Kiwi logout', logout)
        } catch (error) {}
    }
    
    async login() : Promise<boolean> {
        const creds = await getFirstCredentialOfType(kiwiCredentialTypeId)
        if (!creds) {
            console.debug('No Kiwi credentials found')
            return false
        }
        let username:string, password:string
        
        try {
            const c = creds.credential
            if (!c.username || !c.password) return false
            username = c.username.value as string
            password = c.password.value as string
        } catch (e) {
            console.error('Kiwi credentials are malformed', e)
            return false
        }
        
        // If already logged in as the same user, just return true
        if (this.#loggedIn && this.#currentUser === username) {
            // console.debug('Already logged in as user:', username)
            return true
        }
        
        // If logged in as a different user, logout first
        if (this.#loggedIn) {
            await this.logout()
        }
        this.#loggedIn = false

        try {
            await this.call('Auth.login', {username, password}, 'login')
            this.#loggedIn = true
            this.#currentUser = username
            // console.debug('Kiwi login successful for user:', username)
            return true
        } catch (error) {
            this.#loggedIn = false
            this.#currentUser = null
            console.error('Kiwi login failed:', error)
            // Return false instead of throwing to allow graceful handling
            return false
        }
    }

    /**
     * @reject {JsonRPCError} JSON-RPC error response
     */
    call(methodName:string,params?: methodParameters, requestId?:string) : Promise<any> {
        const id = requestId == null ? methodName.toUpperCase() : requestId
        // We cannot send Map as it won't be serialized to JSON correctly
        // so we're using plain Object for params
        const sendData: Record<string, any> = {
            jsonrpc: '2.0',
            method: methodName,
            id: id
        }
        if (params != null) sendData.params = params
        console.log('[KiwiCall] Calling method:', methodName)

        // console.debug('Kiwi RPC Call:', {
        //     method: methodName,
        //     params: params,
        //     sendData
        // })
        
        return new Promise((resolve,reject) => {
            this.#kiwiHttp.post('/json-rpc/', sendData)
            .then(httpResponse => {
                if (!httpResponse.isJson) {
                    const headers = httpResponse.headers
                    console.warn('Kiwi returned non-JSON content', {
                        body: httpResponse.body,
                        headers: headers
                    })
                    const jprcPseudoError = {
                        jsonrpc: '2.0',
                        id: id,
                        error: {
                            code: -32000,
                            message: 'Kiwi returned non-JSON content: ' + httpResponse.body
                        }
                    } as JsonRPCError
                    reject(jprcPseudoError)
                    return
                }
                const content = httpResponse.json as RPCReply
                if (httpResponse.isError) {
                    if (typeof content.error == 'undefined') {
                        content.error = { code: 500, message: 'An error has occured' }
                    }
                    reject(content as JsonRPCError)
                    return
                }
                if (typeof content.error != 'undefined') {
                    reject(content as JsonRPCError)
                    return
                }
                resolve(content.result)
            })
            .catch(error => {
                // If it's already a JsonRPCError from the .then() block above, just re-throw it
                if (error.jsonrpc && error.error) {
                    reject(error)
                    return
                }

                // Handle network/connection errors from SimpleHttp
                console.warn('Kiwi connection error:', error.message || error)
                const config = this.#kiwiHttp.config

                const host = `${config.protocol}://${config.hostname}:${config.port}`
                const hostHelp = `If the host (${host}) is incorrect, please refer to your local .env file`
                const jprcPseudoError = {
                    jsonrpc: '2.0',
                    id: id,
                    error: {
                        code: -32000,
                        message: `Kiwi connection error: ${error.message || error}`
                    }
                } as JsonRPCError
                
                // Check for specific network errors
                if (error.code === 'ENOTFOUND') {
                    jprcPseudoError.error.message = `Kiwi server not found at ${host}. ${hostHelp}`
                } else if (error.code === 'ECONNREFUSED') {
                    jprcPseudoError.error.message = `Kiwi server refused connection. ${hostHelp}`
                } else if (error.code === 'ETIMEDOUT') {
                    jprcPseudoError.error.message = `Kiwi server connection timed out.`
                } else {
                    jprcPseudoError.error.message = `Kiwi connection failed: ${error.message || error}`
                }
                reject(jprcPseudoError)
            })
        })
    }

    /**
     * Make the call and parse the result as a DjangoEntity
     */
    async callDjango(methodName:string,params?:methodParameters) : Promise<DjangoEntity> {
        return this.call(methodName,params).then(response => new DjangoEntity(response))
    }

    async rawSearch(entity:string,query:Record<string, any>,ilike=true) : Promise<BasicRecord[]> {
        if (ilike) {
            const searchObj = {} as Record<string, string|number|Array<string|number>>
            for (let [k,v] of Object.entries(query)) {
                if (Array.isArray(v)) {
                    searchObj[k+'__in'] = v
                    continue
                }
                searchObj[k+'__icontains'] = v
            }
            query = searchObj
            // console.info('searching for',entity,query)
            // console.trace()
        }
        return this.call(entity+'.filter', {query:query})
    }
    
    async search(entity:string,query:Record<string, any>,ilike=true) : Promise<DjangoEntity[]> {
        let errorText = 'Search failed'
        const result = await this.rawSearch(entity,query,ilike)
        .then (res => res, err => {
            // console.debug('Search error', err)
            if (err.jsonrpc) {
                const error = err as JsonRPCError
                errorText = error.error.message
            }
            return false
        })
        // console.debug('Search result', result)

        if (!result) return Promise.reject({message: errorText})
        
        const entities = [] as DjangoEntity[]
        for (let item of result as BasicRecord[]) {
            const dji = new DjangoEntity()
            dji.loadDjango(item, {autoDates:true})
            entities.push(dji)
        }
        return entities
    }

    /**
     * Search for entities of type T
     * @param entity Entity name
     * @param query Query to serach for
     * @param ilike Whether to perform a case-insensitive search
     * @returns list of entities of type T
     */
    async searchEntity<T>(entity:string,query?:Record<string, any>,ilike=true) : Promise<T[]> {
        const djEntities = await this.search(entity, query ?? {}, ilike)
        if (djEntities.length === 0) return []
        const entities = djEntities.map( (dj) => dj.values as T )
        return entities
    }
    
    async get(entity:string,id:number,idName='id'): Promise<DjangoEntity> {
        console.info('Depreciated: KiwiCall.get(), use getEntity() instead')
        const query = {} as Record<string, number>
        query[idName] = id
        return this.call(entity+'.filter',{query:query}).then(list => new DjangoEntity(list[0]))
    }

    async getEntity<T>(entity:string,id:number,idName='id'): Promise<T | undefined> {
        const query: Record<string, number> = {
            [idName]: id
        }
        const list = await this.call(entity+'.filter',{query:query})
        if (!list || list.length === 0) return undefined;
        const dje = new DjangoEntity(list[0])
        return dje.values as T
    }

    async getList(entity:string,id:number, idName='id'): Promise<BasicRecord[]> {
        const query = {} as Record<string, number>
        query[idName] = id
        return this.call(entity+'.filter',{query:query})
            .then(list => queryListValues(list))
    }

    /**
     * Create something
     * e.g. http.create<Product>('Product', productProps)
     * where productProps is Partial<Product>
     * 
     * @throws {JsonRPCError} JSON-RPC error response
     */
    async create<T>(entityName:string, values:Partial<T>) : Promise<T> {
        const sess = await this.login()
        if (!sess) throw autoUnauthroised(entityName.toUpperCase() + '_CREATE')
        
        const djv = await this.callDjango(entityName+'.create', {
            values: values
        }) as T
        return djv
    }

    /**
     * Update something
     * @throws {JsonRPCError} JSON-RPC error response
     */
    async update(entity:string,id:number,idName:string,values:BasicRecord) : Promise<DjangoEntity> {
        const updateWith = {
            values: values
        } as Record<string, any>
        updateWith[idName] = id
        
        await this.login()
        const requestId = entity.toUpperCase() + '_UPDATE_' + id

        if (!this.#loggedIn) throw autoUnauthroised(requestId)

        return this.call(entity+'.update', updateWith, requestId)
        .then(item => {
            const dj = new DjangoEntity()
            dj.loadDjango(item, {autoDates:true})
            return dj
        })
    }
    
    /**
     * Get an entity by primary key or other key reference
     * @throws {JsonRPCError} JSON-RPC error response
     */
    async reference(entity:string,property:string,query:methodParameters) : Promise<DjangoEntity | DjangoEntity[]> {
        const methodName = entity+'.'+property // ie TestCase.comments
        const result = await this.call(methodName,query)
        if (Array.isArray(result)) {
            if (result.length === 0) return []
            return result.map((item: BasicRecord) => { return new DjangoEntity(item) })
        }
        return new DjangoEntity(result as BasicRecord)
    }
}
export const http = new KiwiCall()

export const methods = {
    djangoEntity: (entity: BasicRecord) => new DjangoEntity(entity),
    date: (value : null|string) => {
        if (value == null) return null
        return checkDate(value)
    },
    htmlDecode: htmlEntityDecode
}

export const promiseBoolean = (p:Promise<any>) => p.then(rv => true, rv => false).catch(reject => false)

export const unAuthenticated = {
    id: 'unauthenticated',
    status: false,
    message: 'You are not logged in or have not set up your Kiwi credentials',
    statusType: 'error'
} as StatusOperation
