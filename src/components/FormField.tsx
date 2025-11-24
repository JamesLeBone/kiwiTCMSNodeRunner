
export function FormField({label,children, ...props} : {label: string, children: React.ReactNode, [key: string]: any}) {
    const cn = 'FormField ' + (props.className ? props.className : '')

    return <div className={cn} {...props}>
        <label>{label}</label>
        <div>{children}</div>
    </div>
}
