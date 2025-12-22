'use client'

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'
import { FormField } from '@/components/FormField'

export type MarkdownSectionProps = {
    state: [string, (value: string) => void],
    label: string,
    open?: boolean
    name?: string
    className?: string
}

export function MarkdownSection({state,label,open=false, name, className=''} : MarkdownSectionProps) {
    const markdownEditState = useState( open )
    const updateText = (e: React.ChangeEvent<HTMLTextAreaElement>) => state[1](e.target.value)
    const toggleMarkdownEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        const mds = markdownEditState[0]
        markdownEditState[1](!mds)
    }

    const edit = markdownEditState[0] ? <textarea rows={5} cols={20} value={state[0]} onChange={updateText} /> : ''
    const fieldClass = 'MarkdownEditor ' + className

    return <div className={fieldClass}>
        <FormField label={label} className="Markdown">
            <Markdown remarkPlugins={[remarkGfm]}>{state[0]}</Markdown>
        </FormField>
        { name ? <input type="hidden" name={name} value={state[0]} /> : null }
        <button onClick={toggleMarkdownEdit}>Toggle Edit {label}</button>
        {edit}
    </div>
}

export function MarkdownDisplay({md}: {md: string}) {
    if (md.length == 0) return <></>
    
    return <Markdown>{md}</Markdown>
}
