'use client'

import { useState,cloneElement } from 'react';

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { IconButton } from '@/components/IconButton'

import './scriptExecution.css'

const iconDef = {
    'info': 'fa fa-info',
    'debug': 'fa fa-bug',
    'error': 'fa fa-exclamation-triangle',
    'warning': 'fa fa-exclamation-circle',
    'success': 'fa fa-check',
}
function Icon({type}) {
    const icon = iconDef[type] || ''
    return <i className={icon} />
}

function ExecutionMessage({type,message}) {
    if (typeof message == 'undefined') return <></>
    return <div className={`message message-${type}`}>
        <Icon type={type} />
        <div>
        {Array.isArray(message) ? message.map(( msg, index ) => {
            const msgText = typeof msg == 'object' ? JSON.stringify(msg,null,4) : msg
            return <div key={index} className="messageText">{msgText}</div>
        }) : message}
        </div>
    </div>
}
function ExecutionImage({content}) {
    const src = 'data:image/png;base64,'+content
    return <div>
        <img src={src} alt="Execution image" style={{maxWidth:'80vw'}} />
    </div>
}

let runId = 0

const getComponent = (type, data) => {
    switch (type) {
        case 'data':
            if (data.type == 'data') {
                console.error('Recurisive data', data)
                return <span>Data</span>
            }
            return getComponent(data.type, data.data)
        case 'warning':
        case 'debug':
        case 'info':
        case 'error':
        case 'success':
            return <ExecutionMessage type={type} message={data} />
        case 'image':
            return <ExecutionImage content={data} />
    }
    return <ExecutionMessage type="Error" message={JSON.stringify(result)} />
}

const useExecutor = (eventListener,src,limit=-1,stdIcon) => {
    let runId = 0
    let resultIdx = 0
    const textDecoder = new TextDecoder('utf-8')
    const [executionResults, setExecutionResults] = useState([])
    const iconState = useState(stdIcon)
    const [buttonIcon,setIcon] = iconState
    const i = (icon) => setIcon('executionButton '+icon)
    const testResult = useState('')
    const [lastResult, setLastResult] = testResult

    const pushResult = (line) => {
        let result,type,data
        try {
            result = JSON.parse(line)
            type = result.type
            data = result.data
            if (typeof data == 'undefined') {
                data = result.testResult ?? result
            }
            if (typeof data.testResult != 'undefined') {
                setLastResult(data.testResult.success ? 'success' : 'failed')
            }
        } catch (e) {
            console.error('Error parsing line:', line, e)
        }
        if (type == 'event') {
            // Yay !  - this should be {type, testcaseId, execution, updateResult, testresult}
            // that we can update the screen with
            console.info('Event', data)
            if (typeof eventListener == 'function') {
                if (typeof data.eventName == 'undefined') {
                    if (typeof data.success == 'boolean') {
                        data.eventName = 'testResult.finish'
                    } else {
                        // This would be an error but I don't have full push perms to puppeteer to fix it.
                        console.debug('No eventName in data')
                        data.eventName = 'unknownEvent'
                    }
                }
                eventListener(data.eventName,data)
            }
            return
        }
        const computedResult = {type, data}
        setExecutionResults(prev => {
            const newList = [computedResult, ...prev]
            if (limit == -1) return newList
            if (newList.length > limit) {
                newList.splice(0, limit)
            }
            return newList
        })
    }
    const replay = async () => {
        const matchx = new RegExp(`(executionButton )?${stdIcon}`)
        if (!buttonIcon.match(matchx)) {
            console.error('Already running',buttonIcon,stdIcon,'executionButton '+stdIcon)
            return
        }
        runId++
        resultIdx = 0
        i(stdIcon+' fa-spin')
        setExecutionResults([])
        // fetch, reader = part of the browser API
        const streamingResponse = await fetch(src)
        const reader = streamingResponse.body?.getReader()
        if (!reader) {
            console.error('No reader available, was it really a stream?')
            return
        }
        let streamBuffer = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                resultIdx = 0
                i(stdIcon)
                break
            }
            const chunk = textDecoder.decode(value)
            // console.info(chunk)
            // console.info('chunkLength', chunk.length)
            if (chunk.length == 0) continue
            // Contents can only be a string coming in, but chunks are split by new lines.
            const lines = chunk.split('\n')
            for (let line of lines) {
                // Don't process empty lines
                if (line.length == 0) continue
                // console.debug('buffer',streamBuffer.length)
                // Read-in the current buffer to the start of the next incoming line
                if (streamBuffer.length > 0) {
                    line = streamBuffer + line
                    streamBuffer = ''
                }
                // console.debug('line', line.length)
                // If the line doesn't end with a }, it is not complete.
                // We need to buffer it until we get a complete line.
                // console.debug(line, typeof line, line.trim().length)
                const parseable = line[line.length-1] == '}'
                if (parseable) {
                    // We have a complete line, so we can process it.
                    // console.debug('Parseable',line)
                    pushResult(line)
                    continue
                }
                // console.debug('Incomplete',line)
                streamBuffer = line
                continue
            }
        }
        i(stdIcon)
        console.info('Done')
    }
    return {
        replay,
        executionResults,
        iconState,
        testResult
    }
}

const stdIcon = 'fa fa-bolt'

export function ExecuteButton({src,events,children,icon=stdIcon}) {
    const executor = useExecutor(events,src,-1,icon)
    const body = children || ''
    // TODO: test result isn't coming through
    return <IconButton title="Execute" action={executor.replay} className={executor.iconState[0]}>
        {body + executor.testResult[0]}
    </IconButton>
}

export function ExecutionRunner({src,events,limit=-1}) {
    const [buttonIcon,setIcon] = useState(stdIcon)
    const [executionResults, setExecutionResults] = useState([])
    const textDecoder = new TextDecoder('utf-8')
    let resultIdx = 0

    // TODO: get this to use useExecutor and use useEffect to 
    // convert the data into visible components

    const pushResult = (line) => {
        let result,type,data
        try {
            result = JSON.parse(line)
            type = result.type
            data = result.data
        } catch (e) {
            console.error('Error parsing line:', line, e)
        }
        if (type == 'event') {
            // Yay !  - this should be {type, testcaseId, execution, updateResult, testresult}
            // that we can update the screen with
            // console.info('Event', data.eventName, data)
            if (typeof events == 'function') {
                if (typeof data.eventName == 'undefined') {
                    if (typeof data.success == 'boolean') {
                        data.eventName = 'testResult.finish'
                    } else {
                        // This would be an error but I don't have full push perms to puppeteer to fix it.
                        console.debug('No eventName in data')
                        data.eventName = 'unknownEvent'
                    }
                }
                events(data.eventName,data)
            }
            return
        }

        const component = getComponent(type, data)
        const resultWithKey = cloneElement(component, {
            key: `exec-${runId}-${resultIdx++}`,
        })
        setExecutionResults(prev => {
            const newList = [resultWithKey, ...prev]
            if (limit == -1) {
                return newList
            }
            if (newList.length > limit) {
                newList.splice(0, limit)
            }
            return newList
        })
    }

    const replay = async () => {
        if (buttonIcon != stdIcon) {
            console.error('Already running')
            return
        }
        runId++
        resultIdx = 0
        setIcon(stdIcon+' fa-spin')
        setExecutionResults([])
        
        // Signal the start of a new run
        if (typeof events == 'function') {
            events('testRun.start', {})
        }
        
        // fetch, reader = part of the browser API
        const streamingResponse = await fetch(src)
        const reader = streamingResponse.body?.getReader()
        
        if (reader) {
            let streamBuffer = ''
            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    setIcon(stdIcon)
                    break
                }
                const chunk = textDecoder.decode(value)
                // console.info('chunkLength', chunk.length)
                if (chunk.length == 0) continue
                // Contents can only be a string coming in, but chunks are split by new lines.
                const lines = chunk.split('\n')
                for (let line of lines) {
                    // Don't process empty lines
                    if (line.length == 0) continue
                    // console.debug('buffer',streamBuffer.length)
                    // Read-in the current buffer to the start of the next incoming line
                    if (streamBuffer.length > 0) {
                        line = streamBuffer + line
                        streamBuffer = ''
                    }
                    // console.debug('line', line.length)
                    // If the line doesn't end with a }, it is not complete.
                    // We need to buffer it until we get a complete line.
                    // console.debug(line, typeof line, line.trim().length)
                    const parseable = line[line.length-1] == '}'
                    if (parseable) {
                        // We have a complete line, so we can process it.
                        // console.debug('Parseable',line)
                        pushResult(line)
                        continue
                    }
                    // console.debug('Incomplete',line)
                    streamBuffer = line
                    continue
                }
            }
        } else {
            console.error('No reader available, was it really a stream?')
        }
        
        if (typeof events == 'function') {
            events('done',{status:'done'})
        }
    }
    
    return <ActionBar>
        <IconButton title="Execute" action={replay} className={buttonIcon}>Execute</IconButton>
        <div className='executionRun'>
            {executionResults}
        </div>
    </ActionBar>
}

export const remotePaths = {
    test: (testId) => `/api/testCase/${testId}`,
    execution: (testId,executionId) => `/api/executions/${testId}/${executionId}`,
    run: (planId,runId=null) => runId == null ? `/api/runs/${planId}` : `/api/runs/${planId}/${runId}`
}

const useStats = (failed=0,passed=0,other=0) => {
    const stats = useState({
        failed: failed,
        passed: passed,
        other: other
    })
    const lastUpdated = useState('')
    const total = useState( failed + passed + other )
    const getPerc = (v, currentTotal) => currentTotal == 0 ? '0%' : Math.ceil(v / currentTotal * 100) + '%'

    const passedPerc = useState(getPerc(passed, failed + passed + other))
    const failedPerc = useState(getPerc(failed, failed + passed + other))
    const remaining = useState((failed + other) + ' / ' + (failed + passed + other))

    const updatePercentages = (currentStats, currentTotal) => {
        const completed = currentStats.passed + currentStats.failed
        const remainingCount = currentTotal - completed
        passedPerc[1](getPerc(currentStats.passed, currentTotal))
        failedPerc[1](getPerc(currentStats.failed, currentTotal))
        remaining[1](remainingCount + ' / ' + currentTotal)
    }

    return {
        setTotal: (newTotal) => {
            console.debug('useStats.setTotal() called with:', newTotal)
            total[1](newTotal)
            updatePercentages(stats[0], newTotal)
        },
        remaining,
        passedPerc,
        failedPerc,
        reset: () => {
            console.debug('useStats.reset() called - resetting all stats to 0')
            const resetStats = { failed: 0, passed: 0, other: 0 }
            stats[1](resetStats)
            total[1](0)
            passedPerc[1]('0%')
            failedPerc[1]('0%')
            remaining[1]('0 / 0')
        },
        pass: () => {
            console.debug('useStats.pass() called - updating progress')
            const newPassed = stats[0].passed + 1
            const newStats = {...stats[0], passed: newPassed}
            stats[1](newStats)
            updatePercentages(newStats, total[0])
        },
        fail: () => {
            console.debug('useStats.fail() called - updating progress')
            const newFailed = stats[0].failed + 1
            const newStats = {...stats[0], failed: newFailed}
            stats[1](newStats)
            updatePercentages(newStats, total[0])
        },
        update: () => {
            const now = new Date()
            lastUpdated[1](now.toLocaleString())
        },
        lastUpdate: lastUpdated[0]
    }
}

function ProgressBar({stats}) {
    return <FormField label="Progress">
        <div style={{width:'100%',backgroundColor:'#353232',borderRadius:'15px',overflow:'hidden',border:'1px solid black',height:'1.3em',display:'flex',justifyContent:'start'}}>
            <div style={{width:stats.passedPerc[0],backgroundColor:'#429542'}}></div>
            <div style={{width:stats.failedPerc[0],backgroundColor:'#b93030'}}></div>
        </div>
        <div style={{textAlign:'center'}}>{stats.remaining[0]}</div>
    </FormField>
}

export function TestPlanRunner({planId,runId=null}) {
    const src = useState(remotePaths.run(planId))
    const runIdState = useState(runId)
    const runningStats = useStats()
    const currentTestCaseId = useState('')

    const executionEvents = (type,data) => {
        // testCase.skipped : {testCaseId,executionId}
        // testCase.finished : {testCaseId,executionId,testResult}
        // testCase.start : {testCaseId}
        // testRun.progress : {progress: {idx, total}, testRunId}
        // testRun.finished
        
        console.debug('TestPlanRunner.executionEvents:', type, data)
        
        runningStats.update()
        
        if (type == 'done') { // This comes from ScriptExecution
            // refresh()
            return
        }
        
        if (type == 'testRun.start' || (type == 'testRun.progress' && data.progress?.idx === 0)) {
            // Reset stats when a new test run starts
            console.debug('New test run starting - resetting stats')
            runningStats.reset()
            if (data.progress?.total) {
                runningStats.setTotal(data.progress.total)
            }
            return
        }
        
        if (type == 'testRun.progress') {
            console.debug('Test run progress:', data.progress)
            if (data.progress && typeof data.progress.total !== 'undefined') {
                runningStats.setTotal(data.progress.total)
            }
            return
        }
        
        if (type == 'testCase.start') {
            currentTestCaseId[1](data.testCaseId)
            return
        }
        
        if (type == 'testCase.skipped') {
            // Could increment other/skipped count here if needed
            return
        }
        if (type == 'testCase.skipped') {return;}
        if (type == 'testCase.finished') {
            currentTestCaseId[1](data.testCaseId)
            if (typeof data.testResult != 'undefined') {
                try {
                    const {success,message} = data.testResult
                    console.debug('Processing test result:', success ? 'PASS' : 'FAIL', message)
                    if (success) {
                        runningStats.pass()
                    } else {
                        runningStats.fail()
                    }
                    // updateExecutionResult(runningStats,data.executionId,success,message)
                } catch (e) {
                    console.error('Failed to destruct test result', e)
                }
            }
            return
        }
        
        console.debug('Unhandled Execution event',type,data)
    }

    return <ComponentSection header="Run">
        <fieldset>
            <FormField label="Current case">{currentTestCaseId[0]}</FormField>
            <ProgressBar stats={runningStats} />
            <FormField label="Last Updated">{runningStats.lastUpdate}</FormField>
        </fieldset>
        <ExecutionRunner src={src[0]} events={executionEvents} limit={10} />
    </ComponentSection>
}