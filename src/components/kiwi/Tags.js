'use client'
import { useState } from 'react';
import Link from 'next/link'
import { useMessage } from '@/components/ServerResponse'

import * as tg from '@server/kiwi/Tag'

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { InputField } from '@/components/InputField'
import { ActionBar, ActionButton, ActionButtonText } from '@/components/Actions'

/**
 * Have a test case id with a tag list
 * @returns 
 */
function TagList({tags=[],testCaseId,className}) {
    const searchResults = useState([])
    const searchResultText = useState('')
    const status = useMessage()

    const reloadList = () => {
        status.loading()
        const tcid = Number.parseInt(testCaseId)
        return tg.getAttached('TestCase', tcid)
            .then(response => {
                if (!response.status) {
                    status.error(response.message)
                    return false
                }
                tagComponentList[1]( tagComponents(response.data) )
                return true
            }).catch(e => status.errorHandler(e))
    }

    const search = forString => {
        const searchFor = forString.textValue.trim()
        const query = {}
        
        if (searchFor.length > 0) {
            query.name = searchFor
        }
        tg.search(query)
            .then(response => {
                if (!response.status) {
                    searchResultText[1](`Search for ${searchFor} failed`)
                    return
                }
                const list = response.message
                searchResultText[1](`Search for ${searchFor} returned ${list.length} results`)
                if (searchFor != '') {
                    searchResults[1](list)
                    return
                }

                const newList = []
                for (const li of list) {
                    const tagName = li.name
                    if (tagName.match(/^(DEV|BUG|HELP)-\d*$/)) {
                        continue
                    }
                    newList.push(li)
                }
                searchResults[1](newList)
            }).catch(e => status.errorHandler(e))
    }
    const clearSearch = () => { searchResults[1]([]); searchResultText[1]('') }
    const add = ({textValue}) => {
        const action = 'Add Tag'
        const tagName = textValue.trim()
        if (tagName.length == 0) {
            status.error('No tag name')
            return
        }

        status.loading()
        tg.addToTestCase(testCaseId, tagName)
        .then(result => {
            if (!result.status) {
                status.error(result.message)
                return
            }
            reloadList()
            .then(() => {
                status.success(result.message)
            })
        })
    }

    function tagComponents(tags) {
        return tags.map(li => {
            const name = li.name
            if (name.match(/^(DEV|BUG|HELP)-\d*$/)) {
                // const url = JIRA_URL + name
                // return <li key={li.id}>
                    // <Link href={url} target="helpdesk">Jira ticket - {name}</Link>
                // </li>
            }
            return <li key={li.id}>{name}</li>
        })
    }

    const tagComponentList = useState( tagComponents(tags) )

    const addText = useState('')
    
    const actionbar = <ActionBar>
        <ActionButtonText   action={search} >Search</ActionButtonText>
        <ActionButton text="Clear Search" action={clearSearch} />
        <ActionButtonText   action={add} state={addText} >Add</ActionButtonText>
    </ActionBar>

    return <ComponentSection className={className} header="Tags / Tickets" actionbar={actionbar}>
        { status.message }
        <span>{searchResultText[0]}</span>
        <ul className="actionable-list" style={{padding:'8px'}}>
            {tagComponentList[0]}
        </ul>
        <SearchResults searchResults={searchResults} setTag={addText[1]} />
    </ComponentSection>
}

function SearchResults({searchResults, setTag}) {
    if (searchResults[0].length == 0) return <div></div>
    
    const list = searchResults[0].map(li => {
        return <div key={li.id} style={{padding:'4px'}}>
            <IconButton onClick={() => setTag(li.name)}>
                <i className="fa fa-plus" />
            </IconButton>
            {li.name}
        </div>
    })
    return <div style={{maxHeight:'100px',overflow:'auto',borderTop:'1px solid #aaa'}}>{list}</div>
}

function TagCaseList({list,header,baseUrl}) {
    if (list == null || list.length == 0) return;
    const widgies = list.map(tc => {
        return <li key={tc.id}>
            <Link href={baseUrl+tc.id}>{tc.name}</Link>
        </li>
    })
    
    return <section style={{display:'inline-block',padding:'0px', margin:'4px'}}>
        <h3 style={{borderBottom:'1px solid #aaa', padding:'4px'}}>{header}</h3>
        <ul style={{listStyle:'none'}}>{widgies}</ul>
    </section>
}

function TagDetails({tag}) {
    if (tag[0] == null) return <div></div>
    
    const {name,cases,plans,bugs,runs} = tag[0]
    return <div style={{padding:'8px'}}>
        Name: {name}<br />
        
        <TagCaseList header="Test Cases" baseUrl="/kiwi/testCase/" list={cases} />
        <TagCaseList header="Test Plans" baseUrl="/kiwi/plan/" list={plans} />
        <TagCaseList header="Test Runs" baseUrl="/kiwi/run" list={runs} />
    </div>
}

/**
 * Have no test case, and search by tag.
 */
function TagSearch({}) {
    const tagSearchName = useState('')
    const msg = useMessage()
    const searchResultList = useState([])

    const selectedTag = useState(null)
    
    const search = () => {
        msg.loading()
        
        const name = tagSearchName[0]
        const query = name.length > 0 ? {name:name} : {}
        
        searchResultList[1]([])
        
        tg.search(query)
        .then(response => {
            if (!msg.statusResponse(response)) return
            const list = response.message
            searchResultList[1](list)
        }).catch(e => msg.errorHandler(e))
    }
    
    const setTag = name => tg.getDetail(name).then(s => {
        if (!s.status) return
        selectedTag[1](s.message)
    })
    
    return <ComponentSection header="Search test cases by tag">
        <fieldset>
            <FormField label="Tag name">
                <InputField state={tagSearchName} />
            </FormField>
        </fieldset>
        {msg.message}
        <SearchResults searchResults={searchResultList} setTag={setTag} />
        <TagDetails tag={selectedTag} />
        <ActionBar>
            <ActionButton text="Search" action={search} />
        </ActionBar>
    </ComponentSection>
}

export {
    TagList, TagSearch
}
