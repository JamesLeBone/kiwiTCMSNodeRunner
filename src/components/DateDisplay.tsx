type displayProps = {
    date: Date | string | null
}

export function DateDisplay({date} : displayProps) {
    if (date == null) return <span>null</span>
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const val = dateObj.toLocaleString()

    return <span>{isNaN(dateObj.getTime()) ? date.toString() : val}</span>
}
