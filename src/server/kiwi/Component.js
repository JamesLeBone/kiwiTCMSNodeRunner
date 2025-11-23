'use server'

import {http,methods} from './Kiwi'
import {reply} from '../lib/ServerMessages'

const entityName = 'Component'

const django2Case = dj => {
    dj.convertJson('arguments')
    dj.addZulu('createDate')
    const tc = dj.values
    tc.arguments = tc.arguments ?? {}
    tc.securityGroupId = tc.arguments.securityGroupId ?? 'FULLADMIN'
    delete tc.arguments.securityGroupId
    return tc
}


const get = async (id) => {
    const list = await http.get(entityName, id)
    .then(results => results.values)
    .then(list => methods.amalgomateComponents([list]))
    
    if (list.length == 0) return reply(false, 'Component not found')

    const component = list[0]
    for (let idx in component.cases) {
        const testCaseId = component.cases[idx]

        const testCase = await http.get('TestCase', testCaseId).then(r => django2Case(r))
        component.cases[idx] = testCase
    }
    
    return reply(true, list[0])
}

// search({cases:testCaseId})
const search = async (params) => {
    console.info('Searching for', params)
    const list = await http.search(entityName, params)
    .then(results => results.map(result => result.values))
    .then(list => methods.amalgomateComponents(list))
    console.info('got',list.length + ' results')
    
    return reply(true, list)
}

const getAttached = async (sourceEntity, id) => {
    let param = {}
    if (sourceEntity == 'TestCase') {
        param.cases = id
    } else {
        throw new Error(`Entity not supported: ${sourceEntity}`)
    }
    
    // return http.search('Component', { cases: testCaseId }, false)
    // const searchResults = await http.search(sourceEntity, param,false)
    const searchResults = await http.search('Component', {'cases':id},false)
    // const workingExample = await http.search('Component', {'cases':2950}, false)
    const list = methods.amalgomateComponents(searchResults.map(result => result.values))
    console.debug('getAttached',list)
    return reply(true, list)
}

const create = async (componentId, componentName) => {
    return reply(false, 'Not implemented')
}

const update = async (componentId, componentName, description) => {
    const login = await http.login().then(sessionId => true, nv => false)
    if (!login) return reply(false, 'Failed to login, update requires permissions from UAC')

    return http.call('Component.update', {component_id:componentId, values:{name:componentName, description}})
    .then(reply => {
        return reply(true,'Component updated')
    }, rejection => {
        console.error('Failed to update component', rejection)
        return reply(false, 'Failed to update component')
    })

}

const hasComponent = async (componentName, testCaseId) => {
    const results = await http.search(entityName, {name:componentName, cases:testCaseId}, false)
    // console.debug('hasComponent', componentName, testCaseId, results)
    return results.length > 0
}

// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testcase.html#tcms.rpc.api.testcase.add_component
const addTo = async (componentName, id, entityName='TestCase') => {
    const loginResult = await http.login()
    if (!loginResult) {
        return reply(false, 'Failed to login to Kiwi')
    }

    if (await hasComponent(componentName, id)) {
        console.debug('Component already attached')
        return reply(false, 'Component already attached')
    }

    const args = {component:componentName}

    const method = `${entityName}.add_component`
    if (entityName != 'TestCase') {
        console.warn('Entity not supported for addTo:', entityName)
        return reply(false, 'Entity not supported')
    }
    args.case_id = id

    const componentExists = await http.call(`Component.filter`, {query:{name:componentName}}, false)
    if (componentExists.length == 0) {
        const createComponent = await http.call('Component.create', {values:{name:componentName, description:componentName, product:1}})
        .then(newComponent => newComponent, createError => {
            console.error('Failed to create component', createError)
            return false
        })
        if (!createComponent) {
            return reply(false, 'Failed to create new component')
        }
        console.debug('Created new component', createComponent)
    }
    
    console.debug('Calling', method, args)

    const addComponent = await http.call(`${entityName}.add_component`, args)
    .then(r => {
        return reply(true, r)
    }, async rejection => {
        console.debug('Response from addTo', rejection)
        return reply(false, rejection.message.message || 'Failed to add component')
    })
    return addComponent
}

// https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testcase.html#tcms.rpc.api.testcase.remove_component
const removeFrom = async (componentId, id, entityName='TestCase', primaryKey='case_id') => {
    await http.login()
    const args = {component_id:componentId}
    args[primaryKey] = id

    return http.call(`${entityName}.remove_component`, args)
    .then(r => reply(true, r), r => reply(false, r))
}


export {
    get,
    getAttached,
    create,
    search,
    addTo,
    update,
    removeFrom
}
