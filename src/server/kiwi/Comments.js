'use server'
import {http,methods} from './Kiwi'
import {reply} from '@lib/ServerMessages'

const get = async (idValue, hostEntity='TestCase', idKey='case_id') => {
    const params = {}
    params[idKey] = idValue
    return http.reference(hostEntity, 'comments', params)
    .then(results => typeof results == 'undefined' ? [] : results.map(result => {
        const zresult = methods.djangoEntity(result)
        zresult.addZulu('submitDate')
        return zresult.values
    }))
    .catch( e => {
        console.error('Failed to get comments', e)
        return []
    })
}
const getComments = async (idValue, hostEntity='TestCase', idKey='case_id') => get(idValue, hostEntity, idKey)
.then(comments => reply(true, comments))

const add = async (comment,idValue, hostEntity='TestCase', idKey='case_id') => {
    const params = {comment}
    params[idKey] = idValue
    console.debug('Adding comment', params)

    const result = await http.callDjango(hostEntity+'.add_comment', params)
    .then(result => {
        console.debug(result)
        return get(idValue, hostEntity, idKey)
            .then(comments => reply(true, comments))
    }, reject => {
        console.error('Failed to add comment', reject)
        return reply(false, 'Failed to add comment')
    })
    return result
}

export {
    get,
    getComments,
    add
}