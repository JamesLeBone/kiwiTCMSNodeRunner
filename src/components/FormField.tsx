
export function FormField({label,children, ...props}) {
    const cn = 'FormField ' + (props.className ? props.className : '')

    return <div className={cn} {...props}>
        <label>{label}</label>
        <div>{children}</div>
    </div>
}
