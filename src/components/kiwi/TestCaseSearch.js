'use client'

import { useState } from 'react';
import Link from 'next/link'
import { DynamicTable } from '@/components/DynamicTable'
import { useMessage } from '@/components/ServerResponse'
import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar, ActionButtonText } from '@/components/Actions'

import * as conn from '@server/kiwi/TestCase'

export default function TestCaseSearch({}) {
    const idState = useState('')
    const summary = useState('')
    
    const testCaseList = useState([])
    const status = useMessage()

    const loadHandler = ({textValue}) => {
        status.loading()
        testCaseList[1]([])
        const action = 'Load Test Case'

        const id = textValue.trim()
        if (id == '') {
            status.clear()
            console.info('No ID')
            return
        }

        conn.get(id)
        .then(result => {
            const resultSuccess = result.status
            const content = result.message
            
            if (resultSuccess) {
                status.success( 'Found!')
                testCaseList[1]([content])
                return
            }

            status.error('Not found')
        })
        .catch(e => status.error(e.message))
    }

    const searchHandler = ({textValue}) => {
        status.loading()
        
        const summaryValue = textValue.trim()
        testCaseList[1]([])

        if (summaryValue.length == 0) {
            status.error('No search criteria')
            return
        }

        const action = 'Search'
        
        conn.search({summary:summaryValue})
        .then(result => {
            const resultSuccess = result.status
            const list = result.message

            console.debug(result)
            if (resultSuccess) {
                const length = list.length
                status.success( 'List obtained - '+length+' items')
                testCaseList[1](list)
            } else {
                const message = result.message
                status.error(message)
            }
        })
        .catch(e => status.handleException(action, e))
    }
    
    return <ComponentSection header="Search Test Cases">
        <ActionBar className="controls">
            <ActionButtonText   action={searchHandler} state={summary} >Search by name</ActionButtonText>
            <ActionButtonText type="number" step="1"   action={loadHandler} state={idState} >Load by ID</ActionButtonText>
            <Link href="/kiwi/testCase">Create new</Link>
        </ActionBar>
        { status.message }
        <DynamicTable headers={['ID','Automated','Summary','Status']}>
            {testCaseList[0].map(tc => <TestCaseSummary key={tc.id} testCase={tc} />)}
        </DynamicTable>
    </ComponentSection>
}


function TestCaseSummary({testCase}) {
    const path = "/kiwi/testCase/"+testCase.id
    const clickAction = e => window.location = path
        
    const status = testCase.caseStatus.name.replace(/_/g, ' ')
        .toLowerCase()

    return <tr onClick={clickAction}>
        <td className="numeric">
            <Link href={path} style={{padding:'4px'}}>{testCase.id}</Link>
        </td>
        <td className="status">{testCase.isAutomated ? 'Automated' : 'Manual'}</td>
        <td className="textual">{testCase.summary}</td>
        <td className="status" style={{textAlign:'right',textTransform:'capitalize',paddingRight:'1em'}}>{status}</td>
    </tr>
}
