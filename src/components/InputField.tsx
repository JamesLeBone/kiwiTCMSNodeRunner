'use client'

import { useState } from "react"

export function InputField({name, onChange, value='', type='text',...props}) {
    const [val,setVal] = useState(value)

    const changeEvent = e => {
        e.preventDefault()
        setVal(e.target.value)
        onChange(e)
    }
    
    return <input name={name} type={type} value={val} onChange={changeEvent} {...props} />
}
