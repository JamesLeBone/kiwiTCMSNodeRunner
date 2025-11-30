'use server'
import DatabaseStatus from './components/DatabaseStatus'
import { ComponentSection } from '@/components/ComponentSection'

export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Setup`
    }
}

export default async function Setup() {
    return <main>
        <h1>{process.env.APP_TITLE} - Setup</h1>

        <ComponentSection header="Status">
            <div style={{display: 'grid', gap: '1em', gridTemplateColumns: '32px 3fr 1fr'}}>
                <DatabaseStatus />
            </div>
        </ComponentSection>
    </main>
}
