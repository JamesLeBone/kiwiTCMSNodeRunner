

const snakeKey = (key:string) => key.replace(/([A-Z])/g, (_, letter) => '_' + letter.toLowerCase())
const snakeKeys = (obj:object) => {
    const newObj = {} as KVP
    for (const [k,v] of Object.entries(obj)) {
        const newKey = snakeKey(k)
        newObj[newKey] = v
    }
    return newObj
}
const camelKeys = (obj:object) => {
    const newObj = {} as KVP
    for (const [k,v] of Object.entries(obj)) {
        const newKey = k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        newObj[newKey] = v
    }
    return newObj
}

export const transform = {
    snakeKey,
    snakeKeys,
    camelKeys,
    snakeKeysOf: (obj: object) => Object.keys(obj).map((k) => snakeKey(k)),
    snakeKeyList: (objects=[]) => objects.map((o) => snakeKeys(o)),
    camelKeyList: (objects=[]) => objects.map((o) => camelKeys(o))
}
