'use server'

import * as Auth from '@server/Auth'
import UacUnauthorised from './UacUnauthorised'
import UACNavigation from './UacNavigation'

export default async function UACLayout({children} : {children: React.ReactNode}) {
    // Call is cached per request
    const userInfo = await Auth.currentUser()
    if (!userInfo.status || !userInfo.data) {
        // console.info('User unauthorised')
        return <UacUnauthorised />
    }

    return <>
        <UACNavigation />
        {children}
    </>
}