'use client'
import { ComponentSection } from '@/components/ComponentSection'
import { TestCase } from '@server/kiwi/TestCase'
import CaseScript from './CaseScript';
import ChildrenScripts from './ChildrenScripts';

declare type CommentsProps = {
    testCaseId: number
    script?: number|string
    children: TestCase[]
}
export default function TestCaseLineage(props: CommentsProps) {
    return <ComponentSection header="Scripts">
        <CaseScript testCaseId={props.testCaseId} script={props.script} />
        <ChildrenScripts scriptList={props.children} />
    </ComponentSection>
}
