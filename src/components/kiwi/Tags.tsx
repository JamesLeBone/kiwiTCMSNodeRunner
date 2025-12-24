'use client'
import { useState } from 'react';

import * as Tags from '@server/kiwi/Tag'
import Form from 'next/form'

import { IconButton } from '@/components/IconButton'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import { useActionState } from 'react'
import { StatusOperation } from '@lib/Operation';

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

export const TagSearch = ({addTag}: {addTag: (name: string) => Promise<StatusOperation>}) => {
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
        <h3 style={{padding:'8px'}}>Search</h3>
        <Form action={searchAction}>
            <fieldset>
                <FormInputField label="Tag" name="tagName" style={{display:'inline-block'}} />
            </fieldset>
            <FormActionBar pendingState={searchPending} state={searchState} actions={actions} />
        </Form>
        <SearchResults searchResults={tags} setTag={addTag} />
    </>
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
    const add = async (name:string) : Promise<StatusOperation> => {
        const status = await Tags.addTo(props.entityType, props.entityId, name)
        if (status.status) setTags([...tags, name])
        return status
    }
    return <>
        <div style={{padding:'8px'}}>
            <h3>List</h3>
            <ul>{tags.map(li => <li key={li}>{li}</li>)}</ul>
        </div>
        <TagSearch addTag={(name:string) => add(name)} />
    </>
}
