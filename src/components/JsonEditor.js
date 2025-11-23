import { useState,useEffect } from 'react';

import { Selection } from '@/components/Selection'
import { ActionBar, ActionButton } from '@/components/Actions'

const dataTypeOptionList = [
    { value: 'string', name: 'String' },
    { value: 'number', name: 'Number' },
    { value: 'boolean', name: 'Boolean' },
    { value: 'null', name: 'NULL' }
]

function parseBoolean(rawValue) {
    if (rawValue === true || rawValue === false) return rawValue
    if (rawValue === 'true') return true
    if (rawValue === 'false') return false
    
    const intValue = parseInt(rawValue)
    if (!isNaN(intValue)) {
        return intValue > 0
    }
    return rawValue+''.length > 0
}

function JsonItem({name,state}) {
    const value = state[0][name] // only use this here for initial value
    let detectedDataType = 'string'
    if (typeof value == 'boolean' || value === 'true' || value === 'false') {
        detectedDataType = 'boolean'
    } else if (typeof value == 'number' || !isNaN(parseFloat(value))) {
        detectedDataType = 'number'
    } else if (value === null) {
        detectedDataType = 'null'
    }
    const dataType = useState(detectedDataType)

    const updateValue = rawValue => {
        const dt = dataType[0]
        if (dt == 'string') {
            return rawValue
        }
        if (dt == 'number') {
            return parseFloat(rawValue)
        }
        if (dt == 'boolean') {
            return parseBoolean(rawValue)
        }
        if (dt == 'null') {
            return null
        }

        return rawValue
    }
    
    const origionalName = name
    const prop = useState(name)
    const val = useState(value)
    
    const setProp = e => prop[1](e.target.value)
    const setVal = e => val[1](e.target.value)

    const update = () => {
        const newVal = updateValue(val[0])
        val[1](newVal)
        
        const newState = {...state[0]}
        delete newState[origionalName]
        newState[prop[0]] = newVal
        state[1](newState)
    }

    const remove = () => {
        const s = {}
        for (let [k,v] of Object.entries(state[0])) {
            if (k == origionalName) continue
            s[k] = v
        }
        state[1](s)
    }
    const setDataType = type => dataType[1](type)
    
    return <div>
        <input type="text" value={prop[0]} onChange={setProp} />
        <input type="text" value={val[0]} onChange={setVal} />
        <Selection  value={dataType[0]} options={dataTypeOptionList} setVal={setDataType} />
        <ActionButton action={update}>Update</ActionButton>
        <ActionButton action={remove}>Remove</ActionButton>
    </div>
}

function rebuildObject(oldObject) {
    const newObject = {}
    const keys = Object.keys(oldObject).sort()
    
    for (let key of keys) {
        newObject[key] = oldObject[key]
    }
    return newObject
}

function EntryList({state,onUpdate}) {
    const list = useState([])
    const rebuildList = () => {
        const o = state[0]
        const keys = Object.keys(o).sort()
        
        const tlist = []
        for (let key of keys) {
            const keyName = key == '' ? '_' : key
            tlist.push ( <JsonItem key={keyName} name={key} state={state} /> )
        }
        list[1](tlist)
    }
    
    useEffect(() => {
        rebuildList()
    }, [state])

    
    return <div className="list">{list[0]}</div>
}

function JsonObject({state,onUpdate}) {
    const addItem = ({textValue}) => {
        const newKey = textValue.trim()
        if (newKey.length == 0) {
            console.error('New key is empty')
            return
        }
        const newObject = rebuildObject(state[0])
        newObject[newKey] = ''
        state[1](newObject)
        if (typeof onUpdate == 'function') onUpdate(state[0])
    }

    const updateTrigger = (json) => {
        if (typeof onUpdate == 'function')
            onUpdate(json)
    }
    
    return <div style={{padding:'0px'}}>
        <EntryList state={state} onUpdate={updateTrigger} />
        <ActionBar>
            <ActionButton action={addItem}>Add key</ActionButton>
        </ActionBar>
    </div>
}

export function JsonEditor({jsonState,text,onUpdate}) {
    const jsonUpdated = (json) => {
        if (typeof onUpdate == 'function') onUpdate(json)
    }
    const textState = useState(text)

    useEffect(() => {
        textState[1](JSON.stringify(jsonState[0],null,4))
    }, [jsonState])

    return <div className="JsonEditor" style={{display:'flex'}}>
        <JsonObject className="fullWidth" state={jsonState} onUpdate={jsonUpdated} />
        <div>
            <pre style={{padding:'8px'}}>{textState[0]}</pre>
        </div>
    </div>
}
