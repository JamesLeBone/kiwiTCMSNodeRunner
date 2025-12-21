'use client'
import { useState,Fragment } from 'react';
import { ActionBar, ActionButton } from '@/components/Actions'
import { FormField } from '@/components/FormField'
import { InputField } from '@/components/InputField'

import * as conn from '@server/kiwi/Comments'

import './comments.css'

function Comment({comment}) {
    console.debug('Comment: ' ,comment)
    const date = new Date(comment.submitDate).toLocaleString()
    
    return <Fragment>
        <div>{comment.comment}</div>
        <span>{comment.userName}</span>
        <span className="date">{date}</span>
    </Fragment>
}

export default function KiwiComments({comments,idValue, hostEntity='TestCase', idKey='case_id'}) {
    const newComment = useState('')
    // console.debug(comments)
    
    const commentList = useState(
        comments.map(comment => <Comment key={comment.id} comment={comment} />)
    )

    const addComment = () => {
        const text = newComment[0]
        if (text.length == 0) return
        conn.add(text, idValue, hostEntity, idKey)
        .then(result => {
            if (!result.status) return
            const newComments = result.message.map(comment => <Comment key={comment.id} comment={comment} />)
            commentList[1](newComments)
            newComment[1]('')
        })
    }
    
    return <div>
        <div className='comment-list'>{commentList[0]}</div>
        <fieldset>
            <FormField label="New Comment" style={{gridColumn:'1/-1'}}>
                <InputField textarea={true} state={newComment} style={{width:'100%'}} />
            </FormField>
        </fieldset>
        <ActionBar>
            <ActionButton action={addComment} text="Add" className={['idle']} />
        </ActionBar>
    </div>

}