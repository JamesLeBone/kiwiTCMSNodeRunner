'use client'
import { useState,useActionState } from 'react'
import Form from 'next/form'
import { FormInputField, FormActionBar, validationError, blankStatus, FormSelection } from '@/components/FormActions'

import * as Comments from '@server/kiwi/Comments'
import './comments.css'

function Comment({comment} : {comment: Comments.Comment}) {
    const date = new Date(comment.submitDate).toLocaleString()

    const textBody = typeof comment.body == 'object' ? JSON.stringify(comment.body, null, 2) : comment.body
    return <>
        <div>{textBody}</div>
        <span>{comment.author.name}</span>
        <span className="date">{date}</span>
    </>
}

function CommentList({comments} : {comments: Comments.Comment[]}) {
    if (comments.length == 0) return <></>
    return <div className='comment-list'>{comments.map(comment => 
        <Comment key={comment.id} comment={comment} />
    )}</div>
}

type CommentParams = {
    comments: Comments.Comment[]
    id: number
    hostEntity?: Comments.CommentAttachable
}
export default function KiwiComments(params : CommentParams) {
    const [comments,setComments] = useState(params.comments)

    const [state, submitForm, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const comment = formData.get('comment') as string

            const result = await Comments.add(
                comment,
                params.id,
                params.hostEntity ? params.hostEntity : 'TestCase'
            )
            if (result && result.data) {
                const newComments = [...comments, result.data]
                setComments(newComments)
            }
            return result
        },
        blankStatus('addComment')
    )
    
    return <>
        <CommentList comments={comments} />
        <Form action={submitForm}>
            <fieldset>
                <FormInputField label="New Comment" name="comment" />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={'Add Comment'} />
        </Form>
    </>
}