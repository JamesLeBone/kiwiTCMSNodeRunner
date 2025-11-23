'use client'
import { Modal } from '@/components/Modal'
import { useState } from 'react';
import { FormField } from '@/components/FormField'
import { InputField } from '@/components/FormField'

export function BulkSelection({openState, onSubmit}) {
    const multipleTestCaseList = useState('')
    const addManyCases = () => {
        const list = multipleTestCaseList[0].split(/[\n ]/)
            .filter((word) => word != '' && word.match(/^\d+$/))
        onSubmit(list)
        multipleTestCaseList[1]('') // Clear the text field after submission
    }

    return <Modal state={openState} actions={[{onClick:addManyCases, label:'Add'}]}>
        <p>Enter a list of test cases to add them in bulk.  Space or comma separated</p>
        <FormField label="List">
            <InputField textarea={true} state={multipleTestCaseList} style={{width:'100%'}} />
        </FormField>
    </Modal>
}
