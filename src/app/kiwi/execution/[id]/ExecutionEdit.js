'use client'

import { useState } from 'react';
import Link from 'next/link'
import { ExecutionRunner } from '@/components/kiwi/ScriptExecution.js'

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { DateDisplay } from '@/components/DateDisplay'
import { MarkdownDisplay } from '@/components/MarkDownDisplay'

function DataComment({comment}) {
    return <div style={{padding:'8px'}}>
        <table style={{textAlign:'left'}}>
            {Object.entries(comment.body).map(([key, value]) => {
                if (typeof value == 'object') value = JSON.stringify(value)
                return <tr key={key}>
                    <th>{key}:</th> <td>{value}</td>
                </tr>
            })}
        </table>
        <DateDisplay date={comment.submitDate} />
        <p>{comment.author.name}</p>
    </div>
}


function Comment({comment}) {
    const cdate = comment.submitDate
    if (comment.contentType == 'application/json') {
        return <DataComment comment={comment} />
    }
    const nRows = comment.body.split('\n').length

    return <div style={{padding:'8px'}}>
        <textarea autoComplete="off" autoCorrect="off" spellCheck="false" defaultValue={comment.body} style={{width:'100%'}} rows={nRows} />
        <DateDisplay date={cdate} />
        <p>{comment.author.name}</p>
    </div>

}

function Gallery({images}) {
    if (images.length == 0) return <div>No images</div>
    return <div className="gallery" style={{display:'flex',flexWrap:'wrap',textAlign:'center'}}>
        {images.map((image, index) => {
            const content = `data:image/png;base64,${image.content}`
            return <div style={{margin:'10px',display:'grid',gridTemplateRows:'1fr auto',maxWidth:'300px',maxHeight:'500px'}} key={image.src}>
                <img src={content} alt={`Image ${index}`} style={{maxWidth:'100%',maxHeight:'300px'}} />
                <p>{image.src}</p>
            </div>
        })}
    </div>
}

export default function Execution({execution,testCase,images}) {
    const [startDateValue,setStartDate] = useState(execution.startDate)
    const [stopDateValue,setStopDate] = useState(execution.stopDate)
    const [statusValue,setStatus] = useState(execution.status.name)
    const [executor,setExecutor] = useState(execution.testedBy?.username)

    const [imageList,setImageList] = useState(images)

    if (typeof execution.id == 'undefined') return <div></div>
    const header = "Execution "+execution.id
    const runUrl = "/kiwi/run/"+execution.run

    testCase.url = "/kiwi/testCase/"+testCase.id
    const script = Number.parseInt(testCase.script)
    
    const scriptUrl = isNaN(script) ? '' : "/kiwi/testCase/"+script
    const scriptText = isNaN(script) ? '' : <Link href={scriptUrl}>Parent script: {script}</Link>
    const scriptDisplay = <FormField label="Script">{scriptText}</FormField>

    const executionEvent = (type,data) => {
        if (type != 'testResult.finished') {
            console.debug('unhandled event',data)
            return
        }
        console.debug('Execution event',data)
        const {execution, updateResult} = data
        for (let r of updateResult) {
            console.info('id',r.id)
            if (r.id != 'TESTEXECUTION.UPDATE') continue
            const res = r.result
            setStartDate(res.start_date+'Z')
            setStopDate(res.stop_date+'Z')
            setExecutor(res.tested_by__username)
            setStatus(res.status__name)
            return
        }

        setStartDate(execution.start_date)
        setStopDate(execution.stop_date)
        setExecutor(execution.tested_by.username)
        setStatus(execution.status.value)
    }
    
    return <div>
        <ComponentSection header={header} >
            <fieldset>
                <FormField label="Status">{statusValue}</FormField>
                <FormField label="Executor">{executor}</FormField>
                <FormField label="Host">{execution.config}</FormField>
                <FormField label="Started">
                    <DateDisplay dateValue={startDateValue} />
                </FormField>
                <FormField label="Finished">
                    <DateDisplay dateValue={stopDateValue} />
                </FormField>
                <FormField label="Run">
                    <Link href={runUrl}>{execution.run}</Link>
                </FormField>
            </fieldset>
            <div>
                <FormField label="Summay">
                    <Link href={testCase.url}>{testCase.id}  {execution.case.summary}</Link>
                </FormField>
                {scriptDisplay}
                <FormField label="Notes">
                    <MarkdownDisplay md={execution.notes} />
                </FormField>
            </div>
        </ComponentSection>
        
        <ComponentSection header="Run">
            <ExecutionRunner src={`/api/executions/${testCase.id}/${execution.id}`} events={executionEvent} />
        </ComponentSection>

        <Gallery images={imageList} />

        <ComponentSection header="Comments">
            {execution.comments.map((comment, index) => <Comment key={index} comment={comment} />)}
        </ComponentSection>
        
    </div>
}
