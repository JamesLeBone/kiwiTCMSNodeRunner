
import { useState,useEffect,cloneElement,useRef } from 'react';
const textDecoder = new TextDecoder('utf-8')


function ExecutionMessage({type,message}) {
    // Handle case where message is not an array
    const messageArray = Array.isArray(message) ? message : [message]
    
    return <div>
        <span className="messageType">{type}</span>
        <div>
            {messageArray.map(( msg, index ) => {
                const msgText = typeof msg == 'object' ? JSON.stringify(msg,null,4) : msg
                return <div key={index} className="messageText">{msgText}</div>
            })}
        </div>
    </div>
}
function ExecutionImage({content}) {
    const src = 'data:image/png;base64,'+content
    return <div className='executionImageContainer'>
        <img src={src} alt="Execution image" style={{maxWidth:'80vw'}} />
    </div>
}
function TestResult({result}) {
    const {success,reason,settings} = result
    console.info(result)
    if (success) {
        return <div className='testResult success'>SUCCESS!</div>
    }
    const reasonText = typeof reason == 'object' ? JSON.stringify(reason,null,4) : reason

    return <div className='testResult failure'>
        <div>FAILURE!</div>
        {reason && <div>Reason: <pre>{reasonText}</pre></div>}
        {settings && <div>Settings: <pre>{JSON.stringify(settings,null,4)}</pre></div>}
    </div>
}


const getComponent = (type, data) => {
    switch (type) {
        case 'warning':
        case 'debug':
        case 'info':
        case 'error':
        case 'success':
            return <ExecutionMessage type={type} message={data} />
        case 'image':
            return <ExecutionImage content={data} />
        case 'testResult.finished':
            return <TestResult result={data} />
    }
    console.error('Unknown message type', type, 'with data:', data)
    return <ExecutionMessage type="Error" message={[`Unknown message type: ${type}`, JSON.stringify(data)]} />
}

const pushResult = (line, runState) => {
    let result, type, data
    try {
        result = JSON.parse(line)
        type = result.type
        data = result.data
        
        if (!type) {
            console.warn('Missing type in result:', result)
            return
        }

        if (type == 'event') {
            type = result.eventName
            data = result
        }
        if (typeof data === 'undefined') {
            console.warn('Missing data in result:', result, line)
            return
        }
        
        const component = getComponent(type, data)
        const idx = runState.nextResultIdx()
        const resultWithKey = cloneElement(component, {
            key: `exec-${runState.runId}-${idx}`,
        })
        runState.addResult(resultWithKey)
        
    } catch (e) {
        console.error('Error parsing line:', line, e)
        // Create an error component for unparseable lines
        const errorComponent = <ExecutionMessage type="parse-error" message={[`Failed to parse: ${line}`, e.message]} />
        const idx = runState.nextResultIdx()
        const resultWithKey = cloneElement(errorComponent, {
            key: `exec-error-${runState.runId}-${idx}`,
        })
        runState.addResult(resultWithKey)
    }
}

async function execute(path, icon, runState) {
    if (runState.isRunning) {
        console.warn('Already running, please wait until the current run is complete.')
        return
    }
    
    let reader = null
    
    try {
        icon.running()
        runState.restart()
        
        // fetch, reader = part of the browser API
        const streamingResponse = await fetch(`/api/`+path)
        
        if (!streamingResponse.ok) {
            throw new Error(`HTTP ${streamingResponse.status}: ${streamingResponse.statusText}`)
        }
        
        reader = streamingResponse.body?.getReader()
        
        if (!reader) {
            throw new Error('No reader available, response was not a stream')
        }

        let streamBuffer = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
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
                    pushResult(line, runState)
                    continue
                }
                // console.debug('Incomplete',line)
                streamBuffer = line
                continue
            }
        }
        
    } catch (error) {
        console.error('Stream execution failed:', error)
        // Add error message to results
        const errorComponent = <ExecutionMessage type="execution-error" message={[error.message]} />
        const idx = runState.nextResultIdx()
        const resultWithKey = cloneElement(errorComponent, {
            key: `exec-error-${runState.runId}-${idx}`,
        })
        runState.addResult(resultWithKey)
    } finally {
        // Always clean up
        if (reader) {
            try {
                await reader.cancel()
            } catch (e) {
                console.warn('Error cancelling reader:', e)
            }
        }
        icon.clear()
        runState.finish()
    }
}

const useIcon = () => {
    const stdIcon = 'fa fa-bolt'
    const [buttonIcon,setIcon] = useState(stdIcon)
    return {
        clear: () => setIcon(stdIcon),
        running: () => setIcon(stdIcon+' fa-spin'),
        icon: buttonIcon,
    }
}

const useRunState = () => {
    const [results,setResults] = useState([])
    const [runId,setRunId] = useState(0)
    const [status,setStatus] = useState('idle')
    const resultIdxRef = useRef(0) // Use ref instead of state for counter
    
    return {
        runId,
        results,
        isRunning: status == 'running',
        restart: () => {
            const newRunId = runId + 1
            setRunId(newRunId)
            setStatus('running')
            resultIdxRef.current = 0 // Reset counter
            setResults([]) // Clear previous results
        },
        clear: () => {
            setStatus('idle')
            resultIdxRef.current = 0
            setResults([])
        },
        finish: () => setStatus('idle'),
        nextResultIdx: () => {
            // Increment and return the new value
            resultIdxRef.current += 1
            return resultIdxRef.current
        },
        addResult: component => {
            setResults(prev => [...prev, component])
        }
    }
}

// executions/1/3542
export const useStreamRunner = (path) => {
    const runState = useRunState()
    const icon = useIcon()
    
    return {
        icon: icon.icon,
        isRunning: runState.isRunning,
        execute: () => execute(path, icon, runState),
        results: runState.results,
        clear: runState.clear
    }
}
