
import child_process from 'child_process'
import * as fs from 'fs'

const encoder = new TextEncoder()

const userPath = process.env.HOME+'/puppeteer'
  
export function runTest(testCaseId,executionId=null) {
    const args = [testCaseId]
    if ((executionId ?? null) != null) args.push(`executionId=${executionId}`)
    return new Response(execute('runTest', args), {
        headers: { 'Content-Type': 'text/plain' }
    })
}

function execute(scriptName, args) {
    if (!fs.existsSync(userPath+'/'+scriptName+'.js')) {
        throw new Error(scriptName+'.js not found for user')
    }
    
    const processOptions = {
        cwd: userPath,
        // env: {} ,
        silent: true,
        timeout: 1000 * 60 * 5,// 5 minutes
    }
    let process
    let bufferString = ''

    const flush = (controller) => {
        if (bufferString.length == 0) return
        if (controller.finished) return
        controller.enqueue(encoder.encode(bufferString))
        bufferString = ''
    }
    const append = (msg,controller) => {
        if (controller.finished) return
        bufferString += JSON.stringify(msg)+'\n'
        flush(controller)
    }

    return new ReadableStream({
        async start(controller) {
            console.debug('Start streaming')
            process = child_process.fork(scriptName+'.js', args, processOptions)
            process.on('error', e => console.error('Error:', e))
            process.on('close', code => {
                if (code == 0) {
                    append('Finished',controller)
                    controller.close()
                    return
                }
                console.info('Crashed')
                append('Crashed',controller)
                controller.close()
            })
            // We don't need to worry about stdout anymore
            // process.stdout.on('data', data => append(data,controller))
            process.on('message', data => append(data,controller))
        },
        async pull(controller) {
            if (!process) return
            flush(controller)
        },
        async cancel() {
            // let it run
            return
            // if (!process) return
            // process.kill()
            // console.debug('Process killed')
        }
    })
}
