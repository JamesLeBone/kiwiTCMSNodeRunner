declare type inputProps = {
    className?: string,
    title: string,
    style?: React.CSSProperties,
    onClick?: Function,
    children?: React.ReactNode,
    active?: boolean,
    href?: string | false
}

export function IconButton({className,title,onClick,children,style,active=false,href=false}: inputProps) {
    const doAction = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        if (onClick) onClick()
    }

    const activeString = active ? 'active' : 'inactive'

    const buttonClass = 'IconButton ' + activeString + (children ? ' with-text' : ' icon-only')
    const wrappedChildren = children ? <span>{children}</span> : null

    if (href) {
        return <a href={href} title={title} className={buttonClass} style={style}>
            <i className={className}></i>
            {wrappedChildren}
        </a>
    }
    
    return <button onClick={doAction} title={title} className={buttonClass} style={style}>
        <i className={className}></i>
        {wrappedChildren}
    </button>
}
