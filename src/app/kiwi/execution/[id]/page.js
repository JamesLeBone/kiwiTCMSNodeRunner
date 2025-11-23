'use server'
import ExecutionEdit from './ExecutionEdit.js'
import * as exe from '@server/kiwi/Execution'
import * as tc from '@server/kiwi/TestCase'
import fs from 'fs'

const metadata = {
    title: 'Execution edit - Dragon toolbox'
}

export async function generateMetadata({ params, searchParams },parent) {
    const id = (await params).id
    metadata.title = `Execution ${id} - Dragon toolbox`
    exe.get(id)
        .then(response => {
            if (response.status) {
                const status = response.status.name
                metadata.title = `Execution ${id}:${status} - Dragon toolbox`
                return
            }
            metadata.title += ' - Not found.'
        })
    return metadata
}

async function getImages(testCaseId) {
    // node version : process.version = v20.14.0
    // console.debug(process.env.HOME)
    const basePath = process.env.HOME+`/puppeteer/testResults/testResult-${testCaseId}`
    if (!fs.existsSync(basePath)) {
        return []
    }
    const dir = fs.readdirSync(basePath)
    const images = dir.filter(file => file.endsWith('.png'))
    if (images.length > 0) {
        return images.map(image => {
            const fileContent = fs.readFileSync(basePath + `/${image}`)
            const base64Content = fileContent.toString('base64')
            return {
                src: image,
                content: base64Content
            }
        })
    }
    
    return images
}

export default async function TestRunPage({params,searchParams}) {
    const parameters =  await params
    const executionId = parameters.id ?? null

    if (executionId == null) {
        return <div>ID is required</div>
    }

    // uses our server.
    const response = await exe.get(executionId)
    if (!response.status) {
        return <div>Execution {executionId}: {response.message}</div>
    }

    const testCase = await tc.get(response.message.case.value)
        .then(r => r.message)

    const images = await getImages(testCase.id)
    
    console.debug(`Execution ${response.message.id}, test case : ${testCase.id}`)
    // console.info('Execution details:',testCase)

    return <ExecutionEdit execution={response.message} testCase={testCase} images={images} />
}

