'use client'

import { useState, useRef } from 'react';
import Link from 'next/link'
import * as tc from '@server/kiwi/TestCase.js'
import { ExecuteButton, remotePaths } from '@/components/kiwi/ScriptExecution.js'

import { IconButton } from '@/components/Actions'
import { kiwiBaseUrl } from '@lib/Functions'

const sp = str => {
    const val = str ?? ''
    if (val.length < 1) return ''
    return val[0].toUpperCase() + val.slice(1).toLowerCase()
}
const kiwiUrl = (id:number) => kiwiBaseUrl()+'/case/'+id

export function TestCaseSummary({testCase,updateChecked}) {
    testCase.status = sp(testCase.status)
    testCase.securityGroupId = sp(testCase.securityGroupId)

    const summary = useState(testCase.summary)
    const status = useState(testCase.status)
    const isAutomated = useState(testCase.isAutomated)
    const securityGroupId = useState(testCase.securityGroupId)
    const script = useState(testCase.script.match(/^\d+/) ? testCase.script : '')
    
    const testCaseId = testCase.id
    const kiwiUrl = getKiwiUrl(testCaseId)
    const localUrl = '/kiwi/testCase/'+testCaseId

    // const isSelectedRef = useRef(testCase.selected)
    // const isSelectedState = useState(testCase.selected || false)
    
    let rowClasses = [testCase.isAutomated ? 'automated' : 'manual', testCase.status]
    const _updateChecked = event => {
        event.stopPropagation()
        // isSelectedRef.current = !event.target.checked
        updateChecked(!event.target.checked)
        return false
    }
    
    const rowClassString = useState(rowClasses.join(' '))

    const reloadIcon = useState('fa fa-refresh')

    const reload = () => {
        reloadIcon[1]('fa fa-refresh fa-spin')
        tc.get(testCaseId).then(data => {
            if (!data.status) {
                console.error('Error loading test case', data)
                reloadIcon[1]('fa fa-exclamation-triangle')
                return
            }
            const tc = data.message
            // console.debug(data.message)
            reloadIcon[1]('fa fa-check')
            summary[1](tc.summary)
            status[1](sp(tc.caseStatus.name))
            isAutomated[1](tc.isAutomated)
            securityGroupId[1](sp(tc.securityGroupId))
            script[1](tc.script)

            const rowClasses = [tc.isAutomated ? 'automated' : 'manual', sp(tc.caseStatus.name)]
            rowClassString[1](rowClasses.join(' '))

        })
    }

    const eventListener = (eventName,data) => {
        if (eventName != 'testResult.finish') {
            console.log('eventListener', eventName)
            return
        }
        const {success,testCaseId} = data
        console.debug('Test completed', success, testCaseId)
    }
    
    return <tr className={rowClassString[0]}>
        <td className="numeric">
            <Link className="link" href={localUrl}>{testCaseId}</Link>
        </td>
        <td className="numeric">{script[0]}</td>
        <td>
            <Link href={kiwiUrl} target="kiwi">Kiwi</Link>
        </td>
        <td>{summary[0]}</td>
        <td>{isAutomated[0] ? 'Automated' : 'Manual'}</td>
        <td className="status">{status[0]}</td>
        <td className="securityGroup">{securityGroupId[0]}</td>
        <td className="no-navigate centered">
            <input type="checkbox" checked={testCase.selected} onChange={_updateChecked} data-test-case-id={testCaseId} />
        </td>
        <td className="no-navigate centered actions">
            <ExecuteButton src={remotePaths.test(testCase.id)} events={eventListener} />
            <IconButton className={reloadIcon[0]} action={reload} title="Reload" />
        </td>
    </tr>
}

export function TestCaseRow({testCase}) {
    const kiwiUrl = getKiwiUrl(testCase.id)
    return <tr className={testCase.isAutomated ? 'automated' : 'manual'}>
        <td className="numeric">{testCase.id}</td>
        <td className="numeric">{testCase.script}</td>
        <td>
            <Link href={kiwiUrl} target="kiwi">Kiwi</Link>
        </td>
        <td>{testCase.summary}</td>
        <td>{testCase.isAutomated ? 'Automated' : 'Manual'}</td>
        <td className="status">{testCase.status}</td>
        <td className="securityGroup">{testCase.securityGroupId}</td>
    </tr>
}
