'use client'
import KiwiComments from '@/components/kiwi/KiwiComments'
import { ComponentSection } from '@/components/ComponentSection'
import type { Comment } from '@server/kiwi/Comments'

type CommentsProps = {
    testCaseId: number
    comments: Comment[]
}
export default function TestCaseComments({testCaseId, comments}: CommentsProps) {
    return <ComponentSection header="Comments">
        <KiwiComments id={testCaseId} comments={comments} />
    </ComponentSection>
}
