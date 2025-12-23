type displayProps = {
    date: Date | string
}

export function DateDisplay({date} : displayProps) {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const val = dateObj.toLocaleString()

    return <span>{isNaN(dateObj.getTime()) ? date.toString() : val}</span>
}
