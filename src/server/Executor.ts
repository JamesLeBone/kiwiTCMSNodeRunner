import child_process from 'child_process'
import * as Auth from '@server/Auth'
import * as Users from '@server/lib/Users'
import * as Credentials from '@server/lib/Credentials'
import { fetchCases } from '@server/kiwi/TestCase'

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

const creds = () => Auth.currentUser().then(tor => {
    if (!tor.data) return {}
    
    console.debug('Current user:', tor.data)
    return Credentials.getFirstCredentialOfType(tor.data.userId,1) // Puppeteer type
    .then(userCreds => {
        if (!userCreds) return {}
        console.info('Credentials OK')
        const creds = userCreds.credential

        return {
            PUPPETEER_USER:creds.username,
            PUPPETEER_PASS:creds.password
        }
    })
})

/*
I need to find a way to specify the credentialTypeId to use
for each type of execution (Selenium, Puppeteer, Jast, etc)

So, say Product is "kiwiTCMSNodeRunner"
then, the Category is "Puppeteer" or "Jast"

... therefore I need to build out categories for Products

Then, when running a test case or test plan, I can look up the Product's Category,
then find the CredentialType associated with that Category, and use that to fetch
the correct credentials for the execution.
*/

export async function runTest(testCaseId:number,executionId?:number) {
    const command = 'runTest.js'
    const args = [testCaseId, `executionId=${executionId}`]
    // return execute(command, args)
    return creds().then(creds => execute(command, args, creds))
}
export async function testPlan(testPlanId:number,testRunId?:number) {
    const command = 'testPlan.js'
    const args = [testPlanId]
    if (testRunId) args.push(testRunId)

    return creds().then(creds => execute(command, args, creds))
}