import * as Auth from '@server/Auth'
import { CreateUser } from '../UserEdit.js'
import { ActionBar } from '@/components/Actions'

export const metadata = {
    title: 'Toolbox - Create User Account'
}

export default async function UserPage({params,searchParams}) {
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