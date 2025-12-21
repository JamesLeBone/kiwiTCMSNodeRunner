import { useState } from 'react';
import Link from 'next/link'
import styles from './page.module.css'

function CaseScriptItem({id,summary,status,securityGroupId}) {
    const url = '/kiwi/testCase/'+id

    // console.debug(securityGroupId)
    
    return <Link href={url}>{id} : {summary} - {securityGroupId}</Link>
}

export default function ChildrenScripts({scriptList}) {
    scriptList = scriptList.map(li => {
        return <CaseScriptItem key={li.id} {...li} />
    })
    
    return <nav className={styles.childScriptList}>
        {scriptList}
    </nav>
    
}
