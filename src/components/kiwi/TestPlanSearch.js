'use client'

import { useState } from 'react';
import Link from 'next/link'
import { useMessage } from '@/components/ServerResponse'

import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar, ActionButtonText } from '@/components/Actions'

import * as tpc from '@server/kiwi/TestPlan'

export default function TestPlanSearch({}) {
    const idState = useState('')
    const nameState = useState('')
    
    const testPlanList = useState([])
    const status = useMessage()

    const loadHandler = ({textValue}) => {
        status.loading()
        const id = textValue.trim()
        if (id == '') {
            status.clear()
            console.info('No ID')
            return
        }

        const action = 'Load Test Plan'
        tpc.get(id)
        .then(result => {
            if (result.status) {
                status.success( 'Found Test Plan')
                testPlanList[1]([result.message])
                return
            }
            status.error(result.message)
        })
        .catch(e => status.error(e.message))
    }
    
    const searchHandler = ({textValue}) => {
        status.loading()
        
        const name = textValue.trim()
        if (name == '') {
            status.clear()
            return
        }
        const action = 'Search'
        tpc.search({name:name})
        .then(result => {
            if (result.status) {
                const list = result.message
                status.success( `List obtained - ${list.length} items`)
                testPlanList[1](list)
                return
            }
            status.error(result.message)
        })
        .catch(e => status.error(e.message))
    }
    
    return <ComponentSection header="Test Plan Search">
        { status.message }
        <Results testPlans={testPlanList[0]} />
        <ActionBar>
            <ActionButtonText   action={searchHandler} state={nameState} >Search by name</ActionButtonText>
            <ActionButtonText type="number" step="1"   action={loadHandler} state={idState} >Load by ID</ActionButtonText>
            <Link href="/kiwi/plan/82">Smoke Test Plan</Link>
            <Link href="/kiwi/plan">Create new</Link>
        </ActionBar>
    </ComponentSection>
}

function TestPlanRow({plan}) {
    const path = "/kiwi/plan/"+plan.id
    const clickAction = e => window.location = path
    return <tr className="clickable" onClick={clickAction}>
        <td className="numeric"><Link href={path}>{plan.id}</Link></td>
        <td className="textual"><Link href={path}>{plan.name}</Link></td>
        <td className="link"><Link href={path}>Link</Link></td>
    </tr>
}

function Results({testPlans}) {
    // https://nextjs.org/docs/pages/building-your-application/routing/linking-and-navigating
    const listItems = testPlans.map(plan => <TestPlanRow key={plan.id} plan={plan} />)
    const className = listItems.length == 0 ? 'hidden' : 'visible'
    
    return <table id="TestPlanResults" className={className} style={{marginBottom:'1em'}}>
        <thead>
            <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Link</th>
            </tr>
        </thead>
        <tbody>
            {listItems}
        </tbody>
    </table>
}
