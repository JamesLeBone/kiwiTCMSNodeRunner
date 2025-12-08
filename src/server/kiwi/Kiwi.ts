// Fetch is refusing to send the cookies
// have to use other request methods
import { request } from 'http'
import { SimpleHttp } from '../lib/SimpleHttp'
import { DjangoEntity, BasicRecord, checkDate, htmlEntityDecode } from './Django'

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
    constructor() {
        const kiwiProtocol = process.env.KIWI_PROTOCOL === 'https' ? 'https' : 'http'
        // Keep the HTTP connection in the instance to seperate sessions per user

        const kiwiHttp = new SimpleHttp({
            protocol: kiwiProtocol,
            hostname: process.env.KIWI_DOMAIN || 'localhost',
            port: process.env.KIWI_PORT ? parseInt(process.env.KIWI_PORT) : (kiwiProtocol === 'https' ? 443 : 80)
        })
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
            
        if (this.#loggedIn) await this.logout()
        this.#loggedIn = false

        try {
            await this.call('Auth.login', {username, password}, 'login')
            this.#loggedIn = true
            console.debug('Kiwi login successful for user:', username)
            return true
        } catch (error) {
            this.#loggedIn = false
            console.error('Kiwi login failed:', error)
            // Return false instead of throwing to allow graceful handling
            return false
        }
    }

    /**
     * @throws {JsonRPCError} JSON-RPC error response
     */
    call(methodName:string,params?: methodParameters, requestId?:string) : Promise<any> {
        const id = requestId == null ? methodName.toUpperCase() : requestId
        const sendData = new Map<string, any>() 
        sendData.set('jsonrpc', '2.0')
        sendData.set('method',  methodName)
        sendData.set('id',      id)
        if (params != null) sendData.set('params',  params)
        
        return new Promise((resolve,reject) => {
            this.#kiwiHttp.post('/json-rpc/', sendData)
            .then(httpResponse => {
                if (!httpResponse.isJson) {
                    const jprcPseudoError = {
                        jsonrpc: '2.0',
                        id: id,
                        error: {
                            code: -32000,
                            message: 'Kiwi returned non-JSON content: ' + httpResponse.body
                        }
                    } as JsonRPCError
                    throw jprcPseudoError
                }
                const content = httpResponse.json as RPCReply
                if (httpResponse.isError) {
                    if (typeof content.error == 'undefined') {
                        content.error = { code: 500, message: 'An error has occured' }
                    }
                    throw content as JsonRPCError
                }
                if (typeof content.error != 'undefined') {
                    throw content as JsonRPCError
                }
                resolve(content.result)
            })
            .catch(error => {
                // If it's already a JsonRPCError from the .then() block above, just re-throw it
                if (error.jsonrpc && error.error) throw error

                // Handle network/connection errors from SimpleHttp
                console.warn('Kiwi connection error:', error.message || error)
                const host = error.hostname || 'unknown host'
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
                throw jprcPseudoError
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
        const result = await this.rawSearch(entity,query,ilike)
        
        const entities = [] as DjangoEntity[]
        for (let item of result as BasicRecord[]) {
            const dji = new DjangoEntity()
            dji.loadDjango(item, {autoDates:true})
            entities.push(dji)
        }
        return entities
    }
    
    async get(entity:string,id:number,idName='id'): Promise<DjangoEntity> {
        const query = {} as Record<string, number>
        query[idName] = id
        return this.call(entity+'.filter',{query:query}).then(list => new DjangoEntity(list[0]))
    }
    async getList(entity:string,id:number, idName='id'): Promise<BasicRecord[]> {
        const query = {} as Record<string, number>
        query[idName] = id
        return this.call(entity+'.filter',{query:query})
            .then(list => queryListValues(list))
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
    reference(entity:string,property:string,query:methodParameters) : Promise<DjangoEntity> {
        return this.callDjango(entity+'.'+property,query)
    }
}

export type IndividualTag = {
    id: number,
    name: string,
    cases: number,
    plan: number,
    bugs: number,
    run: number
}
export type AmlgomatedTag = {
    id: number,
    name: string,
    cases: number[],
    plans: number[],
    bugs: number[],
    runs: number[]
}

function amalgomateTags(list: IndividualTag[]) : AmlgomatedTag[] {
    const tagList = {} as Record<number,AmlgomatedTag>
    for (const tag of list) {
        const tagId = tag.id

        const testCaseId = tag.cases
        const planId = tag.plan
        const bugId = tag.bugs
        const runId = tag.run
        
        if (typeof tagList[tagId] == 'undefined') {
            tagList[tagId] = {
                id:tagId,
                name: tag.name,
                cases:[],
                plans:[],
                bugs:[],
                runs:[]
            }
        }
        if (testCaseId != null)
            tagList[tagId].cases.push(testCaseId)
        if (planId != null)
            tagList[tagId].plans.push(planId)
        if (bugId != null)
            tagList[tagId].bugs.push(bugId)
        if (runId != null)
            tagList[tagId].runs.push(runId)
    }
    
    const resultList = Object.values(tagList)
    resultList.sort((a,b) => {
        if (a.name > b.name) return 1
        return b.name > a.name ? -1:0
    })
    return resultList
}

export type IndividualComponent = {
    id: number,
    name: string,
    cases: number,
}
export type AmalgomatedComponent = {
    id: number,
    name: string,
    cases: number[]
}

function amalgomateComponents(list: IndividualComponent[]) : AmalgomatedComponent[] {
    const componentList = {} as Record<number, AmalgomatedComponent>
    for (const component of list) {
        const testCaseId = component.cases
        const componentId = component.id

        
        if (typeof componentList[componentId] == 'undefined') {
            const ac = {
                id: componentId,
                name: component.name,
                cases: []
            } as AmalgomatedComponent
            componentList[componentId] = ac
        }
        if (testCaseId != null) {
            componentList[componentId].cases.push(testCaseId)
        }
    }
    
    const resultList = Object.values(componentList)
    resultList.sort((a,b) => {
        if (a.name > b.name) return 1
        return b.name > a.name ? -1:0
    })
    return resultList
}

export const http = new KiwiCall()

export const methods = {
    amalgomateTags,
    amalgomateComponents,
    djangoEntity: (entity: BasicRecord) => new DjangoEntity(entity),
    date: (value : null|string) => {
        if (value == null) return null
        return checkDate(value)
    },
    htmlDecode: htmlEntityDecode
}

export const promiseBoolean = (p:Promise<any>) => p.then(rv => true).catch(reject => false)
