'use client'

import Link from 'next/link'
import { useState } from 'react';
import { ActionBar, ActionButton } from '@/components/Actions'

import * as conn from '@server/kiwi/TestCase.js'
import * as tp from '@server/kiwi/TestPlan.js'

function TestPlanItem({id,name,removeAction}) {
    const url = "/kiwi/plan/"+id

    const removeItem = e => {
        e.preventDefault()
        removeAction(id)
    }

    return <li>
        <Link href={url}>{id} - {name}</Link>
        <button onClick={removeItem}>Remove</button>
    </li>
}

export default function TestPlanList({testCaseId, list}) {
    const listData = useState(list ?? [])
    const buildList = data => data.map(plan => {
        return <TestPlanItem key={plan.id} id={plan.id} name={plan.name} removeAction={() => removeFromTestPlan(plan.id)} />
    })
    const planList = useState(buildList(list))

    const reload = () => {
        conn.getPlanRequest(testCaseId).then(r => {
            console.debug(testCaseId, r)
            if (!r.status) return
            listData[1](r.message)
            planList[1](buildList(r.message))
        })
    }

    const addToPlan = actionData => {
        const planId = Number.parseInt(actionData.textValue)
        if (isNaN( planId )) return
        return conn.addToPlan(testCaseId, planId).then(reload)
    }
    const addToSmoke = () => conn.addToPlan(testCaseId).then(reload)
    const removeFromTestPlan = testPlanId => conn.removeFromPlan(testCaseId, testPlanId).then(reload)
    const addToNewPlan = actionData => {
        const planName = actionData.textValue
        if (planName === '') return
        return tp.create({
            summary: planName,
            isActive:true,
            name: planName
        })
            .then(r => {
                if (!r.status) return
                console.debug(r)
                const newPlan = r.message
                return conn.addToPlan(testCaseId, newPlan.id)
            })
            .then(reload)
    }
    

    return <div>
        <ul className="actionable-list">{planList[0]}</ul>
        <ActionBar>
            <ActionButton action={addToPlan} >Add to plan</ActionButton>
            <ActionButton action={addToNewPlan} >Add to new plan</ActionButton>
            <ActionButton action={reload} >Reload</ActionButton>
            <ActionButton action={addToSmoke}>Add to smoke test</ActionButton>
        </ActionBar>
    </div>
}
