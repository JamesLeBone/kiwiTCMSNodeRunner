'use client'

import { useState } from "react"

declare type propset = {
    name: string
    onChange: (value:string) => void
    value?: string
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
