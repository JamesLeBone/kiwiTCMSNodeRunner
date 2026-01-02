export type DynamicTableProps = {
    headers: string[],
    children: React.ReactNode[] | React.ReactNode,
    [key: string]: any
}

export function DynamicTable({headers,children,...args} : DynamicTableProps) {
    const length = Array.isArray(children) ? children.length : 1

    return <div className='DynamicTable' {...args}>
        <table>
            <thead>
                <tr>
                    {headers.map((header,index) => <th key={index}>{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {!length ? <tr className='no-results'><td colSpan={headers.length}>No results</td></tr> : children}
            </tbody>
        </table>
    </div>
}
