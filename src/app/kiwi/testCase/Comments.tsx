'use client'
import KiwiComments from '@/components/kiwi/KiwiComments'
import { ComponentSection } from '@/components/ComponentSection'
import type { Comment } from '@server/kiwi/Comments'

declare type CommentsProps = {
    id: number
    comments: Comment[]
}
export default function TestCaseComments({id, comments}: CommentsProps) {
    return <ComponentSection header="Comments">
        <KiwiComments idValue={id} comments={comments} />
    </ComponentSection>
}
