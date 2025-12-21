'use client'
import { useState } from 'react'

export function ActionBar({children,...props} : {children: React.ReactNode, [key: string]: any}) {
    return <div className="ActionBar" {...props}>
        {children}
    </div>
}

export type ActionButtonProps = {
    onClick: () => void,
    children: React.ReactNode | string,
    [key: string]: any
}
export function ActionButton({onClick,children,...props} : ActionButtonProps) {
    const doAction = (mouseEvent: React.MouseEvent<HTMLButtonElement>) => {
        mouseEvent.preventDefault()
        onClick()
    }
    return <button onClick={doAction} {...props}>
        {children}
    </button>
}

export type ActionButtonTextProps = {
    onClick: (text: string) => Promise<void>,
    value?: string,
    children: React.ReactNode | string,
    [key: string]: any
}
export function ActionButtonText({children,value,onClick,...props} : ActionButtonTextProps) {
    const [text,setText] = useState(value || '')
    const [disabled,setDisabled] = useState(false)

    const doAction = (clickEvent: React.MouseEvent<HTMLButtonElement>) => {
        setDisabled(true)
        clickEvent.preventDefault()
        onClick(text).then(() => {
            setDisabled(false)
        })
    } 
    return <div>
        <input type="text" value={text} onChange={e => setText(e.target.value)} />
        <button onClick={doAction} disabled={disabled} {...props}>{children}</button>
    </div>
}

export type IconButtonProps = {
    onClick: () => void,
    className: string,
    [key: string]: any
}
export function IconButton({onClick,className,...props} : IconButtonProps) {
    const doAction = (mouseEvent: React.MouseEvent<HTMLButtonElement>) => {
        mouseEvent.preventDefault()
        onClick()
    }
    return <button onClick={doAction} className={className} {...props}></button>
}
