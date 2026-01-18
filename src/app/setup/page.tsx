'use server'
import DatabaseStatus from './components/DatabaseStatus'
import SMTPStatus from './components/SMTPStatus'
import KiwiDbStatus from './components/KiwiDbStatus'

import { headers } from 'next/headers';
import ServerResponse from '@/components/ServerResponse';

export async function generateMetadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Setup`
    }
}

const getHostDetails = async function() {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.KIWI_PROTOCOL || 'http';
    return protocol + '://' + host
}

const compareHostDetails = async function(processHost?: string) {
    const hostDetails = await getHostDetails()
    if (typeof processHost == 'undefined' || processHost.trim().length == 0) {
        const message = `TOOLBOX_HOST environment variable is not set. Update your .env file to include TOOLBOX_HOST=${hostDetails}`
        return <ServerResponse type='error'>
            <p>{message}</p>
        </ServerResponse>
    }
    if (processHost === hostDetails) return;
    const message = `TOOLBOX_HOST environment variable (${processHost}) does not match the current host (${hostDetails}). Update your .env file to include TOOLBOX_HOST=${hostDetails}`
    return <ServerResponse type='error'>
        <p>{message}</p>
    </ServerResponse>
}

export default async function Setup() {
    const processHost = process.env.TOOLBOX_HOST
    const warning = await compareHostDetails(processHost)

    return <main>
        <h1>{process.env.APP_TITLE} - Setup</h1>
        {warning}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <DatabaseStatus />
            <SMTPStatus />
            <KiwiDbStatus />
        </div>
    </main>
}
