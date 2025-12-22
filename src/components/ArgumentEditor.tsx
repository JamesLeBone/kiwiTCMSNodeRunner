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
    urlEncode: () => string
}
export const useArgumentHook = (tcArgs : Record<string, string>) : ArgumentEditHook => {
    const [args, setArgs] = useState<Record<string, string>>(tcArgs)

    const rebuildArgs = (data: Record<string, string>) => {
        const keyList = Object.keys(data).sort()
        const newRecord : Record<string, string> = {}
        for (let key of keyList) {
            newRecord[key] = data[key]
        }
        setArgs(newRecord)
    }
    
    const hook: ArgumentEditHook = {
        set: rebuildArgs,
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
    value:string
    onChange: (newValue:string) => void
    onDelete: () => void
    rename: (newName:string, value:string) => void
}
function Item(props:itemProps) {
    const prop = useState(props.name)
    const val = useState(props.value)
    
    const setProp = (e : React.ChangeEvent<HTMLInputElement>) => prop[1](e.target.value)
    const setVal  = (e : React.ChangeEvent<HTMLInputElement>) => val[1](e.target.value)

    useEffect( () => {
        if (props.name != prop[0]) {
            props.rename(prop[0], val[0])
            return
        }
        props.onChange(val[0])

    }, [val[0], prop[0]] )

    const remove = () => props.onDelete()
    
    return <>
        <input type="text" placeholder='Key' value={prop[0]} onChange={setProp} />
        <input type="text" name={prop[0]} placeholder='Value' value={val[0]} onChange={setVal} />
        <ActionButton onClick={remove}>Remove</ActionButton>
    </>
}

function EntryList({hook}: {hook: ArgumentEditHook}) {
    return <div className="list">{
        Object.entries(hook.args).map( ([key,val]) => {
            const onChange = (newValue:string) => hook.setKey(key, newValue)
            const onDelete = () => hook.removeKey(key)
            const rn = (newName:string, value:string) => hook.moveKey(key, newName, value)

            return <Item key={key} name={key} value={val} onChange={onChange} onDelete={onDelete} rename={rn} />
        })
    }</div>
}

function ArgumentObject({hook}: {hook: ArgumentEditHook}) {
    return <div style={{padding:'0px'}}>
        <EntryList hook={hook} />
        <ActionButton onClick={() => hook.addItem('')}>Add</ActionButton>
    </div>
}

export function ArgumentEditor({hook} : {hook: ArgumentEditHook}) {
    return <div className="ArgumentEditor">
        <ArgumentObject hook={hook} />
    </div>
}
