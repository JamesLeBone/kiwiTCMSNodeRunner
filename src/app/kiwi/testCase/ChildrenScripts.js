import Link from 'next/link'

function CaseScriptItem({id,summary,status,securityGroupId}) {
    const url = '/kiwi/testCase/'+id

    return <Link href={url}>{id} : {summary} - {securityGroupId}</Link>
}

export default function ChildrenScripts({scriptList}) {
    scriptList = scriptList.map(li => {
        return <CaseScriptItem key={li.id} {...li} />
    })
    
    return <nav>
        {scriptList}
    </nav>
    
}
