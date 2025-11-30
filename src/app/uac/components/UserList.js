'use client'

import { ComponentSection } from '@/components/ComponentSection'
import { ActionBar } from '@/components/Actions'
import { IconButton } from '@/components/IconButton'


export function UserDisplay({userId,firstName,lastName,email,username,selected}) {
    const className = selected ? 'selected' : ''
    const href = `/uac/edit?userId=${userId}`
    
    return <tr className={className}>
        <td>{firstName}</td>
        <td>{lastName}</td>
        <td>{email}</td>
        <td>{username}</td>
        <td className='link'>
            <IconButton href={href} title="Edit" className="fa fa-pencil" />
        </td>
    </tr>
}

export default function UserList({users,currentUserId}) {
    if ((users ?? null) == null) return <p>No users</p>

    return <ComponentSection header='Users' className='user-list'>
        <table>
            <thead>
                <tr>
                    <th>First name</th>
                    <th>Last name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Edit</th>
                </tr>
            </thead>
            <tbody>
                {users.map(user => <UserDisplay key={user.userId} selected={user.userId == currentUserId} {...user} />)}
            </tbody>
        </table>
        <ActionBar>
            <a href="/uac/create" className='button'>Create User</a>
        </ActionBar>
    </ComponentSection>
}
