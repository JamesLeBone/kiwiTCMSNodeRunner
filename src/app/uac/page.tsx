'use server'
import * as Auth from '@server/Auth'
import * as Users from '@server/Users'

import type { OperationResult } from '@lib/Operation.js'
import UACControls from './UacControls'
import UacAccessToken from './UacAccessToken'
import UacUnauthorised from './UacUnauthorised'
import type { verifiedUser, CurrentUser } from '@server/lib/Users'

// This only works on server components, on the client side you need to use useEffect to set document.title
export async function metadata() {
    const title = process.env.APP_TITLE || 'Kiwi TCMS Toolbox'
    return { 
        title: `${title} - User accounts`
    }
}

declare interface userDeterminationResult {
    userType : 'currentUser' | 'verifiedUser' | 'unauthorised'
}
declare interface verifiedUserResult extends userDeterminationResult {
    verifiedUser : verifiedUser
    accessToken : string
    userId : number
}
declare interface currentUserResult extends userDeterminationResult {
    currentUser : CurrentUser
}

const checkUser = async () : Promise<userDeterminationResult> => {
    const cuo = await Auth.currentUser()
    if (!cuo.data) {
        return {
            userType: 'unauthorised'
        } as userDeterminationResult
    }
    return {
        userType: 'currentUser',
        currentUser: cuo.data
    } as currentUserResult
}

const determineUser = async (searchParams : { accessToken?: string, userId?: string }) : Promise<userDeterminationResult> => {
    if (typeof searchParams.accessToken == 'undefined' || typeof searchParams.userId == 'undefined') {
        return await checkUser()
    }
    if (isNaN(Number.parseInt(searchParams.userId))) {
        return await checkUser()
    }
    if (typeof searchParams.accessToken !== 'string' || searchParams.accessToken.length < 10) {
        return await checkUser()
    }
    const userIdNumber = Number.parseInt(searchParams.userId)
    if (isNaN(userIdNumber) || userIdNumber < 1) {
        return await checkUser()
    }

    const vfUserPromise = await Users.verifyToken(userIdNumber, searchParams.accessToken)
    if (!vfUserPromise.status || !vfUserPromise.data) {
        return { userType: 'unauthorised' } as userDeterminationResult
    }
    
    return {
        userType: 'verifiedUser',
        verifiedUser: vfUserPromise.data,
        accessToken: searchParams.accessToken,
        userId: userIdNumber
    } as verifiedUserResult
}

export default async function UserPage({params,searchParams} : NextPageProps) {
    const sp = await searchParams

    const userInfo = await determineUser(sp)
    console.info('Determined user operation:', userInfo)

    if (userInfo.userType == 'unauthorised') {
        console.info('User unauthorised')
        return <UacUnauthorised />
    }

    if (userInfo.userType == 'verifiedUser') {
        const vio = userInfo as verifiedUserResult
        console.info('User verified by code')
        return <UacAccessToken verifiedUser={vio.verifiedUser} accessToken={vio.accessToken} userId={vio.userId} />
    }
    console.info('User authorised normally')

    const cuserOperation = userInfo as currentUserResult
    return <UACControls currentUser={cuserOperation.currentUser} />

}

