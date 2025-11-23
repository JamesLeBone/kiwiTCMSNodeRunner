
import { useState } from 'react';
import { useMessage } from '@/components/ServerResponse'


import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar } from '@/components/Actions'
import { InputField } from '@/components/FormField'

import { BulkSelection } from './BulkTestCaseAdd.js'
import { TestCaseTable, TestCaseViewTable } from './TestCaseTable.js'

import * as tc from '@server/kiwi/TestCase.js'
import * as tp from '@server/kiwi/TestPlan.js'
import * as tag from '@server/kiwi/Tag'

import * as TestCaseLib from '@/components/kiwi/TestCase.js'

/**
 * Custom hook for managing test case selection
 * @returns hook object
 */
function useTestCaseSelection(dataList) {
    // For global selection
    const selectionState = useState(false)
    // List of data
    const testCaseList = useState(dataList)
    // List of ids
    const selectedIds = useState([])
    
    const toggleSelectionState = () => {
        const mode = !selectionState[0]
        selectionState[1](mode)

        const select = []
        
        const newList = []
        for (let tc of testCaseList[0]) {
            tc.selected = mode
            newList.push(tc)
            if (mode) select.push(tc.id)
        }

        selectedIds[1](select)
        testCaseList[1](newList)
        return mode
    }
    
    const setSelection = (id,state) => {
        const newList = []
        for (let tcid of selectedIds[0]) {
            if (tcid != id) newList.push(tcid)
            if (state) newList.push(id)
        }

        selectedIds[1](newList)
    }
    
    const toggleSelection = id => {
        const select = []
        const newList = []

        for (let tc of testCaseList[0]) {
            if (tc.id == id) {
                tc.selected = !tc.selected
            }
            newList.push(tc)
            if (tc.selected) {
                select.push(tc.id)
            }
        }

        selectedIds[1](select)
        testCaseList[1](newList)
    }
    
    return {
        toggleSelectionState: toggleSelectionState,
        setSelection: setSelection,
        toggleSelection: toggleSelection,
        dataState: testCaseList,
        selectedIds: selectedIds,
        getList: () => Object.values(testCaseList[0]),
        setList: list => testCaseList[1](list),
        isSelected: id => selectedIds[0].indexOf(id) != -1,
        getSelectedIds: () => selectedIds[0],
        getSelectedCases: () => {
            const selected = []
            for (let id of selectedIds[0]) {
                if (typeof testCaseList[0][id] == 'undefined') {
                    continue
                }
                const c = testCaseList[0][id]
                selected.push(c)
            }
            return selected
        }
    }
}


function ComponentEditor({testCaseSelection}) {
    const newComponentName = useState('')
    const component = useState(false)
    
    const status = useMessage()

    const searchResults = useState([])
    const searchResultsList = useState([])

    const setComponent = (clickedComponent) => {
        component[1](clickedComponent)
        rebuildSearchResultsList(clickedComponent)
    }

    const rebuildSearchResultsList = (argSelected) => {
        // can't use component[0] because it waits for the next render
        const selectedComponent = typeof argSelected == 'undefined' ? null : argSelected

        const results = searchResults[0].map((c,index) => {
            const selected = selectedComponent != null && c.id == selectedComponent.id
            console.debug('selected',selected,c.id,selectedComponent)
            const className = selected ? "selectable selected" : "selectable"
            return <li className={className} key={index} onClick={() => setComponent(c)}>{c.name}</li>
        })
        searchResultsList[1](results)
    }

    // useEffect(() => {
    //     rebuildSearchResultsList()
    // },[searchResults])

    const clearSearchResults = () => searchResults[1]([])

    const applyComponent = () => {
        status.loading()
        const selectionList = testCaseSelection.getSelected()
        if (selectionList.length == 0) {
            status.error('Error: nothing selected')
            return
        }

        clearSearchResults()

        let results = []
        const c = component[0]
        
        for (let testCaseId of selectionList) {
            results.push(
                connection.addComponent(testCaseId, c.name, c.id)
                    .then(response => true, reject => {
                        console.error(reject)
                        return false
                    })
            )
        }

        Promise.all(results)
            .then(response => {
                let summary = {success:0,failed:0}
                for (let r of response) {
                    if (r) {
                        summary.success++
                    } else {
                        summary.failed++
                    }
                }
                const total = summary.success + summary.failed
                if (summary.success == total) {
                    status.setSuccess('Assign Component',summary.success+' components applied')
                } else if (summary.failed == total) {
                    status.error('Assign Component','Failed to apply any components')
                } else {
                    status.setWarning(
                        'Assign Component',
                        summary.success+' components applied, '+summary.failed+' failed'
                    )
                }
            })
    }

    const search = () => {
        clearSearchResults()

        connection.componentSearch()
            .then(results => {
                if (results == null) {
                    status.error('Nothing found')
                    searchResults[1]([])
                    return
                }
                status.success(results.length+' component(s) found')
                searchResults[1](results)
            }, rejection => status.error(rejection))
    }
    
    return <div>
        { status.message }
        <ol className="actionable-list">{searchResultsList[0]}</ol>
        <ActionBar>
            <ActionButton action={applyComponent} text="Apply" />
            <ActionButton action={search} text="Search" />
            <ActionButton action={clearSearchResults} text="Clear" />
        </ActionBar>
    </div>
}

export default function TestCaseList({testPlanId, cases}) {
    const testCaseSelection = useTestCaseSelection(cases)
    const status = useMessage()

    const reloadCases = () => {
        tp.getCases(testPlanId).then(serverResponse => {
            console.debug('Fetch Result',serverResponse)
            if (!serverResponse.status) {
                console.error('Failed to fetch cases',serverResponse.message)
                return
            }
            testCaseSelection.setList(serverResponse.message)
        })
    }
        
    const formatTextInput = text => {
        if (text == 'false') return false
        if (text == 'true') return true
        
        const floatVal = parseFloat(text)
        if (!isNaN(floatVal)) return floatVal
        
        if (text == 'null') return null
        return text
    }
    
    const setStatus = enabled => {
        const selectedCases = testCaseSelection.getSelectedIds()
        if (selectedCases.length == 0) {
            return
        }
        // const statusList = [
        //     {value:1, name:'Proposed'},
        //     {value:2, name:'Confirmed'},
        //     {value:3, name:'Disabled'},
        //     {value:4, name:'Update Required'}
        // ]

        tc.bulkUpdate(selectedCases, {case_status: enabled ? 2 : 4})
            .then(response => reloadCases())
    }

    const BulkFormat = () => {
        const promsies = []
        for (let testCase of testCaseSelection.getSelectedCases()) {
            console.debug('Verify securityGroupId is present', testCase)
            const newSummary = TestCaseLib.TestCase.formatSummary(testCase.summary, testCase.securityGroupId)
            continue
            promsies.push(
                tc.update(testCase.id, {summary:newSummary})
            )
        }
        Promise.all(promsies).then(() => reloadCases())
    }
    
    const conditionName = useState("")
    const conditionValue = useState("")
    const setTestCaseOption = () => {
        if (conditionName[0] == '') return
        if (conditionValue[0] == '') return

        const argName = conditionName[0]
        const value = formatTextInput(conditionValue[0])

        const idList = testCaseSelection.getSelectedIds()
        const argData = {}
        argData[argName] = value

        tc.bulkUpdate(idList, {arguments:argData})
    }
    
    const tagWith = ({textValue}) => {
        const newTag = textValue.trim()
        if (newTag.length == 0) return
        
        for (let id of testCaseSelection.getSelectedIds()) {
            const tagId = Number.parseInt(id)
            tag.addToTestCase(tagId,newTag)
        }
    }

    const smokeTest = add => {
        console.info(testCaseSelection.getSelectedIds())
        for (let id of testCaseSelection.getSelectedIds()) {
            tc.addToPlan(id)
            // connection.smokeTest(testCaseSelection.getSelected(), add)
        }
    }
    
    const selectionText = testCaseSelection.getSelectionState ? 'Deselect All' : 'Select All'

    const setParent = params => {
        const parentId =  Number.parseInt(params.textValue)
        if (parentId == '' || Number.isNaN(parentId)) {
            return
        }

        for (let testCaseId of testCaseSelection.getSelectedIds()) {
            tc.update(testCaseId, {parent:parentId})
        }
    }
    const addCase = params => {
        const testCaseId = Number.parseInt(params.textValue)
        if (Number.isNaN(testCaseId)) {
            console.error('Test case ID is not a number')
            return
        }
        console.debug('Adding',testCaseId, testPlanId)
        status.loading()
        // status.error('Error: nothing selected')
        
        tp.addToPlan(testCaseId, testPlanId)
            .then(result => {
                if (result.status) {
                    status.setSuccess('Add Case','Case added')
                } else {
                    console.debug(result)
                    status.error('Failed to add case - '+result.message)
                }
            })
            .then(reloadCases)
    }
    const otherPlan = params => {
        const planId = Number.parseInt(params.textValue)
        if (Number.isNaN(planId)) {
            console.error('Test plan ID is not a number')
            return
        }
        const promises = []
        for (let id of testCaseSelection.getSelectedIds()) {
            promises.push ( tp.addToPlan(id, planId) )
        }
        Promise.all(promises)
            .then(responses => {
                console.info('responses', responses)
            })
    }
    const removeCase = () => {
        const promises = []
        for (let id of testCaseSelection.getSelectedIds()) {
            promises.push ( tp.removeFromPlan(id, testPlanId) )
        }
        Promise.all(promises).then(() => reloadCases())
    }
    
    const openManyAdd = useState(false)
    const addManyCases = list => {
        const promises = []
        for (let tcId of list) {
            promises.push( tp.addToPlan(tcId,testPlanId) )
        }
        Promise.all(promises).then(() => {
            reloadCases()
            openManyAdd[1](false) // Close the modal after adding cases
        })
    }

    const CompareOptions = () => {
        const options = {}
        const summary = {}
        
        for (let testCase of testCaseSelection.getSelectedCases()) {
            options[testCase.id] = testCase.arguments
            for (let [k,v] of Object.entries(testCase.arguments)) {
                const value = v+''
                if (typeof summary[k] == 'undefined') summary[k] = {};
                if (typeof summary[k][value]) {
                    summary[k][value] = 1
                } else {
                    summary[k][value]++
                }
            }
            break;
        }

        console.info(summary, options)
    }

    const selectAllToggle = () => { testCaseSelection.toggleSelectionState() }
        
    return <div>
        <BulkSelection openState={openManyAdd} onSubmit={addManyCases} />
        <ComponentSection header="Components">
            <ComponentEditor testCaseSelection={testCaseSelection} />
        </ComponentSection>
        <ComponentSection header="List">
            { status.message }
            <TestCaseTable selectAllToggle={selectAllToggle} selectionText={selectionText} testCaseList={testCaseSelection.dataState[0]} toggleSelection={testCaseSelection.toggleSelection} />
            <ActionBar>
                <ActionButtonText action={otherPlan}   >Add to other Plan</ActionButtonText> 
                <ActionButtonText action={addCase}   >Add Case</ActionButtonText> 
                <ActionButtonText action={setParent}   >Set Parent</ActionButtonText>
                <ActionButtonText action={tagWith}   >Tag</ActionButtonText>
                <ActionButton action={BulkFormat} text="Bulk Format" />
                <ActionButton action={() => setStatus(true)} text="Enable" />
                <ActionButton action={() => setStatus(false)} text="Disable" />
                <ActionButton action={removeCase} text="Remove Cases" /> 
                <ActionButton action={() => { smokeTest(true) }} text="Add to smoke test" />
                <ActionButton action={() => { smokeTest(false) }} text="Remove from smoke test" />
                <ActionButton action={()=> {openManyAdd[1](true)}} text="Add Many Cases" />
                <ActionButton action={CompareOptions} text="Compare Options" />
                <ActionButton action={reloadCases} text="Reload" />
            </ActionBar>
            <ActionBar>
                <div className="input-and-button">
                    <InputField state={conditionName} placeholder="Condition Name" />
                    <InputField state={conditionValue} placeholder="Condition Value" />
                    <ActionButton action={setTestCaseOption} text="Set test option" />
                </div>
            </ActionBar>
        </ComponentSection>
    </div>
}

export function TestCaseViewList({cases}) {
    return <div>
        <ComponentSection header="List">
            <TestCaseViewTable testCaseList={cases} />
        </ComponentSection>
    </div>
}
