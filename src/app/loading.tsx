import * as hc from '@server/HealthCheck'
import { redirect } from 'next/navigation'

export default async function Loading() {
    const dbReady = await hc.dbReady()
    if (!dbReady) {
        // This won't redirect if you're already on /setup
        redirect('/setup')
    }

    return <>Loading...</>
}
