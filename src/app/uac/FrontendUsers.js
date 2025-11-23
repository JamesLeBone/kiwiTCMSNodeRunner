'use client'
import { useState } from 'react'
import { useMessage } from '@/components/ServerResponse'

import UserList from './UserList.js'

export default function FrontendUsers({users,currentUserId}) {
    const userList = useState(users)
    const ust = useMessage()

    return <div id='UserSummary'>
        { ust.message }
        <UserList users={userList[0]} currentUserId={currentUserId} />
    </div>
}
