'use client'

import { ActionBar, ActionButton } from '@/components/Actions'
import { ComponentSection } from '@/components/ComponentSection'
import { FormField } from '@/components/FormField'
import { useState, useEffect } from 'react'
import { useMessage } from '@/components/ServerResponse'
import { getCurrentUser } from '@server/lib/Auth'

import { emailRecipient, getEmailDetails, send } from '@server/lib/Email'

export default function EmailVerification() {
    const [tspid, setTspid] = useState('loading')
    const [canSend, setCanSend] = useState(false)
    const msg = useMessage()

    useEffect(() => {
        getEmailDetails().then(res => {
            if (res) {
                setCanSend(true)
            } else {
                res = 'No email SMTP configured.  Check environment variables.'
            }
            setTspid(res)
        })
    }, [])

    const sendTest = async () => {
        msg.loading()
        const currentUser = await getCurrentUser()
        if (!currentUser || !currentUser.email) {
            msg.error('Cannot determine your email address')
            return
        }
        const recipient = currentUser as emailRecipient
        const result = await send(recipient,
            'Test email from Toolbox',
            'This is a test email sent from Toolbox to verify your email configuration.'
        )
        console.debug('Email send result', result)
        if (result[0]) {
            msg.success('Test email sent successfully to ' + currentUser.email)
        } else {
            msg.error('Failed to send test email: ' + result[1])
        }
    }

    const actionButton = canSend == null ? '' : <ActionBar>
        <ActionButton onClick={sendTest}>Send test email</ActionButton>
    </ActionBar>


    return <ComponentSection header="Email Verification" >
        { msg.message }
        <fieldset>
            <FormField label="Transporter">
                <span>{tspid}</span>
            </FormField>
        </fieldset>
        {actionButton}
    </ComponentSection>
}