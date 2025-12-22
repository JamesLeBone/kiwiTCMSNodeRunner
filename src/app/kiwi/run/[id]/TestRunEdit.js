'use client'
import './run.css'
// import Image from 'next/image'

import { useState } from 'react';

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { IconButton } from '@/components/IconButton'
import { ActionBar, ActionButton } from '@/components/Actions'

import * as conn from '@server/kiwi/TestRun'
import * as exec from '@server/kiwi/Execution'

import { ExecutionRunner, ExecuteButton, remotePaths } from '@/components/kiwi/ScriptExecution'

import Link from 'next/link'

const useStats = (failed,passed,other) => {
    const stats = useState({
        failed: failed,
        passed: passed,
        other: other
    })
    const lastUpdated = useState('')
    const total = failed + passed + other
    const getPerc = v => Math.ceil(v / total * 100) + '%'

    const passedPerc = useState(getPerc(passed))
    const failedPerc = useState(getPerc(failed))
    const remaining = useState((failed + other) + ' / ' + total)

    return {
        remaining,
        passedPerc,
        failedPerc,
        pass: () => {
            const newPassed = stats[0].passed + 1
            stats[1]({...stats[0], passed: newPassed})
            passedPerc[1](getPerc(newPassed))
            remaining[1]((stats[0].failed + stats[0].other) + ' / ' + total)
        },
        update: () => {
            const now = new Date()
            lastUpdated[1](now.toLocaleString())
        },
        lastUpdate: lastUpdated[0]
    }
}

const testCaseUrl = id => "/kiwi/testCase/" + id
const scriptValue = execution => {
    const script = execution.case.script
    const testCaseId = execution.case.id
    if (script == null || isNaN(Number.parseInt(script))) return ''
    return <Link href={testCaseUrl(script)}>{script}</Link>
}
const tableColSpan = 6

function Execution(execution,executionResult) {
    const url = "/kiwi/execution/" + execution.id
    const status = useState(execution.status)
    const iconState = useState('')

    const reloadExecution = () => {
        iconState[1]('loading')
        exec.get(execution.id)
        .then(r => {
            const txt = r.status ? 'success' : 'error'
            iconState[1]('' + txt)
            const execution = r.message
            status[1](execution.status.name)
        }, x => iconState[1]('error'))
        .catch(() => iconState[1]('error'))
    }
    const trId = 'testExecution-' + execution.id

    const caseEvents = (eventName,data) => {
        if (eventName != 'testResult.finish') {
            if (typeof executionResult == 'function') {
                try {
                    executionResult(eventName,data)
                } catch (e) {
                    console.error('Failed to execute executionResult callback', e)
                    console.log('eventListener', data)
                }
            }
            return
        }
        const {success,testCaseId} = data
        console.debug('Test completed', success, testCaseId)
    }

    return <tbody id={trId}>
        <tr>
            <td className={'status '+status[0]} style={{textAlign:'left'}}>{status[0]}</td>
            <td className='numeric'><Link href={url}>{execution.id}</Link></td>
            <td className='numeric'><Link href={testCaseUrl(execution.case.id)}>{execution.case.id}</Link></td>
            <td className='numeric'>{scriptValue(execution)}</td>
            <td>{execution.case.securityGroupId}</td>
            <td rowSpan='2'>
                <IconButton title="Reload" onClick={reloadExecution} className="fa fa-refresh" active={iconState[0]} />
                <ExecuteButton src={remotePaths.execution(execution.case.id,execution.id)} events={caseEvents} />
            </td>
        </tr>
        <tr>
            <td colSpan='5'>{execution.case.summary}</td>
        </tr>
        <tr><td colSpan='5' id={trId+'-reason'} style={{whiteSpace:'pre',padding:'8px',fontFamily:'monospace'}}></td></tr>
    </tbody>
}

function Executions({id,header,list,reportResult}) {
    if (list.length == 0) return ''
    return <table className='ExecutionList' id={id}>
        <thead>
            <tr>
                <th colSpan={tableColSpan}>{header}</th>
            </tr>
            <tr>
                <th>Status</th>
                <th>Execution ID</th>
                <th>Test Case ID</th>
                <th>Script</th>
                <th>Security Group</th>
                <th>Actions</th>
            </tr>
        </thead>
        {list.map(execution => <Execution key={execution.id} {...execution} executionResult={result => reportResult(execution.id,result)}  />)}
    </table>
}

const updateExecutionResult = (runningStats,executionId,success,message) => {
    if (success) runningStats.pass()
    const tbody = document.getElementById('testExecution-' + executionId)
    if (tbody == null) return

    try {
        const statusCell = tbody.childNodes[0].childNodes[0]
        if (statusCell == null) {
            console.warn('Could not find status cell for execution',executionId)
        } else {
            statusCell.innerHTML = success ? 'PASSED' : 'FAILED'
            statusCell.className = 'status ' + (success ? 'PASSED' : 'FAILED')
        }
    } catch (e) {
        console.error('Failed to update status cell', e)
    }

    if (message != null) {
        try {
            const reasonCell = document.getElementById('testExecution-' + executionId + '-reason')
            if (reasonCell != null) reasonCell.innerHTML = message
        } catch (e) {
            console.error('Failed to update reason cell', e)
        }
    }
    // Try to move the tbody to the success table on success
    if (!success) return
    try {
        // console.debug('parentId, if this is not -other, we nee dto correct otherTable', tbody.parentElement.id)
        // const otherTable = document.getElementById('executions-other')
        // // Need to check if tbody is a child of otherTable
        // if (otherTable != null && otherTable.contains(tbody)) {
        //     otherTable.removeChild(tbody)
        // }
        // const failedTable = document.getElementById('executions-failed')
        // if (failedTable != null && failedTable.contains(tbody)) {
        //     failedTable.removeChild(tbody)
        // }

        // const passedTable = document.getElementById('executions-passed')
        // if (passedTable != null) {
        //     passedTable.appendChild(tbody) // footer.insertAdjacentHTML('afterend', div.outerHTML);
        // } else {
        //     console.warn('Could not find passed table')
        // }
    } catch (e) {
        console.error('Failed to move tbody to the passed table', e)
    }
}

export default function TestRun({testRun,executions}) {
    const executionData = useState(executions)

    const header = <div>
        <span>
            {testRun.id} - {testRun.summary}
        </span>
    </div>
    const testRunUrl = `/kiwi/run/${testRun.id}`
    const testPlanUrl = `/kiwi/plan/${testRun.plan.value}`

    const buttonState = useState('idle')

    const refresh = () => {
        buttonState[1]('loading')
        conn.getCases(testRun.id)
        .then(r => {
            if (!r.status) {
                buttonState[1]('error')
                console.error(r.message)
                return
            }
            executionData[1](r.message)
            buttonState[1]('idle')
        })
    }

    const runningStats = useStats(executionData[0].failed.length, executionData[0].passed.length, executionData[0].other.length)
    const currentTestCaseId = useState(null)

    const executionEvents = (type,data) => {
        // testCase.skipped : {testCaseId,executionId}
        // testCase.finished : {testCaseId,executionId,testResult}
        // testCase.start : {testCaseId}
        // testRun.finished
        runningStats.update()
        if (type == 'done') { // This comes from ScriptExecution
            refresh()
            return
        }
        if (type == 'testCase.start') {
            currentTestCaseId[1](data.testCaseId)
            return
        }
        if (type == 'testCase.progres') {
            console.info(data.progress)
            return
        }
        if (type == 'testCase.skipped') {return;}
        if (type == 'testCase.finished') {
            currentTestCaseId[1](data.testCaseId)
            if (typeof data.testResult != 'undefined') {
                try {
                    const {success,message} = data.testResult
                    updateExecutionResult(runningStats,data.executionId,success,message)
                } catch (e) {
                    console.error('Failed to destruct test result', e)
                }
            }
        }
        console.debug('Unhandled Execution event',type,data)
    }
    const reportResult = (executionId,result) => {
        console.info('Todo: merge in the effects of running an individual test case', executionId, result)
    }

    return <div>
        <ComponentSection header={header}>
            <fieldset>
                <FormField label="Summary">{testRun.summary}</FormField>
                <FormField label="Test Plan">
                    <Link href={testPlanUrl}>{testRun.plan.value}</Link>
                </FormField>
                <FormField label="Result">{executionData[0].successRate}</FormField>
            </fieldset>
        </ComponentSection>

        <div id="layout-split">
            <ComponentSection header="Run">
                <fieldset>
                    <FormField label="Current case">{currentTestCaseId[0] != null ? currentTestCaseId[0] : 'None'}</FormField>
                    <FormField label="Progress">
                        <div style={{width:'100%',backgroundColor:'#353232',borderRadius:'15px',overflow:'hidden',border:'1px solid black',height:'1.3em',display:'flex',justifyContent:'start'}}>
                            <div style={{width:runningStats.passedPerc[0],backgroundColor:'#429542'}}></div>
                            <div style={{width:runningStats.failedPerc[0],backgroundColor:'#b93030'}}></div>
                        </div>
                        <div style={{textAlign:'center'}}>{runningStats.remaining[0]}</div>
                    </FormField>
                    <FormField label="Last Updated">{runningStats.lastUpdate}</FormField>
                </fieldset>
                <ExecutionRunner src={`/api/runs/${testRun.plan.value}/${testRun.id}`} events={executionEvents} limit={10} />
            </ComponentSection>
        
            <Executions id="executions-other" header="Other" list={executionData[0].other} reportResult={reportResult} />
            <Executions id="executions-failed" header="Failed" list={executionData[0].failed} reportResult={reportResult} />
            <Executions id="executions-passed" header="Passed" list={executionData[0].passed} reportResult={reportResult} />
        </div>

        <ActionBar>
            <Link href={testRunUrl}>Test Run</Link>
            <ActionButton action={refresh} text="Refresh" className={[buttonState[0]]} />
        </ActionBar>
    </div>
}