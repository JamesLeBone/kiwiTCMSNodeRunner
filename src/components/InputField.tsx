'use client'

import { useEffect, useState } from "react"

type propset = {
    name: string
    onChange: (value:string) => void
    value?: string|number
    type?: string
    [key: string]: any
}
export function InputField({name, onChange, value='', type='text',...props} : propset) {
    const [val,setVal] = useState(value)

    const changeEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        setVal(event.target.value)
        onChange(event.target.value)
    }
    
    return <input name={name} type={type} value={val} onChange={changeEvent} {...props} />
}

type NumberInputProps = {
    name: string
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    value: number | ''
    step:number
    min:number
    max:number
    [key: string]: any
}
export function NumberInput({name, onChange, step=1, min=0,max, value='', ...props} : Partial<NumberInputProps>) {
    const [val,setVal] = useState(value)
    const [atMin,setAtMin] = useState(false)
    const [atMax,setAtMax] = useState(false)

    min = min ?? 0

    const setValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nval = parseFloat(e.target.value)
        if (onChange) onChange(e)
        
        if (isNaN(nval)) {
            setVal('')
            return
        }
        setVal(nval)
    }

    useEffect( () => {
        if (typeof val !== 'number') {
            setAtMax(false)
            setAtMin(false)
            return
        }
        setAtMin( val <= min )
        if (max !== undefined) {
            setAtMax( val >= max )
        }
    }, [val, min, max] )

    return <>
        <input name={name} type="number" value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e)} {...props} />
        <button type="button" disabled={atMax} onClick={ () => {
            const nval = typeof val === 'number' ? val : 0
            const newValue = nval + step
            if (max !== undefined && newValue > max) return
            setVal(newValue)
        } }>▲</button>
        <button type="button" disabled={atMin} onClick={ () => {
            const nval = typeof val === 'number' ? val : 0
            const newValue = nval - step
            if (newValue < min) return
            setVal(newValue)
        } }>▼</button>
    </>
}
