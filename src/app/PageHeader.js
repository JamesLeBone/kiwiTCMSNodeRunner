'use client'

import Link from 'next/link'
import Menu from './Menu.js'

const KiwiLinks = [
    {url:'/kiwi', title:'Index'},
    {url:'/kiwi/testCase', title:'Create Test Case'},
    {url:'/kiwi/plan', title:'Create Test Plan'},
]

export default function PageHeader() {
    const toggleMenu = (e) => {
        const nav = document.querySelector('body > header > nav')
        if (nav.className.includes('active')) {
            nav.className = nav.className.replace(' active', '')
        } else {
            nav.className += ' active'
        }
        console.debug(nav.className)
    }

    return <header>
        <span id='nav-button' onClick={toggleMenu}><i className='fa fa-bars'></i><span>Menu</span></span>
        <nav>
            <Menu list={KiwiLinks}>Kiwi Testing</Menu>
            <Link href='/uac' className='right' title='Settings'>
                <i className='fa fa-cog'></i>
            </Link>
        </nav>
    </header>
}
