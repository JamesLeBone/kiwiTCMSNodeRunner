'use client'

import { useState,cloneElement } from 'react';

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { IconButton } from '@/components/IconButton'
import { ActionBar } from '@/components/Actions'
import { api as remotePaths } from '@lib/Paths'

import './scriptExecution.css'

type iconType = 'info' | 'debug' | 'error' | 'warning' | 'idle' | 'success' | 'running'
type messageType = 'data' | 'warning' | 'debug' | 'info' | 'error' | 'success' | 'image'
/**
 * A message that reflects output from the execution.
 * This is the type we pass to the component for rendering.
 */
type executionMessage = {
    icon: iconType
    message: string
}
type eventHandler = (eventName: string, data: Record<string, any>) => void

const iconDef: {[key in iconType]: string} = {
    info: 'fa fa-info',
    debug: 'fa fa-bug',
    error: 'fa fa-exclamation-triangle',
    warning: 'fa fa-exclamation-circle',
    success: 'fa fa-check',
    running: 'fa fa-spinner fa-spin',
    idle: 'fa fa-bolt'
}
function Icon({type}: {type: iconType}) {
    const icon = iconDef[type] ?? 'fa fa-info'
    return <i className={icon} />
}

type eventOccuranceIndicator = {
    eventName: string
    success: boolean
}

/**
 * When reading from the raw output,
 * we parse the string.
 * if it's an object we set it to data,
 * otherwise we set it to a string message.  
 * 
 * The type is determined by the type field in the JSON, or set to info by default.
 */
type testOutputSegment = {
    testResult?: Record<string, any>
    stringMessage?: string
    data?: object
    event?: eventOccuranceIndicator
    type: messageType
}

const parseMessage = (message:any) : executionMessage | null => {
    if (typeof message == 'undefined') return null
    if (typeof message == 'string') return { icon: 'info', message }
    if (Array.isArray(message)) {
        message = message.map( msg => {
            if (typeof msg == 'object') {
                return JSON.stringify(msg,null,4)
            }
            return msg
        }).join('\n')
        return { icon: 'info', message }
    } else if (typeof message == 'object') {
        // Todo: try to look for something that indicates type/icon
        return {
            icon: 'info',
            message:JSON.stringify(message,null,4)
        }
    }
    try {
        return {
            icon: 'info',
            message: message.toString()
        }
    } catch (e) {
        console.warn('Unable to parse message', message, e)
        return null
    }
}

type messageProps = {
    type: string
    message: string | string[] | object
}
/**
 * Component to display a message with an icon based on the type of message.
 */
function ExecutionMessage({type,message}: messageProps) {
    if (typeof message == 'undefined') return <></>
    const parsedMessage = parseMessage(message)
    if (parsedMessage == null) return <></>

    return <div className={`message message-${type}`}>
        <Icon type={ parsedMessage.icon } />
        <div>{parsedMessage.message}</div>
    </div>
}
function ExecutionImage({content}: {content:string}) {
    const src = 'data:image/png;base64,'+content
    return <div>
        <img src={src} alt="Execution image" style={{maxWidth:'80vw'}} />
    </div>
}

function getComponent(result: testOutputSegment) {
    const stringValue = result.stringMessage ? result.stringMessage : JSON.stringify(result.data,null,4)

    if (result.type == 'image' && typeof result.data == 'string') {
        return <ExecutionImage content={result.data} />
    }

    return <ExecutionMessage type={result.type} message={stringValue} />
}

function ExecutionResults({results}: {results: testOutputSegment[]}) {
    return <div className='executionResults'>
        {results.map((result, index) => (
            <div key={index}>
                {getComponent(result)}
            </div>
        ))}
    </div>
}

const parseLine = (line: string) : testOutputSegment => {
    const ro: testOutputSegment = {
        type: 'info'
    }
    let parsed : any

    try {
        parsed = JSON.parse(line)
        if (typeof parsed != 'object') {
            ro.stringMessage = line
            return ro
        }
    } catch (e) {
        ro.stringMessage = line
        return ro
    }
    const parsedObject = parsed as Record<string, any>
    ro.data = parsed
    if (parsedObject.type && typeof parsedObject.type == 'string') {
        const ptype = parsedObject.type.toLowerCase()
        if (['data','warning','debug','info','error','success','image'].includes(ptype)) {
            ro.type = ptype as messageType
        }
    }

    if (typeof parsedObject.testResult == 'object' && typeof parsedObject.testResult.hasOwnProperty('testResult') && typeof parsedObject.testResult.testResult == 'object') {
        const testResult = parsedObject.testResult as Record<string, any>
        ro.testResult = testResult
        // Validate the test result has the expected fields
        if (typeof testResult.status == 'boolean') {
            ro.type = testResult.status ? 'success' : 'error'
        }
    }

    if (typeof parsedObject.eventName == 'string' && typeof parsedObject.success == 'boolean') {
        ro.event = { eventName: parsedObject.eventName, success: parsedObject.success }
    }

    return ro
}

const useExecutor = (eventListener: eventHandler,src: string,limit=-1,defaultIcon?:iconType) => {
    // Number of times run has been started
    let runId = 0
    const inactiveIcon: iconType = defaultIcon ?? stdIcon

    const textDecoder = new TextDecoder('utf-8')
    const [executionResults, setExecutionResults] = useState<testOutputSegment[]>([])
    const iconState = useState<iconType>(inactiveIcon)
    const [buttonIcon,setIcon] = iconState

    const [executionState, setExecutionState] = useState<'idle'|'running'|'completed'>('idle')
    const [testResult, setTestResult] = useState<null|boolean>(null)
    
    const pushResult = (line: string) => {
        const ro = parseLine(line)
        if (ro.event) {
            eventListener(ro.event.eventName, { success: ro.event.success })
        }

        setExecutionResults(prev => {
            const newList = [ro, ...prev]
            if (limit == -1) return newList
            if (newList.length > limit) {
                newList.splice(0, limit)
            }
            return newList
        })
    }
    const replay = async () => {
        if (executionState == 'running') {
            throw new Error('Already running')
        }
        
        runId++
        setIcon('running')
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
                setIcon(inactiveIcon)
                console.info('Stream complete')
                break
            }
            const chunk = textDecoder.decode(value)
            if (chunk.length == 0) continue
            // Contents can only be a string coming in, but chunks are split by new lines.
            const lines = chunk.split('\n')
            for (let line of lines) {
                // Don't process empty lines
                if (line.length == 0) continue
                // If we have a buffer from the previous chunk
                // prepend it to the current line and clear the buffer.
                if (streamBuffer.length > 0) {
                    line = streamBuffer + line
                    streamBuffer = ''
                }

                // If the line doesn't end with a }, it is not complete.
                // We need to buffer it until we get a complete line and wait
                // for the next chunk to come in.
                const parseableStart = line[0] == '[' || line[0] == '{'
                const parseableEnd = line[line.length-1] == '}'
                if (parseableStart && parseableEnd) {
                    pushResult(line)
                    continue
                }
                // We have a string message that is not JSON, we can push it as is.
                if (line.includes(' ') && !parseableStart) {
                    pushResult(line)
                    continue
                }
                // Attempt to continue to buffering.
                streamBuffer = line
                continue
            }
        }
        // We have an artifact in the buffer that we haven't been able to parse
        // push the rest of the buffer as a string.
        if (streamBuffer.length > 0) {
            for (const line of streamBuffer.split('\n')) {
                if (line.length == 0) continue
                pushResult(line)
            }
        }

        setIcon(inactiveIcon)
        console.info('Done')
    }
    return {
        replay,
        buttonIcon,
        executionResults,
        iconState,
        testResult
    }
}

const stdIcon: iconType = 'idle'

type executeButtonProps = {
    src: string
    eventHandler: eventHandler
    children?: React.ReactNode
    defaultIcon?: iconType
}
export function ExecuteButton({src,eventHandler,children,defaultIcon=stdIcon}: executeButtonProps) {
    const executor = useExecutor(eventHandler,src,-1,defaultIcon)
    const body = children || ''
    return <IconButton title="Execute" onClick={executor.replay} className={executor.iconState[0]}>
        {body}
    </IconButton>
}

type executionRunnerProps = {
    src: string
    events: eventHandler
    limit?: number
}
export function ExecutionRunner({src,events,limit=-1}: executionRunnerProps) {
    const executor = useExecutor(events,src,limit)
    
    return <ActionBar>
        <IconButton title="Execute" onClick={executor.replay} className={executor.iconState[0]}>Execute</IconButton>
        <ExecutionResults results={executor.executionResults} />
    </ActionBar>
}

type runStats = {
    failed: number
    passed: number
    other: number
}
const useStats = (failed=0,passed=0,other=0) => {
    const stats = useState<runStats>({
        failed: failed,
        passed: passed,
        other: other
    })
    const lastUpdated = useState('')
    const total = useState( failed + passed + other )
    const getPerc = (v:number, currentTotal:number) => currentTotal == 0 ? '0%' : Math.ceil(v / currentTotal * 100) + '%'

    const passedPerc = useState(getPerc(passed, failed + passed + other))
    const failedPerc = useState(getPerc(failed, failed + passed + other))
    const remaining = useState((failed + other) + ' / ' + (failed + passed + other))

    const updatePercentages = (currentStats: runStats, currentTotal: number) => {
        const completed = currentStats.passed + currentStats.failed
        const remainingCount = currentTotal - completed
        passedPerc[1](getPerc(currentStats.passed, currentTotal))
        failedPerc[1](getPerc(currentStats.failed, currentTotal))
        remaining[1](remainingCount + ' / ' + currentTotal)
    }

    return {
        setTotal: (newTotal: number) => {
            console.debug('useStats.setTotal() called with:', newTotal)
            total[1](newTotal)
            updatePercentages(stats[0], newTotal)
        },
        remaining,
        passedPerc,
        failedPerc,
        reset: () => {
            console.debug('useStats.reset() called - resetting all stats to 0')
            const resetStats: runStats = { failed: 0, passed: 0, other: 0 }
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

function ProgressBar({stats} : {stats: ReturnType<typeof useStats>}) {
    return <FormField label="Progress">
        <div style={{width:'100%',backgroundColor:'#353232',borderRadius:'15px',overflow:'hidden',border:'1px solid black',height:'1.3em',display:'flex',justifyContent:'start'}}>
            <div style={{width:stats.passedPerc[0],backgroundColor:'#429542'}}></div>
            <div style={{width:stats.failedPerc[0],backgroundColor:'#b93030'}}></div>
        </div>
        <div style={{textAlign:'center'}}>{stats.remaining[0]}</div>
    </FormField>
}

type testPlanRunnerProps = {
    planId: number
    runId?: number
}
export function TestPlanRunner(props: testPlanRunnerProps) {
    const src = useState(remotePaths.run(props.planId, props.runId))
    // const runIdState = useState(runId)
    const runningStats = useStats()
    const currentTestCaseId = useState('')

    const executionEvents = (type: string, data: any) => {
        console.debug('TestPlanRunner.executionEvents:', type, data)
        runningStats.update()
        if (type == 'done') { // This comes from ScriptExecution
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