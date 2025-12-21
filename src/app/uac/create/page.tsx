'use server'
import * as Auth from '@server/Auth'
import CreateUser from './CreateUser'
import { ActionBar } from '@/components/Actions'

export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Create User`
    }
}

export default async function UserPage() {
    const currentUser = await Auth.currentUser()
    if (!currentUser) {
        return <p>You are not logged in</p>
    }

    return <main>
        <ActionBar style={{textAlign:'left',paddingTop:'0px'}}>
            <a href="/uac">Back to User Accounts</a>
        </ActionBar>
        <CreateUser />
    </main>
}