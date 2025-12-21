import child_process from 'child_process'
import * as Auth from '@server/Auth'
import * as Users from '@server/lib/Users'
import * as Credentials from '@server/lib/Credentials'

const encoder = new TextEncoder()
   
function execute(command,args,env={}) {
    const processOptions = {
        cwd: '/home/james/puppeteer',
        env: {...env, ...process.env},
        silent: true,
        timeout: 1000 * 60 * 5,// 5 minutes
    }
    let childProcess
    const buffer = []

    const flush = (controller) => {
        if (buffer.length == 0) return
        if (controller.finished || controller.closed) {
            console.debug('Controller closed, dropping buffer', buffer)
            childProcess.kill()
            return
        }

        while (buffer.length > 0) {
            const msg = buffer.shift()
            const bufferString = JSON.stringify(msg)+'\n'
            // process.stdout.write('.')
            process.stdout.write(bufferString)
            controller.enqueue(encoder.encode(bufferString))
        }
    }
    const append = (msg,messageType,controller) => {
        if (controller.finished || controller.closed) {
            childProcess.kill()
            return
        }
        const emsg = {
            data: msg,
            type:messageType,
        }
        buffer.push(emsg)
        flush(controller)
    }

    return new ReadableStream({
        async start(controller) {
            console.debug('Start streaming', command, args)
            childProcess = child_process.fork(command, args, processOptions)
            childProcess.on('error', e => {
                console.error('Error:', e)
            })
            childProcess.on('close', code => {
                if (code == 0) {
                    append('Test finished','info',controller)
                    controller.close()
                    return
                }
                console.info('Test crashed')
                append('Test crashed','info',controller)
                controller.close()
            })
            // for when they use console.*
            childProcess.stdout.on('data', data => {
                append(data.toString(),'info',controller)
            })
            // for when they use console.error
            childProcess.stderr.on('data', data => {
                append(data.toString(),'error',controller)
            })
            // for when they use process.send
            childProcess.on('message', data => {
                if (typeof data.type == 'string') {
                    // The child process told us what type of data it is
                    const val = data.data ?? data
                    append(val, data.type,controller)
                    return
                }
                append(data,'data',controller)
            })
        },
        async pull(controller) {
            if (!childProcess) return
            flush(controller)
        },
        async cancel() {
            if (!childProcess) return
            childProcess.kill()
            // console.debug('Process killed')
        }
    })
}

const creds = () => Auth.currentUser().then(usr => {
    if (!usr) return {}
    console.debug('Current user:', usr)
    return Credentials.get(usr.userId,'puppeteer')
    .then(userCreds => {
        if (!userCreds) return {}
        console.info('Credentials OK')
        return {
            PUPPETEER_USER:userCreds.username,
            PUPPETEER_PASS:userCreds.password
        }
    })
})

export function runTest(testCaseId,executionId) {
    const command = 'runTest.js'
    const args = [testCaseId, `executionId=${executionId}`]
    // return execute(command, args)
    return creds().then(creds => execute(command, args, creds))
}
export function testPlan(testPlanId,testRunId=null) {
    const command = 'testPlan.js'
    const args = [testPlanId]
    if (testRunId) args.push(testRunId)

    return creds().then(creds => execute(command, args, creds))
}