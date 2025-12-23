'use server'
import nodemailer from 'nodemailer'

import { currentUser } from './Auth'
import type { CurrentUser } from './Users'

export type emailRecipient = {
    firstName: string
    lastName: string
    email: string
}

declare interface transportConfig {
    transporterId: string
}

declare interface sendMailTransportConfig extends transportConfig {
    sendmail: boolean,
    newline: string,
    path: string
}
declare interface googleTransportConfig extends transportConfig {
    transporterId: string,
    service: string,
    auth: {
        user: string,
        pass: string
    }
}
declare interface etherealTransportConfig extends transportConfig {
    host: string,
    port: number,
    secure: boolean,
    auth: {
        user: string,
        pass: string
    }
}
declare interface customSmtpTransportConfig extends transportConfig {
    host: string,
    port: number|string,
    secure: boolean
}

declare interface messageInfo extends nodemailer.SentMessageInfo {
    transporterId: string
    inbox?: string
    message?: string
}

const user2email = (email:string, firstName?:string , lastName?:string) => {
    const name = [firstName, lastName].filter(n => n && n.length > 0).join(' ')
    if (name.length === 0) {
        return email
    }
    return `${name} <${email}>`
}
const getTransportConfig = (transporterId: string = 'sendmail') : transportConfig  => {
    console.log('Using email transporter:', transporterId)

    if (transporterId === 'sendmail') {
        // Check if we are on linux and sendmail exists
        if (process.platform === 'win32') {
            console.error('Sendmail transporter is not supported on Windows')
            return getTransportConfig('google')
        }
        return {
            transporterId: 'sendmail',
            sendmail: true,
            newline: 'unix',
            path: `/usr/sbin/sendmail`
        } as sendMailTransportConfig
    }
    if (transporterId === 'google') {
        // https://myaccount.google.com/apppasswords - only works per device.

        if (!process.env.GOOGLE_APP_ADDRESS) {
            console.error('GOOGLE_APP_ADDRESS is not set in environment variables')
            return getTransportConfig('ethereal')
        }
        if (!process.env.GOOGLE_APP_PASSWORD) {
            console.error('GOOGLE_APP_PASSWORD is not set in environment variables')
            return getTransportConfig('ethereal')
        }
        return {
            transporterId: 'google',
            service: "gmail",
            auth: {
                user: process.env.GOOGLE_APP_ADDRESS,
                pass: process.env.GOOGLE_APP_PASSWORD
            }
        } as googleTransportConfig
    }

    if (transporterId === 'ethereal') {
        if (!process.env.ETHEREAL_USER || !process.env.ETHEREAL_PASS) {
            console.error('Ethereal email credentials are not set in environment variables')
        } else {
            // https://ethereal.email
            // https://emailengine.app/
            return {
                transporterId: 'ethereal',
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.ETHEREAL_USER,
                    pass: process.env.ETHEREAL_PASS,
                },
            } as etherealTransportConfig
        }
    }
    return {
        transporterId: 'custom-smtp',
        host: process.env.EMAIL_HOST || 'localhost',
        port: process.env.EMAIL_PORT || 25,
        secure: false
    } as customSmtpTransportConfig
}

declare interface gmailError extends Error {
    response?: string
    responseCode: number
}

const resolveGmailErrorMessage = (error : gmailError) : string => {
    const responseMessage = error.response || ''
    const ref = responseMessage.match(/(https:\/\/.*?) /)
    const refMsg = ref ? `. See ${ref[1]}` : ''
    
    const responseCodeMap = {
        421: 'Email server not available',
        450: 'Email server busy, try again later',
        451: 'Server error processing request',
        452: 'Email server out of resources',
        501: 'Invalid email address format',
        502: 'Command not implemented',
        503: 'Bad sequence of commands',
        504: 'Command parameter not implemented',
        521: 'Server does not accept mail',
        530: 'Authentication required',
        535: 'Invalid username and password',
        550: 'Email address not found',
        551: 'User not local, please try forwarding address',
        552: 'Message size exceeds storage allocation',
        553: 'Invalid email address',
        554: 'Transaction failed'
    } as {[key:number]:string}
    
    if (error.responseCode && responseCodeMap[error.responseCode]) {
        return responseCodeMap[error.responseCode] + refMsg
    }
    
    console.debug('Email server error', error)
    return 'Error sending email'
}

declare interface sendmailError extends Error {
    errorno: number
    code?: string
    responseCode?: number
}
declare interface SMTPConnError extends Error {
    code: string
    errno: number
    syscall: string
    address: string
    port: number
    command: string
}

const resolveSMTPErrorMessage = (error : SMTPConnError) : string => {
    const addressString = error.address ? ` at ${error.address}:${error.port}` : ''
    if (error.code === 'EAUTH') {
        return 'Email server authentication failed, check username and password'
    }
    return 'Unable to connect to email server at ' + addressString
}

const resolveSendmailErrorMessage = (error : sendmailError) : string => {
    // System/Configuration errors
    if (error.errorno == -4085) return 'Email server not configured'

    // Common error codes with compact mapping
    const errorCodeMap = {
        'ECONNECTION': 'Email server not available',
        'ECONNREFUSED': 'Email server not available', 
        'ETIMEDOUT': 'Email server connection timeout',
        'ENOTFOUND': 'Email server not found',
        'ECONNRESET': 'Email server connection reset',
        'EAUTH': 'Email server authentication failed',
        'EMESSAGE': 'Invalid email message format',
        'EENVELOPE': 'Invalid email envelope',
        'ENOENT': 'Sendmail binary not found - email server not installed',
        'EACCES': 'Permission denied accessing sendmail binary',
        'ENETUNREACH': 'Network unreachable',
        'EHOSTUNREACH': 'Email server host unreachable',
        'CERT_HAS_EXPIRED': 'Email server SSL certificate has expired',
        'CERT_UNTRUSTED': 'Email server SSL certificate is untrusted',
        'UNABLE_TO_VERIFY_LEAF_SIGNATURE': 'Unable to verify email server SSL certificate',
        'ESOCKET': 'Email server socket error'
    } as {[key:string]:string}
    
    if (error.code && errorCodeMap[error.code]) {
        return errorCodeMap[error.code]
    }
    
    // Response codes (when sendmail returns SMTP-like codes)
    const responseCodeMap = {
        421: 'Email server temporarily unavailable',
        450: 'Email server busy, try again later',
        451: 'Server error processing request',
        452: 'Email server out of resources',
        550: 'Email address rejected',
        551: 'User not local',
        552: 'Message size exceeds limit',
        553: 'Invalid email address',
        554: 'Transaction failed'
    } as {[key:number]:string}
    
    if (error.responseCode && responseCodeMap[error.responseCode]) {
        return responseCodeMap[error.responseCode]
    }
    
    console.debug('Sendmail error', error)
    return 'Error sending email'
}

const resolveErrorMessage = (error : Error,transporterId: string) : string => {
    if (transporterId === 'google') {
        return resolveGmailErrorMessage(error as gmailError)
    }
    if (transporterId === 'sendmail') {
        return resolveSendmailErrorMessage(error as sendmailError)
    }
    if (transporterId === 'custom-smtp') {
        const err = error as SMTPConnError
        return resolveSMTPErrorMessage(err)
    }
    console.debug('Email error', error)
    return 'Failed to send email'
}

export const getTransporterId = async ():Promise<string> => {
    const transporterId = process.env.NODEMAILER_TRANSPORTER_ID || 'sendmail'
    const config = getTransportConfig(transporterId)
    return Promise.resolve(config.transporterId)
}

export const getEmailDetails = async ():Promise<string|false> => {
    const transporterId = await getTransporterId()
    if (transporterId == 'sendmail') {
        return 'Using sendmail on local server'
    }
    if (transporterId == 'google') {
        const gmailAppAddress = process.env.GOOGLE_APP_ADDRESS || '[not set]'
        return 'Using Gmail API SMTP server.  Sending from ' + gmailAppAddress
    }
    if (transporterId == 'ethereal') {
        const emailFrom = process.env.EMAIL_FROM || '[not set]'
        const emailAddress = process.env.EMAIL_USER || '[not set]'
        return 'Using Ethereal test SMTP server.  Sending from ' + emailFrom + ' <' + emailAddress + '>'
    }
    
    const host = process.env.EMAIL_HOST || '127.0.0.1'
    const port = process.env.EMAIL_PORT || 25
    if (!host || !port) {
        return false
    }
    return `Using custom SMTP server at ${host}:${port}`
}


const determineSender = async (user: CurrentUser|false): Promise<string> => {
    const defaultFrom = 'Toolbox: ' + '<' + process.env.EMAIL_FROM + '>'
    if (!user) return defaultFrom
    if (!user.email) return defaultFrom

    return user2email(user.email, user.firstName, user.lastName)
}

type sendResult = {
    success: boolean
    message: string
    details?: messageInfo
}

export const send = async (toUser: emailRecipient, subject: string, message: string, html:string|null = null, from?:emailRecipient): Promise<sendResult> => {
    let fromAddress = ''
    if (!from) {
        const sender = await currentUser()
        if (!sender) return { success: false, message: 'Unauthorized: No current user' }
        const fromAddress = await determineSender(sender)
        if (fromAddress.match(/<.*@.*>/) === null) {
            console.error('Invalid from email address', fromAddress)
            return Promise.resolve({ success: false, message: 'Invalid from email address, check your settings' })
        }
    } else {
        fromAddress = user2email(from.email, from.firstName, from.lastName)
    }
    
    const toAddress = user2email(toUser.email, toUser.firstName, toUser.lastName)

    // console.debug('Sending from', fromAddress)
    // return Promise.resolve([false, 'Rejected'])
    // return Promise.resolve([false,'Test'])
    // process.env.OS == 'Windows_NT' - this is not set on Linux.
    const { transporterId, ...transportConfig } = getTransportConfig(
        process.env.NODEMAILER_TRANSPORTER_ID || 'sendmail'
    )
    
    // verify path
    const transporter = nodemailer.createTransport(transportConfig)
    
    const mailOptions = {
        from: fromAddress,
        to: toAddress,
        subject: subject,
        text: message
    } as nodemailer.SendMailOptions
    
    if (html) {
        mailOptions.html = html
    }

    return new Promise((resolve) => {
        transporter.sendMail(mailOptions, (error, info) => {
            const sentInfo = {transporterId, ...info} as messageInfo
            const result = { transporterId, success: false, message: '', details: sentInfo } as sendResult
            // info = {accepted:[], rejected:[],response:'250 2.0.0 OK....', messageId:''}
            if (error) {
                result.message = 'Failed to send email: ' + resolveErrorMessage(error, transporterId)
                resolve(result)
                return
            }
            result.success = true
            // accepted -  a list of accepted recipient addresses
            // rejected - a list of rejected recipient addresses
            // response - the last SMTP response from the server
            // messageId - the message ID string
            
            // console.info('Email send info',info)
            if (sentInfo.accepted && sentInfo.accepted.length > 0) {
                if (transporterId === 'ethereal') {
                    // info.loginUrl = 'https://ethereal.email/login'
                    // info.inbox = 'https://ethereal.email/messages'
                    const ethMsgId = info.response.match(/STATUS=new MSGID=(.*)\]^/)
                    if (ethMsgId && ethMsgId[1]) {
                        sentInfo.inbox = `https://ethereal.email/message/${ethMsgId[1]}`
                    }
                }
                if (transporterId === 'google') {
                    sentInfo.inbox = 'https://mail.google.com/'
                }
                sentInfo.message = 'Email sent'
            } else {
                sentInfo.message = 'No email addresses were accepted'
            }

            resolve(result)
        })
    })
}
