'use client'
import { TestCase } from '@server/kiwi/TestCase'
import Link from 'next/link'
import { DynamicTable } from '../DynamicTable'

function TestCaseSummary({testCase} : {testCase: TestCase}) {
    const path = "/kiwi/testCase?id="+testCase.id
        
    const status = testCase.caseStatus
    const statusText = status.description ?? status.name.charAt(0).toUpperCase() + status.name.slice(1).toLowerCase()

    return <tr>
        <td className="numeric">
            <Link href={path} style={{padding:'4px'}}>{testCase.id}</Link>
        </td>
        <td className="status">{testCase.isAutomated ? 'Automated' : 'Manual'}</td>
        <td className="textual">{testCase.summary}</td>
        <td className="status">{statusText}</td>
    </tr>
}
export default function TestCaseList({cases} : {cases: TestCase[]}) {
    return <DynamicTable headers={['ID','Automated','Summary','Status']}>
        {cases.map(tc => <TestCaseSummary key={tc.id} testCase={tc} />)}
    </DynamicTable>
}
