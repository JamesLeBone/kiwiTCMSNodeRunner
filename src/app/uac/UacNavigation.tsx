'use server'
import Link from 'next/link'

const links = [
    { name: 'Settings', url: '/uac' },
    { name: 'Credentials', url: '/uac/credentials' },
    { name: 'Setup', url: '/setup' }
]

export default async function UACNavigation() {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : ''

    return <nav>
        {links.map(({name, url}) => {
            const isActive = currentUrl === url
            return <Link key={url} href={url} className={isActive ? 'active' : ''}>{name}</Link>
        })}
    </nav>
}
