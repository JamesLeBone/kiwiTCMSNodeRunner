'use server'
import { DjangoEntity, htmlEntityDecode } from './Django'
import { http, methods } from './Kiwi'
import { updateOpSuccess, prepareStatus, TypedOperationResult } from '@lib/Operation'

export type CommentAttachable = 'TestCase' | 'TestPlan' | 'TestRun'  | 'TestExecution'
// type AttachKey = 'case_id' | 'plan_id' | 'run_id' | 'execution_id'

type AttachKeyObj = {
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

type CommentAuthor = {
    id: number
    name: string
    email: string
    url: string
}

export interface Comment {
    id: number
    submitDate: Date
    contentType: 'text/plain' | 'application/json'
    author: CommentAuthor
    body: string | object
}

const parseKiwiComment = (rawComment: DjangoEntity) : Comment => {
    rawComment.addZulu('submitDate')
    const rawBody = htmlEntityDecode(rawComment.values.comment as string)
    
    const comment = {
        id: rawComment.values.id,
        submitDate: rawComment.values.submitDate,
        contentType: 'text/plain',
        author: {
            id: rawComment.values.user_id,
            name: rawComment.values.user_name,
            email: rawComment.values.user_email,
            url: rawComment.values.user_url
        },
        body: rawBody
    } as Comment

    if (rawBody[0] == '{' || rawBody[0] == '[') {
        try {
            comment.body = JSON.parse(rawBody)
            comment.contentType = 'application/json'
        } catch (e) {}
    }
    return comment
}

export const fetch = async (idValue: number, hostEntity: CommentAttachable) : Promise<(Comment)[]> => {
    const params = getParam(hostEntity, idValue)
    const reply = await http.reference(hostEntity, 'comments', params)
    .then(reply => {
        if (!Array.isArray(reply)) reply = [reply]
        return reply.map( (rawComment: DjangoEntity) => parseKiwiComment(rawComment) )
    })
    .catch( e => {
        console.error('Failed to get comments', e)
        return [] as (Comment)[]
    })
    return reply
}

export const add = async (comment:string, idValue:number, hostEntity: CommentAttachable) => {
    const params = getParam(hostEntity, idValue)
    params.comment = comment
    console.debug('Adding comment', params)

    const op = prepareStatus('addComment') as TypedOperationResult<Comment>

    await http.callDjango(hostEntity+'.add_comment', params)
    .then(result => {
        updateOpSuccess(op, 'Comment added successfully')
        op.data = parseKiwiComment(result)
    }, reject => {
        console.error('Failed to add comment', reject)
        op.message = reject?.message || 'Failed to add comment'
    })
    return op
}
