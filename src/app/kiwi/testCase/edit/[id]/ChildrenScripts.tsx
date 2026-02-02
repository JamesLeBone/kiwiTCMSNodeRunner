import Link from 'next/link'
import type { TestCase } from '@server/kiwi/TestCase'

function CaseScriptItem(props: TestCase) {
    const url = '/kiwi/testCase/'+props.id
    const id = props.id
    const summary = props.summary
    const securityGroupId = props.securityGroupId ? ' - ' + props.securityGroupId : ''

    return <li>
        <Link href={url} style={{display:'block'}}>{id} : {summary} {securityGroupId}</Link>
    </li>
}

export default function ChildrenScripts({scriptList} : {scriptList: TestCase[]}) {
    return <div>
        <legend style={{padding:'4px'}}>Scripts that reference this test case</legend>
        <ul style={{listStyleType: 'none', paddingLeft: 0}}>
            {scriptList.map(li => <CaseScriptItem key={li.id} {...li} />)}
        </ul>
    </div>
    
}
