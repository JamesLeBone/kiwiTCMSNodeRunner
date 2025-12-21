'use server'
import * as Users from '@server/Users'

import UacAccessToken from './UacAccessToken'
import { redirect } from 'next/navigation'

// This only works on server components, on the client side you need to use useEffect to set document.title
export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - User accounts`
    }
}

const determineUser = async (searchParams : { accessToken?: string, userId?: string })  => {
    if (typeof searchParams.accessToken == 'undefined' || typeof searchParams.userId == 'undefined') {
        return redirect('/uac')
    }
    if (isNaN(Number.parseInt(searchParams.userId))) {
        return redirect('/uac')
    }
    if (typeof searchParams.accessToken !== 'string' || searchParams.accessToken.length < 10) {
        return redirect('/uac')
    }
    const userIdNumber = Number.parseInt(searchParams.userId)
    if (isNaN(userIdNumber) || userIdNumber < 1) {
        return redirect('/uac')
    }

    const vfUserPromise = await Users.verifyToken(userIdNumber, searchParams.accessToken)
    if (!vfUserPromise.status || !vfUserPromise.data) {
        return redirect('/uac')
    }
    
    return {
        verifiedUser : vfUserPromise.data,
        accessToken: searchParams.accessToken
    }
}

export default async function UserPage({params,searchParams} : NextPageProps) {
    const sp = await searchParams

    const vu = await determineUser(sp)

    return <UacAccessToken verifiedUser={vu.verifiedUser} accessToken={vu.accessToken} />

}

