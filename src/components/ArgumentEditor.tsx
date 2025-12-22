'use client';
import { useState,useEffect } from 'react';
import { ActionBar, ActionButton } from '@/components/Actions'

export declare type ArgumentEditHook = {
    set: (data: Record<string, string>) => void
    setKey: (key: string,value:string) => void
    removeKey: (key: string) => void
    args: Record<string, string>
    addItem: (key: string) => void
    moveKey: (key: string, newKey: string, newValue?:string) => void
    text: string
    name: string
    urlEncode: () => string
}
export const useArgumentHook = (name: string, defaultArgs : Record<string, string>) : ArgumentEditHook => {
    const [args, setArgs] = useState<Record<string, string>>(defaultArgs)

    const rebuildArgs = (data: Record<string, string>) => {
        const keyList = Object.keys(data)// .sort() // Took this out as it would reorder keys as you typed
        const newRecord : Record<string, string> = {}
        for (let key of keyList) {
            newRecord[key] = data[key]
        }
        setArgs(newRecord)
    }
    
    const hook: ArgumentEditHook = {
        set: rebuildArgs,
        name,
        setKey: (key: string,value:string) => {
            const ar = { ...args, [key]: value }
            rebuildArgs(ar)
        },
        moveKey: (key: string, newKey: string, newValue?:string) => {
            const ar = { ...args }
            delete ar[key]
            ar[newKey] = newValue || args[key]
            rebuildArgs(ar)
        },
        addItem: (key: string) => {
            const ar = { ...args, [key]: '' }
            rebuildArgs(ar)
        },
        removeKey: (key: string) => {
            const ar = { ...args }
            delete ar[key]
            rebuildArgs(ar)
            return ar
        },
        args,
        text: JSON.stringify(args,null,4),
        urlEncode: () => {
            const params = new URLSearchParams()
            for (let [key,value] of Object.entries(args)) {
                params.append(key, value)
            }
            return params.toString()
        }
    }
    return hook
}

declare type itemProps = {
    name:string
    propName:string
    value:string
    onChange: (newValue:string) => void
    onDelete: () => void
    rename: (newName:string, value:string) => void
}
function Item(props:itemProps) {
    const prop = useState(props.propName)
    const val = useState(props.value)
    
    const setProp = (e : React.ChangeEvent<HTMLInputElement>) => prop[1](e.target.value)
    const setVal  = (e : React.ChangeEvent<HTMLInputElement>) => val[1](e.target.value)

    useEffect( () => {
        if (props.propName != prop[0]) {
            props.rename(prop[0], val[0])
            return
        }
        props.onChange(val[0])

    }, [val[0], prop[0]] )

    const remove = () => props.onDelete()
    
    return <>
        <input type="text" placeholder='Key' value={prop[0]} onChange={setProp} />
        <input type="text" placeholder='Value' value={val[0]} onChange={setVal} />
        <ActionButton onClick={remove}>Remove</ActionButton>
    </>
}

function EntryList({hook}: {hook: ArgumentEditHook}) {
    return <div className="list">{
        Object.entries(hook.args).map( ([key,val]) => {
            const onChange = (newValue:string) => hook.setKey(key, newValue)
            const onDelete = () => hook.removeKey(key)
            const rn = (newName:string, value:string) => hook.moveKey(key, newName, value)

            const itemName = hook.name + `[${key}]`

            return <Item key={key} name={hook.name} propName={key} value={val} onChange={onChange} onDelete={onDelete} rename={rn} />
        })
    }</div>
}

function ArgumentObject({hook}: {hook: ArgumentEditHook}) {
    return <div style={{padding:'0px'}}>
        <EntryList hook={hook} />
        <ActionButton onClick={() => hook.addItem('')}>Add</ActionButton>
    </div>
}

const args2string = (args: Record<string,string>) => {
    const recordSet: Record<string,string> = {}
    for (let [key,value] of Object.entries(args)) {
        const k = key.trim()
        const v = value.trim()
        if (k.length == 0 || v.length == 0) continue
        recordSet[k] = v
    }
    return JSON.stringify(recordSet)
}

export function ArgumentEditor({hook} : {hook: ArgumentEditHook}) {
    return <div className="ArgumentEditor">
        <ArgumentObject hook={hook} />
        <input type='hidden' name={hook.name} value={args2string(hook.args)} />
    </div>
}
