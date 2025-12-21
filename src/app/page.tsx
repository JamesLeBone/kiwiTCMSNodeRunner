'use server'

import Link from 'next/link'

export async function generateMetadata() {
    return {
        title: process.env.APP_TITLE || 'Kiwi TCMS Toolbox'
    }
}

const kiwiHost = process.env.KIWI_HOST || 'http://localhost'

export default async function Home() {
    const title = process.env.APP_TITLE || 'Kiwi TCMS Toolbox'

    return <main>
        <h1>{title}</h1>

        <div style={{margin: 'auto 2em'}}>
            <h2>Helpful links</h2>
            <p>
                <Link href="https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.html#module-tcms.rpc.api">Kiwi API Docs</Link><br/>
                <Link href={kiwiHost} target="kiwiLocal">Kiwi</Link>
            </p>
        </div>
    </main>
}
