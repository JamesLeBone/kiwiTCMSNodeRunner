
import { ReactNode } from 'react'

interface ComponentSectionProps {
    // Required properties
    header: string
    children: ReactNode
    
    // Optional properties
    headerActions?: ReactNode
    className?: string[]
    actionbar?: ReactNode
    
    // Allow any additional HTML div props
    [key: string]: any
}

export function ComponentSection(
    { header, headerActions, children, className, actionbar, ...props }: ComponentSectionProps
) {
    let computedClassName = 'ComponentSection'

    if (className) {
        for (let cn of className) {
            computedClassName += ' ' + cn
        }
    }

    const headerClass = 'component-header' + (headerActions ? ' with-actions' : '')
    
    return <div className={computedClassName} {...props}>
        <header className={headerClass}>
            <span>{header}</span>
            <div>{headerActions}</div>
        </header>
        <div className='component-body'>
            {children}
        </div>
        {actionbar}
    </div>
}
