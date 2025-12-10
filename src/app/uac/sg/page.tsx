'use server'
import SecurityManagement from './SecurityManagement'
import { getList } from '@server/lib/SecurityGroups'

// This only works on server components, on the client side you need to use useEffect to set document.title
export async function metadata() {
    const title = process.env.APP_TITLE
    return { 
        title: `${title} - Security Groups`
    }
}

export default async function UserPage({params,searchParams} : NextPageProps) {
    const list = await getList()

    return <div>
        <SecurityManagement list={list} />
    </div>

}

