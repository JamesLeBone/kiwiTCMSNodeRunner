'use server'
import * as TestCaseStatus from '@server/kiwi/TestCaseStatus'
import { getDetail } from '@server/kiwi/TestCase'
import TestCaseAttachments from './TestCaseAttachments'

import { kiwiBaseUrl } from '@lib/Functions'
import TestCaseEdit from './TestCaseEdit'
import { redirect } from 'next/navigation'

import { TestCase as TestCasePath } from '@lib/Paths'

import { getList as fetchSecurityGroups } from '@server/lib/SecurityGroups'

export async function generateMetadata(props : NextPageProps) {
    const metaData = {title: 'Test Cases'}
    const id = (await props.params).id
    if (id) {
        metaData.title = process.env.APP_TITLE + ` - Test case #${id}`
    } else {
        metaData.title = process.env.APP_TITLE + ` - Test Cases`
    }
    return metaData
}

const redirectPath = (message?:string) => {
    if (!message) return TestCasePath.search
    return `${TestCasePath.search}?error=${encodeURIComponent(message)}`
}

export default async function TestCase(params: NextPageProps) {
    const searchParams = await params.params
    if (!searchParams || !searchParams.id) redirect(redirectPath())
    
    const testCaseId = Number.parseInt(searchParams.id as string)
    if (isNaN(testCaseId)) redirect(redirectPath())
    
    // uses our server.
    const response = await getDetail(testCaseId)
    if (!response.status) redirect(redirectPath(response.message))
    if (!response.data) redirect(redirectPath('No data received'))
    
    const statuses = await TestCaseStatus.fetchAll()
    // const products = await fetchProductList()
    
    const kiwiUrl = kiwiBaseUrl()+'/case/'
    const securityGroups = await fetchSecurityGroups()
    const testCaseDetail = response.data
    
    return <>
        <TestCaseEdit details={response.data} statuses={statuses} kiwiUrl={kiwiUrl} securityGroups={securityGroups} />
        <TestCaseAttachments testCaseId={testCaseId} details={testCaseDetail} />
    </>
}
