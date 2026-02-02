'use client'

import Link from 'next/link'

const KiwiLinks = [
    {url:'/kiwi/testCase/search', title:'Cases', icon: 'fa fa-briefcase'},
    {url:'/kiwi/plan', title:'Plans', icon: 'fa fa-list-check'},
    {url:'/kiwi/execution', title:'Executions', icon: 'fa fa-bolt'},
    {url:'/kiwi/product', title:'Products', icon: 'fa fa-boxes'},
]

export default function PageHeader({userName} : {userName:string}) {
    const items = KiwiLinks.map(link => {
        return <Link key={link.title} href={link.url} title={link.title}>
            <i className={link.icon}></i>
            <span>{link.title}</span>
        </Link>
    })

    const uacLink = userName === '' ? null : <Link className='right nav-separator' href='/uac/credentials' title='Settings'>{userName}</Link>

    return <header>
        <nav>
            { items }
            { uacLink }
            <Link href='/uac' className='right' title='Settings'>
                <i className='fa fa-cog'></i>
            </Link>
            <Link href='/' className='right' title='Home'>
                <i className='fa fa-home'></i>
            </Link>
        </nav>
    </header>
}
