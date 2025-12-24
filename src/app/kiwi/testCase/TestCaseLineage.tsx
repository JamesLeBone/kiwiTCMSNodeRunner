'use client'
import { TestCase } from '@server/kiwi/TestCase'
import CaseScript from './CaseScript';
import ChildrenScripts from './ChildrenScripts';

type CommentsProps = {
    testCaseId: number
    script?: number|string
    children: TestCase[]
}
export default function TestCaseLineage(props: CommentsProps) {
    return <>
        <CaseScript testCaseId={props.testCaseId} script={props.script} />
        <ChildrenScripts scriptList={props.children} />
    </>
}
