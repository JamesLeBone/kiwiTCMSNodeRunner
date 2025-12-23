export function formatSummary(summary: string, securityGroup?: string) : string {
    if (!securityGroup) return summary
    return `${summary} [${securityGroup}]`
}

export function kiwiBaseUrl() : string {
    return [
        process.env.KIWI_PROTOCOL || 'http',
        '://',
        process.env.KIWI_DOMAIN || 'localhost',
        ':',
        process.env.KIWI_PORT || '81'
    ]
    .join('')
}

export const formDataValue = {
    getString: (formData: FormData, key: string, defaultValue: string='') : string => {
        const v = formData.get(key)
        if (v && typeof v === 'string') return v
        return defaultValue
    },
    getNumber: (formData: FormData, key: string, defaultValue: number=0) : number => {
        const v = formData.get(key)
        if (v && typeof v === 'string') {
            const n = Number.parseInt(v)
            if (!isNaN(n)) return n
        }
        return defaultValue
    },
    getBoolean: (formData: FormData, key: string, defaultValue: boolean=false) : boolean => {
        const v = formData.get(key)
        if (v && typeof v === 'string') {
            const val = v.toLowerCase()
            if (val === 'true' || v === '1' || v === 'on' || val === 'yes') return true
            if (val === 'false' || v === '0' || v === 'off' || val === 'no') return false
        }
        return defaultValue
    },
    getJson: (formData: FormData, key: string, defaultValue: Record<string, any>={}) : Record<string, any> => {
        const v = formData.get(key)
        if (v && typeof v === 'string') {
            try {
                const j = JSON.parse(v)
                return j
            } catch(e) {
                return defaultValue
            }
        }
        return defaultValue
    }
}
