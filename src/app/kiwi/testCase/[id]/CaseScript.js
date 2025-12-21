import { useState } from 'react';
import Link from 'next/link'
import { ActionBar, ActionButton } from '@/components/Actions'
import { useMessage } from '@/components/ServerResponse'

import * as TestCase from '@server/kiwi/TestCase.js'

export default function CaseScript({testCaseId,script,setValue, className}) {
    const proposedScriptId = useState('')
    const responses = useMessage()
    
    const setProposedScriptId = e => proposedScriptId[1](e.target.value)
    const setScript = () => {
        const proposed = proposedScriptId[0]
        script[1](proposed)
        proposedScriptId[1]('')
        
        setValue(proposed)
    }
    
    const verifyScript = () => {
        const proposed = proposedScriptId[0]
        const setValue = script[0]
        
        let testValue = proposed
        
        if (typeof proposedScriptId[0] == 'undefined' || proposedScriptId[0] == '') {
            testValue = setValue
        }
        if (isNaN(Number.parseInt(testValue))) {
            responses.add('info', `Case Id ${testValue} is not a number`)
            return
        }
        responses.loading('Verifying script id '+testValue)

        TestCase.get(testValue)
        .then(serverReply => {
            if (!serverReply.status) {
                responses.error(serverReply.message)
                return
            }
            const {id,summary} = serverReply.data
            responses.success(`Case Id ${id} found: ${summary}`)
        })
    }
    const url = isNaN(Number.parseInt(script[0])) ? '' : '/kiwi/testCase/'+script[0]
    const link = url == '' ? script[0] : <Link href={url}>Parent Script: {script[0]}</Link>
    
    return <div>
        <ActionResponses hook={responses} />
        <fieldset className={className}>
            <div>
                {link}
            </div>
            <ActionBar>
                <div className="input-and-button">
                    <input type="text" value={proposedScriptId[0]} onChange={setProposedScriptId} />
                    <ActionButton text="Verify" action={verifyScript} />
                    <ActionButton text="Set" action={setScript} />
                </div>
            </ActionBar>
        </fieldset>
    </div>
}
