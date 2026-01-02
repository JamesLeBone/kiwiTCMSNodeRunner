'use client'

import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar } from '@/components/Actions'
import { IconButton } from '@/components/IconButton'
import type { verifiedUser } from '@server/lib/Users'
import { DynamicTable } from '@/components/DynamicTable'

type dpprops = {
    userId: number
    firstName?: string
    lastName?: string
    email?: string
    username?: string
    selected: boolean
}
export function UserDisplay(props: dpprops) {
    const className = props.selected ? 'selected' : ''
    const href = `/uac/edit?userId=${props.userId}`
    
    return <tr className={className}>
        <td>{props.firstName}</td>
        <td>{props.lastName}</td>
        <td>{props.email}</td>
        <td>{props.username}</td>
        <td className='link align-right'>
            <IconButton href={href} title="Edit" className="fa fa-pencil" />
        </td>
    </tr>
}

type UserListProps = {
    users: verifiedUser[]
    currentUserId: number
}
export default function UserList({users,currentUserId} : UserListProps) {
    const headers = ['First name','Last name','Email','Username','Edit']

    return <ComponentSection header='Users'>
        <DynamicTable headers={headers}>
            {users.map(user => <UserDisplay key={user.userId} selected={user.userId == currentUserId} {...user} />)}
        </DynamicTable>
        <ActionBar>
            <a href="/uac/create" className='button'>Create User</a>
        </ActionBar>
    </ComponentSection>
}
