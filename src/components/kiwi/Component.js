'use client'

import styles from './Component.module.css'
import { useState } from 'react';
import Link from 'next/link'

import { DynamicTable } from '@/components/DynamicTable'
import { useMessage } from '@/components/ServerResponse'

import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { InputField } from '@/components/InputField'
import { ActionBar, ActionButton, ActionButtonText } from '@/components/Actions'

import * as conn from '@server/kiwi/Component'

const promisfyResponse = request => new Promise((resolve,reject) => request.then(reply => {
    return reply.status ? resolve(reply.message) : reject(reply.message)
}))

const useConn = (entityName,parentId,primaryKey, components) => {
    const componentState = useState(components ?? [])
    const reload = () => conn.getAttached(entityName, parentId)
    .then(reply => {
        if (!reply.status) return
        console.debug('Reloaded components', reply)
        componentState[1](reply.message)
    })

    return {
        add: name => promisfyResponse( conn.addTo(name,parentId, entityName, primaryKey) ).then(() => reload()),
        remove: id => promisfyResponse( conn.removeFrom(id, parentId, entityName, primaryKey) ).then(() => reload()),
        getAttached: reload,
        list: componentState
    }
}

function ComponentTestCase({testCase}) {
    const {id,summary} = testCase
    return <Link href={`/kiwi/testCase/${testCase.id}`}>{id} - {summary}</Link>
}

function ComponentSummaryItem({component}) {
    const {id,name} = component
    const size = component.cases.length
    
    return <li>
        <span>{name}</span> <span>{size} cases</span>
    </li>
}

function ComponentList({list}) {
    const [componentList] = list
    if (componentList.length == 0) return <div>No components</div>
    
    return <ul className="actionable-list">
        {componentList.map(c => <ComponentSummaryItem key={c.id} component={c} />)}
    </ul>
}

export function ComponentSummary({component}) {
    const caseList = useState([])
    const status = useMessage()
    
    const populated = useState(false)
    
    const showNav = useState(false)
    const showNavText = useState('Load')
    const navDisplay = useState('Nav-none')
    const nCases = component.cases.length
    
    const toggle = e => {
        if (!populated[0]) {
            status.loading()
            const action = 'Fetch Detail'
            // const action = 'Fetching test cases for '+component.name
            
            conn.get(`component/${component.id}`)
                .then(response => {
                    if (!response.status) {
                        status.error(action, 'List failed')
                        return
                    }
                    status.success( 'List obtained')
                    const component = response.message
                    caseList[1]( component.cases.map(tc => <ComponentTestCase key={tc.id} testCase={tc} />) )
                    
                    populated[1](true)
                    navDisplay[1]('Nav-block')
                    showNavText[1]('Hide')
                }, failure => {
                    console.debug(failure)
                    status.error(action, 'List failed')
                })
                .catch(e => status.errorHandler(e) )
            return
        }
        
        const newSetting = !showNav[0]
        const display = newSetting ? 'block' : 'none'
        
        showNavText[1](newSetting ? 'Show' : 'Hide')
        showNav[1](newSetting)
        navDisplay[1]('Nav-'+display)
    }

    return <div className="ComponentSummary">
        { status.message }
        <div>
            <div className={styles.componentName}>{component.name}</div>
            <p className={styles.description}>{component.description}</p>
            <Link href={'kiwi/component/'+component.id}>Details</Link>
            {nCases > 0 ? <ActionButton text={showNavText[0]} action={toggle} /> : 'No cases'}
        </div>
        <nav className={styles[navDisplay[0]]}>
            {caseList[0]}
        </nav>
    </div>
}

export function ComponentSearch({}) {
    const components = useState([])
    const componentId = useState('')
    const status = useMessage()


    const tableClass = useState('no-data')

    const searchHandler = (textValue) => {
        const name = textValue.trim()

        if (name == '') {
            status.clear()
            return
        }
        const action = 'Search'

        conn.search({name:name})
        .then(result => {
            const resultSuccess = result.status
            const list = result.message

            console.debug(result)
            if (resultSuccess) {
                status.clear()
                if (list.length == 0) {
                    tableClass[1]('has-data')
                } else {
                    tableClass[1]('no-data')
                }
                components[1](list)
            } else {
                const message = result.message
                status.error(message)
                components[1]([])
            }
        })
        .catch(e => status.handleException(action, e))
    }
    
    return <ComponentSection header="Search by component">
        <ActionBar className="controls">
            <ActionButtonText onClick={searchHandler}>
                Search by name
            </ActionButtonText>
        </ActionBar>
        { status.message }
        <DynamicTable headers={['ID','Name','Description','Load']}>
            { components[0].map(c => <ComponentTableSummary key={c.id} {...c} />) }
        </DynamicTable>
    </ComponentSection>
}

export function ComponentTableSummary({...component}) {
    return <tr>
        <td className='numeric id'>{component.id}</td>
        <td>{component.name}</td>
        <td>{component.description}</td>
        <td className='link'><Link href={'kiwi/component/'+component.id}>Details</Link></td>
    </tr>
}

export function ComponentSmallSearch({}) {
    const components = useState([])
    const componentName = useState('')
    const status = useMessage()

    const search = e => {
        if (typeof e != 'undefined') e.preventDefault()
        status.loading()
        const action = 'Search'
        
        const query = {}
        if (componentId[0] != '') query.id = componentId[0]
        if (componentName[0] != '') query.name = componentName[0]
        
        KiwiConnection.get('component', query)
            .then(result => {
                status.success( 'List obtained')
                console.debug(result)
                // const componentList = result
                    // .map(c => <ComponentSummary key={c.id} component={c} />)
                // components[1](componentList)
            }, failed => {
                status.error('List failed')
                console.debug(failed)
            }).catch(e => {
                console.error(e)
                status.error('List failed (Exception)')
            })
    }
    // const searchInput = <input label="Name" value={idState[0]} onChange={setID} />
    
    return <ComponentSection header="Search by component">
        { status.message }
        <form onSubmit={search}>
            <fieldset style={{justifyContent:'left'}}>
                <FormField label="Component Name">
                    <InputField state={componentName} />
                </FormField>
            </fieldset>
            <ActionButton text="Search" action={search} />
        </form>
        <fieldset className={styles.componentList}>{components[0]}</fieldset>
    </ComponentSection>
}

export function RelatedComponents({components,...params}) {
    const {entityName, parentId, primaryKey} = params
    // console.debug('RelatedComponents', components)
    const uc = useConn(entityName,parentId,primaryKey, components)

    const removeComponent = componentId => uc.remove(componentId).then(() => reload())
    const createList = comps => {
        // console.info('updateing list', comps)
        comps = comps || []
        return comps.map(li => <li key={li.id}>
            <span>{li.name}</span>
            <ActionButton action={() => removeComponent(li.id)} text="Remove" />
        </li>)
    }
    const componentList = uc.list
    const reload = () => uc.getAttached()
    
    const searchText = useState('')
    const searchResults = useState([])
    const searchResultText = useState('')
    
    const search = () => {
        const searchFor = searchText[0].trim()
        const query = {}
        
        if (searchFor.length > 0) {
            query.name = searchFor
        }

        promisfyResponse(conn.search(query))
            .then(list => {
                searchResultText[1](list.length+' returned');
                searchResults[1](list)
            }, reject => searchResultText[1](reject))
    }
    const clear = () => {
        searchText[1]('')
        searchResults[1]([])
        searchResultText[1]('')
    }
    
    const addComponent = async componentName => uc.add(componentName)
    const addNewComponent = () => {
        // const bttn = event.target
        searchResultText[1]('')
        const componentName = searchText[0].trim()

        if (componentName.length == 0) {
            searchResultText[1]('You must search before adding')
            return
        }
        return addComponent(componentName)
    }
    
    const resultItems = searchResults[0].map(li => {
        const title = li.name.trim().toLowerCase() == li.description.trim().toLowerCase() ? li.description : ''
        
        return <li key={li.id} data-id={li.id} data-name={li.name} title={title}>
            <span>{li.name}</span>
            <ActionButton action={() => addComponent(li.name)} text="+" />
        </li>
    })
    
    // Idea here is to use ActionButtonText, but use multiple action buttons.
    const actionbar = <ActionBar>
        <div className="input-and-button" style={{justifyContent:'left'}}>
            <input type="text" value={searchText[0]} onChange={e=>searchText[1](e.target.value)} />
            <ActionButton action={addNewComponent} text="Add New" />
            <ActionButton action={search} text="Search" />
        </div>
        <ActionButton text="Clear" action={clear} />
        <ActionButton text="Reload" action={reload} />
    </ActionBar>

    return <ComponentSection header="Components" style={{gridColumn:'span 1'}} actionbar={actionbar}>
        <ComponentList list={componentList} />
        <div>
            <span>{searchResultText[0]}</span>
            <ul className="actionable-list">
                {resultItems}
            </ul>
        </div>
    </ComponentSection>
}

