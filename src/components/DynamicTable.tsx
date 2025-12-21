export type DynamicTableProps = {
    headers: string[],
    children: React.ReactNode[],
    [key: string]: any
}

export function DynamicTable({headers,children,...args} : DynamicTableProps) {
    return <div className='DynamicTable' {...args}>
        <table>
            <thead>
                <tr>
                    {headers.map((header,index) => <th key={index}>{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {children.length == 0 ? <tr className='no-results'><td colSpan={headers.length}>No results</td></tr> : children}
            </tbody>
        </table>
    </div>
}
