'use client'

import Link from 'next/link'

const KiwiLinks = [
    {url:'/kiwi/testCase', title:'Case', icon: 'fa fa-briefcase'},
    {url:'/kiwi/plan', title:'Plan', icon: 'fa fa-list-check'},
    {url:'/kiwi/execution', title:'Execution', icon: 'fa fa-bolt'},
]

export default function PageHeader({userName} : {userName:string}) {
    const items = KiwiLinks.map(link => {
        return <Link key={link.title} href={link.url} title={link.title}>
            <i className={link.icon}></i>
            <span>{link.title}</span>
        </Link>
    })

    return <header>
        <nav>
            { items }
            <span className='right nav-separator'>{userName}</span>
            <Link href='/uac' className='right' title='Settings'>
                <i className='fa fa-cog'></i>
            </Link>
            <Link href='/' className='right' title='Home'>
                <i className='fa fa-home'></i>
            </Link>
        </nav>
    </header>
}
