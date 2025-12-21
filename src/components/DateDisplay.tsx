

export function DateDisplay({date} : {date: Date}) {
    const val = date.toLocaleDateString()

    return <span>{val}</span>
}
