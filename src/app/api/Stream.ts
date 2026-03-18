
import child_process, { Serializable } from 'child_process'
import * as fs from 'fs'

const encoder = new TextEncoder()

const userPath = process.env.HOME+'/puppeteer'

type testExecutionArugments = {
    testCaseId:number
    executionId?:number
}
  
/**
 * Entry point API request.
 */
export function runTest(testArgs: testExecutionArugments) {
    return new Response(execute('runTest', testArgs), {
        headers: { 'Content-Type': 'text/plain' }
    })
}

type resultState = 'notInitialized' | 'running' | 'finished' | 'crashed' | 'cancelled'

function execute(scriptName:string, args: testExecutionArugments) {
    if (!fs.existsSync(userPath+'/'+scriptName+'.js')) {
        throw new Error(scriptName+'.js not found for user')
    }
    // let finished = false
    
    const processOptions = {
        cwd: userPath,
        // env: {} ,
        silent: true,
        timeout: 1000 * 60 * 5,// 5 minutes
    }
    let process: child_process.ChildProcess
    const messages = []
    let bufferString = ''
    let resultState: resultState = 'notInitialized'

    /**
     * This will flush the buffered contents to the stream and clear the buffer. 
     * 
     */
    const flush = (controller: ReadableStreamDefaultController) => {
        if (bufferString.length == 0) return
        // if (finished) return
        controller.enqueue(encoder.encode(bufferString+'\n'))
        bufferString = ''
    }
    // Messages output will be denoted by a leading ':' character
    const appendMessage = (msg: Serializable, controller: ReadableStreamDefaultController) => {
        bufferString += ':'+JSON.stringify(msg)
        flush(controller)
    }
    const appendString = (msg: Serializable, controller: ReadableStreamDefaultController) => {
        bufferString += msg
        flush(controller)
    }

    return new ReadableStream({
        async start(controller) {
            resultState = 'running'
            process = child_process.fork(scriptName+'.js', [JSON.stringify(args)], processOptions)
            process.on('error', e => console.error('StreamError:', e))
            process.on('close', code => {
                // finished = true
                resultState = code == 0 ? 'finished' : 'crashed'
                controller.close()
            })
            process.stdout?.on('data', data => appendString(data,controller))
            process.on('message', data => appendMessage(data, controller))
        },
        // async pull(controller) {},
        async cancel() {
            resultState = 'cancelled'
            if (!process) return
            // finished = true
            process.kill()
        }
    })
}
