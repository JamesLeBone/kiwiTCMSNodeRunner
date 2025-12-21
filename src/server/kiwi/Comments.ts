'use server'
import {http,methods} from './Kiwi'
import { updateOpSuccess, prepareStatus } from '@lib/Operation'

declare type CommentAttachable = 'TestCase' | 'TestPlan' | 'TestRun'  | 'TestExecution'
// declare type AttachKey = 'case_id' | 'plan_id' | 'run_id' | 'execution_id'

declare type AttachKeyObj = {
    comment? : string
    case_id?: number
    plan_id?: number
    run_id?: number
    execution_id?: number
}
const getParam = (hostEntity: CommentAttachable, idValue: number) : AttachKeyObj => {
    if (hostEntity == 'TestPlan') {
        return {plan_id: idValue}
    } else if (hostEntity == 'TestRun') {
        return {run_id: idValue}
    } else if (hostEntity == 'TestExecution') {
        return {execution_id: idValue}
    }
    return {case_id: idValue}
}

declare type CommentAuthor = {
    id: number
    name: string
    email: string
    url: string
}

export interface Comment {
    id: number
    submitDate: string
    contentType: 'text/plain' | 'application/json'
    author: CommentAuthor
    body: string | object
}

export const fetch = async (idValue: number, hostEntity: CommentAttachable) : Promise<Comment[]> => {
    const params = getParam(hostEntity, idValue)
    const reply = await http.reference(hostEntity, 'comments', params)
    .catch( e => {
        console.error('Failed to get comments', e)
        return undefined
    })

    if (!reply) return []
    const listReply = Array.isArray(reply) ? reply : [reply]
    return listReply.map(result => {
        const zresult = methods.djangoEntity(result)
        zresult.addZulu('submitDate')
        console.debug('Fetched comment, TODO: define the type', zresult)
        const comment = {
            id: zresult.values.id,
            submitDate: zresult.values.submitDate,
            contentType: 'text/plain',
            author: {
                id: zresult.values.user_id,
                name: zresult.values.user_name,
                email: zresult.values.user_email,
                url: zresult.values.user_url
            },
            body: ''
        } as Comment
        const rawBody = zresult.values.comment as string

        if (rawBody[0] == '{' || rawBody[0] == '[') {
            try {
                comment.body = JSON.parse(rawBody.replaceAll(/&quot;/g,'"'))
                comment.contentType = 'application/json'
            } catch (e) {}
        }
        if (comment.contentType == 'text/plain') {
            comment.body = methods.htmlDecode(rawBody)
        }
        return comment
    })
}

export const add = async (comment:string, idValue:number, hostEntity: CommentAttachable) => {
    const params = getParam(hostEntity, idValue)
    params.comment = comment
    console.debug('Adding comment', params)

    const op = prepareStatus('addComment')

    await http.callDjango(hostEntity+'.add_comment', params)
    .then(result => {
        updateOpSuccess(op, 'Comment added successfully')
    }, reject => {
        console.error('Failed to add comment', reject)
        op.message = reject?.message || 'Failed to add comment'
    })
    return op
}
