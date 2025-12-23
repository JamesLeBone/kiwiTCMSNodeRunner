'use server'

import {http,methods, unAuthenticated} from './Kiwi'
import { updateOpSuccess, prepareStatus, updateOpError } from '@lib/Operation'
import { fetchTestCase, TestCase } from './TestCase'

export type ComponentAttachable = 'TestCase' | 'TestPlan'
const entityName = 'Component'

export type IndividualComponent = {
    id: number
    name: string
    cases: number
}
interface RawAmalgomatedComponent {
    id: number
    name: string
    cases: number[]
    plans: number[]
}
export type AmalgomatedComponent = {
    id: number
    name: string
    cases: TestCase[]
    // plans: 
}

export const amalgomateComponents = async (list: IndividualComponent[]) : Promise<AmalgomatedComponent[]> => {
    const componentList = {} as Record<number, RawAmalgomatedComponent>
    for (const component of list) {
        const testCaseId = component.cases
        const componentId = component.id

        
        if (typeof componentList[componentId] == 'undefined') {
            const ac = {
                id: componentId,
                name: component.name,
                cases: [],
                plans: []
            } as RawAmalgomatedComponent
            componentList[componentId] = ac
        }
        if (testCaseId != null) {
            componentList[componentId].cases.push(testCaseId)
        }
    }
    
    const resultList = Object.values(componentList)
    resultList.sort((a,b) => {
        if (a.name > b.name) return 1
        return b.name > a.name ? -1:0
    })

    const composedList = [] as AmalgomatedComponent[]
    for (const component of resultList) {
        const amalgomatedComponent = {
            id: component.id,
            name: component.name,
            cases: [] as TestCase[]
        } as AmalgomatedComponent

        for (const testCaseId of component.cases) {
            const testCase = await fetchTestCase(testCaseId)
            if (!testCase) continue // This should not happen
            amalgomatedComponent.cases.push(testCase)
        }
        composedList.push(amalgomatedComponent)
    }

    return composedList
}

export const fetch = async (id:number) : Promise<AmalgomatedComponent | null> => {
    return await http.get<IndividualComponent>(entityName, id)
    .then(djangoComponent => amalgomateComponents([djangoComponent]))
    .then(components => components.length > 0 ? components[0] : null)
}
export const search = async (name:string) : Promise<AmalgomatedComponent[]> => {
    const params = { name__icontains: name }
    const list = await http.searchEntity<IndividualComponent>(entityName, params, false)

    return amalgomateComponents(list)
}

export const componentCases = async (testCaseId: number) : Promise<AmalgomatedComponent[]> => {
    const params = { cases: testCaseId }
    const list = await http.searchEntity<IndividualComponent>(entityName, params, false)

    return amalgomateComponents(list)
}

export const createComponent = async (componentName:string, description:string, product:number) => {
    const login = await http.login()
    if (!login) return unAuthenticated
    const c = await createNewComponent(componentName, description, product)
    const op = prepareStatus(`createComponent`)
    if (!c) {
        return op.message = 'Failed to create component', op
    }
    updateOpSuccess(op, `Component created successfully`)
    return op
}

const createNewComponent = async (componentName:string, description:string, product:number) : Promise<any|false> => {
    const createComponent = await http.call('Component.create', {values:{
        name:componentName,
        description:description,
        product:product
    }})
    .then(newComponent => newComponent, createError => {
        console.error('Failed to create component', createError)
        return false
    })
    
    return createComponent
}

export const update = async (componentId:number, componentName:string, description:string) => {
    const login = await http.login()
    if (!login) return unAuthenticated

    const op = prepareStatus('UpdateComponent')

    await http.call('Component.update', {
        component_id:componentId,
        values:{name:componentName, description}}
    )
    .then(reply => {
        updateOpSuccess(op, 'Component updated successfully')
    }, rejection => {
        console.error('Failed to update component', rejection)
        updateOpError(op, 'Failed to update component')
    })
    return op
}

export const hasComponent = async (componentName:string, testCaseId:number) => {
    const componentExists = await http.call(`Component.filter`, {query:{
        case_id:testCaseId,
        name:componentName
    }})
    if (componentExists.length > 0) return true
    return false
}

// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testcase.html#tcms.rpc.api.testcase.add_component
export const addTo = async (componentName:string, id:number, entityName:ComponentAttachable='TestCase') => {
    const login = await http.login()
    if (!login) return unAuthenticated

    const op = prepareStatus(`attachComponent`)

    if (await hasComponent(componentName, id)) {
        updateOpSuccess(op, 'Component already attached')
        return op
    }

    const method = `${entityName}.add_component`
    if (entityName != 'TestCase') {
        updateOpError(op, 'Entity not supported for addTo')
        return op
    }

    const args = {
        component:componentName,
        case_id: id
    }

    const productId = await fetchTestCase(id)
        .then(tc => {
            if (!tc) return null
            return tc.product.id
        })
    if (!productId) {
        updateOpError(op, 'Failed to determine the product of the associated Test Case')
        return op
    }

    const componentExists = await http.call(`Component.filter`, {query:{
        name:componentName,
        product:productId
    }})
    if (componentExists.length == 0) {
        const c = await createNewComponent(componentName, componentName, productId)
        if (!c) {
            return updateOpError(op, 'Failed to create new component')
        }
        console.debug('Created new component', c)
    }
    
    console.debug('Calling', method, args)

    await http.call(method, args)
    .then(
        r => updateOpSuccess(op, 'Component added successfully')
        , rejection => updateOpError(op, 'Failed to add component to entity')
    )

    return op
}

// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testcase.html#tcms.rpc.api.testcase.remove_component
export const removeFrom = async (componentId:number, id:number, entityName='TestCase') => {
    const login = await http.login()
    if (!login) return unAuthenticated

    const args = {
        component_id:componentId
    }
    const sendArg = entityName === 'TestCase' ? {...args, case_id:id} : {...args, plan_id:id}

    const result = await http.call(`${entityName}.remove_component`, sendArg)
    .then(r => true, r => {
        console.error('Failed to remove component from entity', r)
        return false
    })
    const op = prepareStatus(`removeComponent`)
    if (result) {
        updateOpSuccess(op, 'Component removed successfully')
    } else {
        updateOpError(op, 'Failed to remove component from entity')
    }
    return op
}
