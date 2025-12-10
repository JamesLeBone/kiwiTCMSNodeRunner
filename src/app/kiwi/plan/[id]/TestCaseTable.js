
import { useState, useEffect } from 'react';
import { TestCaseSummary, TestCaseRow } from './TestCaseSummary.js'
// https://mui.com/material-ui/react-table/#data-table
export function TableHeader({selectAllToggle,selectionText, isEditable}) {
    let selectAll = ''
    let action = ''
    if (isEditable) {
        action = <th>Action</th>
        selectAll = <th><span className="btn" onClick={selectAllToggle} style={{fontSize:'9pt',lineHeight:'normal'}}>{selectionText}</span></th>
    }

    return <thead>
        <tr>
            <th>ID</th>
            <th>Script</th>
            <th></th>
            <th>Summary</th>
            <th>Automated</th>
            <th>Status</th>
            <th>Perm Level</th>
            {selectAll}
            {action}
        </tr>
    </thead>
}

function TestCaseViewListBody({testCases}) {
    if (!Array.isArray(testCases)) {
        console.debug('TestCaseListBody: testCases is not an array',testCases)
        return <p>Testcase state invalid</p>
    }

    return <tbody>
        {testCases.map(testCase => <TestCaseRow key={testCase.id} testCase={testCase} />)}
    </tbody>
}

function TestCaseListBody({testCases, toggleSelection}) {
    if (!Array.isArray(testCases)) {
        console.debug('TestCaseListBody: testCases is not an array',testCases)
        return <p>Testcase state invalid</p>
    }
    const doUpdate = () => {
        if (typeof toggleSelection == 'function') toggleSelection(testCase.id)
    }

    return <tbody>
        {testCases.map(testCase => {
            testCase.selected = testCase.selected || false;
            return <TestCaseSummary key={testCase.id} testCase={testCase} updateChecked={() => doUpdate(testCase.id)} />
        })}
    </tbody>
}

const pageSize = 10

function TablePagination({totalItems, pageNumber,setPageNumber}) {
    const totalPages = Math.ceil(totalItems / pageSize)

    return <thead className='ActionBar'>
        <tr>
            <td colSpan="9" style={{ textAlign: 'right' }}>
                <div className="pagination">
                    <button onClick={() => setPageNumber(pageNumber - 1)} disabled={pageNumber === 0}>Previous</button>
                    <span>
                        Page <input type="number" max={totalPages} min={1} step={1} value={pageNumber + 1} onChange={e => setPageNumber(Math.max(0, Math.min(totalPages - 1, e.target.value - 1)))} /> / {totalPages}
                    </span>
                    <button onClick={() => setPageNumber(pageNumber + 1)} disabled={totalItems < pageSize}>Next</button>
                </div>
            </td>
        </tr>
    </thead>
}

export function TestCaseTable({testCaseList, selectAllToggle, selectionText, testCaseSelection}) {
    const [pageNumber, setPageNumber] = useState(0)
    const [visibleList,setVisibleList] = useState(testCaseList.slice(0,10))
    useEffect(() => {
        const range = [pageNumber * pageSize, (pageNumber + 1) * pageSize]
        const useList = testCaseList.slice(range[0], range[1])
        setVisibleList(useList)
    }, [pageNumber, testCaseList])

    const totalPages = Math.ceil(testCaseList.length / pageSize)

    return <table id="test-case-list">
        <thead className='ActionBar'>
            <tr>
                <td colSpan="9" style={{ textAlign: 'right' }}>
                    <div className="pagination">
                        <button onClick={() => setPageNumber(pageNumber - 1)} disabled={pageNumber === 0}>Previous</button>
                        <span>
                            Page <input type="number" max={totalPages} min={1} step={1} value={pageNumber + 1} onChange={e => setPageNumber(Math.max(0, Math.min(totalPages - 1, e.target.value - 1)))} /> / {totalPages}
                        </span>
                        <button onClick={() => setPageNumber(pageNumber + 1)} disabled={visibleList.length < pageSize}>Next</button>
                    </div>
                </td>
            </tr>
        </thead>
        <TableHeader selectAllToggle={selectAllToggle} selectionText={selectionText} isEditable={true} />
        <TestCaseListBody testCases={visibleList} toggleSelection={testCaseSelection} />
    </table>
}

export function TestCaseViewTable({testCaseList}) {
    const [pageNumber, setPageNumber] = useState(0)
    const [visibleList,setVisibleList] = useState(testCaseList.slice(0,10))
    useEffect(() => {
        const range = [pageNumber * pageSize, (pageNumber + 1) * pageSize]
        const useList = testCaseList.slice(range[0], range[1])
        setVisibleList(useList)
    }, [pageNumber, testCaseList])

    return <table id="test-case-list">
        <TablePagination totalItems={testCaseList.length} pageNumber={pageNumber} setPageNumber={setPageNumber} />
        <TableHeader isEditable={false} />
        <TestCaseViewListBody testCases={visibleList} />
    </table>
}
