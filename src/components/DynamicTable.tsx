export type DynamicTableProps = {
    headers: string[],
    children: React.ReactNode[],
    [key: string]: any
}

export function DynamicTable({headers,children,...args} : DynamicTableProps) {
    if (children.length == 0) {
        return <div className='DynamicTable no-content' {...args}>
            No results
        </div>
    }

    return <div className='DynamicTable' {...args}>
        <table>
            <thead>
                <tr>
                    {headers.map((header,index) => <th key={index}>{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
    </div>
}
