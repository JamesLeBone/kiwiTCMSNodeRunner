'use client'
import { useState } from 'react';

import * as Tags from '@server/kiwi/Tag'
import Form from 'next/form'

import { IconButton } from '@/components/IconButton'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import { useActionState } from 'react'
import { StatusOperation } from '@lib/Operation';
import { useMessage } from '@/components/ServerResponse'
import { DynamicTable } from '../DynamicTable';

type srpops = {
    searchResults: Tags.AmalgomatedTag[]
    setTag: (name: string) => void
}
function SearchResults({searchResults, setTag}: srpops) {
    if (searchResults.length == 0) return <div></div>
    
    const list = searchResults.map(li => {
        const name = li.name
        return <div key={name} style={{padding:'4px'}}>
            <IconButton title={`Add tag ${name}`} onClick={() => setTag(name)} className="fa fa-plus" />
            {li.name}
        </div>
    })
    return <div style={{maxHeight:'100px',overflow:'auto',borderTop:'1px solid #aaa'}}>{list}</div>
}

type tsp = {
    addTag: (name: string) => Promise<StatusOperation>
}
export const TagSearch = ({addTag}:tsp) => {
    const [tags,setTags] = useState([] as Tags.AmalgomatedTag[])

    const [searchState, searchAction, searchPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const name = formData.get('tagName') as string
            const action = formData.get('action') as string
            if (action == 'Add') {
                return addTag(name)
            }

            const op = await Tags.search( { name: name } )
            if (op.data && op.status) {
                setTags(op.data)
            }

            return op
        },
        blankStatus()
    )

    const actions = [
        { label: 'Search' },
        { label: 'Add' }
    ]

    return <>
        <Form action={searchAction}>
            <fieldset>
                <FormInputField label="Tag" name="tagName" style={{display:'inline-block'}} />
            </fieldset>
            <FormActionBar pendingState={searchPending} state={searchState} actions={actions} />
        </Form>
        <SearchResults searchResults={tags} setTag={addTag} />
    </>
}

function TagRow(props: {value: string, doRemove: () => Promise<StatusOperation>}) {
    return <tr>
        <td>{props.value}</td>
        <td>
            <button onClick={() => props.doRemove()}>Remove</button>
        </td>
    </tr>
}

type tagListProps = {
    tags: string[]
    entityType: Tags.attachableEntityNames
    entityId : number
}
/**
 * Have a test case id with a tag list
 */
export const TagList = (props : tagListProps) => {
    const [tags, setTags] = useState(props.tags)
    const msg = useMessage()

    const add = async (name:string) : Promise<StatusOperation> => {
        if (tags.includes(name)) {
            const so:StatusOperation = {
                id: 'tagExists',
                status: false,
                message: `Tag ${name} is already attached`,
                statusType: 'info'
            }
            msg.statusResponse(so, false)
            return so
        }
        const status = await Tags.addTo(props.entityType, props.entityId, name)
        if (status.status) setTags([...tags, name])
        msg.statusResponse(status)
        return status
    }
    const removeFromList = async (name:string) : Promise<StatusOperation> => {
        const status = await Tags.removeFrom(props.entityType, props.entityId, name)
        if (status.status) {
            const newList = tags.filter(t => t != name)
            setTags(newList)
        }
        msg.statusResponse(status)
        return status
    }

    return <>
        {msg.message}
        <DynamicTable headers={['Tag', 'Actions']} className='table-with-actions' >
            {tags.map(li => <TagRow key={li} doRemove={() => removeFromList(li)} value={li} />)}
        </DynamicTable>
        <TagSearch addTag={(name:string) => add(name)} />
    </>
}
