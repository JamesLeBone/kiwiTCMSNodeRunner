'use server'
import DatabaseStatus from './components/DatabaseStatus'
import SMTPStatus from './components/SMTPStatus'
import KiwiDbStatus from './components/KiwiDbStatus'

export async function generateMetadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Setup`
    }
}

export default async function Setup() {
    return <main>
        <h1>{process.env.APP_TITLE} - Setup</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <DatabaseStatus />
            <SMTPStatus />
            <KiwiDbStatus />
        </div>
    </main>
}
