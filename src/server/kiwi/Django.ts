export type BasicRecord = Record<string, any>
type parseOptions = {
    autoDates?: boolean 
}
const dtRegx = /^(?<date>.*)T(?<time>\d{2}:\d{2})/

export const htmlEntityDecode = (str: string) => {
    if (typeof str !== 'string') throw new Error('htmlEntityDecode: input is not a string')
    return str.replaceAll('&quot;', '"')
        .replaceAll('&#x27;', "'")
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&copy;', '©')
        .replaceAll('&reg;', '®')
        .replaceAll('&trade;', '™')
        .replaceAll('&pound;', '£')
        .replaceAll('&yen;', '¥')
        .replaceAll('&cent;', '¢')
        .replaceAll('&deg;', '°')
        .replaceAll('&plusmn;', '±')
        .replaceAll('&times;', 'x')
        .replaceAll('&divide;', '÷')
        .replaceAll('&ndash;', '-')
        .replaceAll('&mdash;', '-')
        .replaceAll('&lsquo;', '\u2018')
        .replaceAll('&rsquo;', '\u2019')
        .replaceAll('&ldquo;', '\u201C')
        .replaceAll('&rdquo;', '\u201D')
        .replaceAll('&hellip;', '…')
        .replaceAll('&bull;', '•')
}

export const checkDate = (value: any): Date | any => {
    if (typeof value === 'object') return value as Date
    if (typeof value !== 'string') return value
    if (value.match(/Z$/)) return new Date(value)
    const m = value.match(dtRegx)
    if (!m || !m.groups) return value
    const stringv = m.groups.date + 'T' + m.groups.time + ':00Z'
    return new Date(stringv)
}

/**
 * A class to help parse Django-style flat objects into nested objects
 * - handle double-underscore sub-properties
 * - convert snake_case to camelCase
 * - optionally parse date strings into Date objects
 * - handle JSON fields
 * - ensure Zulu timezone designators
 */
class DjangoEntity {
    values: BasicRecord = {}
    
    constructor(values: BasicRecord = {}, type='django') {
        if (type == 'django') {
            this.loadDjango(values, {autoDates:true})
        } else {
            this.values = values
        }
    }

    static parse(value: BasicRecord) {
        const dj = new DjangoEntity()
        dj.loadDjango(value, {autoDates:true})
        return dj
    }
    
    convertJson(fieldName:string) : BasicRecord {
        const value = this.values[fieldName]
        if (value === null || value === '') {
            this.values[fieldName] = {}
            return {}
        }
        
        try {
            const newValue = htmlEntityDecode(this.values[fieldName])
            this.values[fieldName] = JSON.parse(newValue)
        } catch (e) {
            console.warn('Django.convertJson - Failed to parse JSON')
            console.debug('source',value, e)
            this.values[fieldName] = {}
        }
        return this.values[fieldName]
    }

    parseDate(fieldName:string) : Date | null {
        const value = this.values[fieldName]
        if (typeof value !== 'string') return null
        this.values[fieldName] = checkDate(value)
        return this.values[fieldName]
    }
    
    /**
     * Ensure a Zulu timezone designator is at the end of a datetime string
     */
    addZulu(fieldName: string) {
        try {
            const value = this.values[fieldName]
            if (typeof value !== 'string') return
            if (!value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return
            if (value.substring(value.length-1) == 'Z') return
            this.values[fieldName] = value + 'Z'
        } catch (e) {
            console.error('Failed to add Zulu')
            console.error(e)
        }
    }
    
    #dehumpKey(key:string): string {
        return key.replaceAll(/_(\w)/g, (match, letter) => letter.toUpperCase())
    }
    
    loadDjango(values: BasicRecord, parseOpts?: parseOptions) {
        this.values = {}
        try {
            for (let [key,value] of Object.entries(values)) {
                if (parseOpts?.autoDates) {
                    value = checkDate(value)
                }

                const isSubProp = key.match(/\w__\w/)
                if (isSubProp) {
                    // prioirty__value -> priority: { value: ... }
                    // [priority,value]
                    const path = key.split('__')

                    let previous = this.values
                    for (let i = 0; i < path.length; i++) {
                        const parent = path[i]
                        const pkey = this.#dehumpKey(parent)
                        // pkey = priority
                        if (typeof previous[pkey] === 'undefined') {
                            previous[pkey] = {}
                        } else if (typeof previous[pkey] !== 'object') {
                            const rawValue = previous[pkey]
                            // Update: the number is the id, 'value' was conflicting with
                            // entities with 'value' as a string property
                            previous[pkey] = { 'id': rawValue }
                        }
                        if (previous[pkey] == null) continue
                        if (i < path.length -1) {
                            previous = previous[pkey]
                            continue
                        }
                        previous[pkey] = value
                    }
                    continue
                }
                const newKey = this.#dehumpKey(key)
                this.values[newKey] = value
            }
        } catch (e) {
            console.info('Failed to parse values')
            console.debug(values)
            console.error(e)
        }
    }
    
    /**
     * Extract only the specified properties into a new object
     */
    filter(props: string[]) : BasicRecord {
        const newObject: BasicRecord = {}
        for (let prop of props) {
            newObject[prop] = this.values[prop]
        }
        return newObject
    }
}

export {
    DjangoEntity
}
