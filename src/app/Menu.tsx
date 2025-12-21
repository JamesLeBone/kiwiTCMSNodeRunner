import Link from 'next/link'

export default function Menu({children,list} : {children:React.ReactNode, list:{url:string, title:string}[]}) {
    const items = list.map(link => {
        return <Link key={link.title} href={link.url} style={{whiteSpace:'nowrap'}}>{link.title}</Link>
    })

    return <div className="menu-list">
        <span>{children} <i className="fa-solid fa-caret-down"></i></span>
        <ul>{items}</ul>
    </div>
}
