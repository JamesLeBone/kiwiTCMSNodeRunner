'use server'
import nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'

import * as Auth from '../Auth'
import type { CurrentUser } from './Auth'

export declare type emailRecipient = {
    firstName: string
    lastName: string
    email: string
}
const user2email = (firstName:string , lastName:string , email:string) => `${firstName} ${lastName} <${email}>`
const getTransportConfig = (transporterId = 'sendmail') => {
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
        }
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
        }
    }

    if (transporterId === 'ethereal') {
        if (!process.env.ETHEREAL_USER || !process.env.ETHEREAL_PASS) {
            console.error('Ethereal email credentials are not set in environment variables')
            return null
        }
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
        }
    }
    return {
        host: process.env.EMAIL_HOST || 'localhost',
        port: process.env.EMAIL_PORT || 25,
        secure: false
    }
}

const resolveGmailErrorMessage = (error) => {
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
    }
    
    if (error.responseCode && responseCodeMap[error.responseCode]) {
        return responseCodeMap[error.responseCode] + refMsg
    }
    
    console.debug('Email server error', error)
    return 'Error sending email'
}

const resolveSendmailErrorMessage = (error) => {
    // System/Configuration errors
    if (error.errorno === -4085) return 'Email server not configured'
    
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
        'UNABLE_TO_VERIFY_LEAF_SIGNATURE': 'Unable to verify email server SSL certificate'
    }
    
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
    }
    
    if (error.responseCode && responseCodeMap[error.responseCode]) {
        return responseCodeMap[error.responseCode]
    }
    
    console.debug('Sendmail error', error)
    return 'Error sending email'
}

const resolveErrorMessage = (error,transporterId) => {
    if (transporterId === 'google') {
        return resolveGmailErrorMessage(error)
    }
    if (transporterId === 'sendmail') {
        return resolveSendmailErrorMessage(error)
    }
    console.debug('Email error', error)
    return 'Failed to send email'
}

export const getTransporterId = async ():Promise<string> => {
    const transporterId = process.env.NODEMAILER_TRANSPORTER_ID || null
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

declare type sendResult = [boolean, any]

const determineSender = async (user: CurrentUser|false): Promise<string> => {
    const defaultFrom = 'Toolbox: ' + '<' + process.env.EMAIL_FROM + '>'
    if (!user) return defaultFrom
    if (!user.email) return defaultFrom

    return user2email(user.firstName, user.lastName, user.email)
}

export const send = async (toUser: emailRecipient, subject: string, message: string, html = null): Promise<sendResult> => {
    const sender = await Auth.currentUser()
    const fromAddress = await determineSender(sender)
    if (fromAddress.match(/<.*@.*>/) === null) {
        console.error('Invalid from email address', fromAddress)
        return Promise.resolve([false, 'Invalid from email address, check your settings'])
    }
    const toAddress = user2email(toUser.firstName, toUser.lastName, toUser.email)

    // console.debug('Sending from', fromAddress)
    // return Promise.resolve([false, 'Rejected'])
    // return Promise.resolve([false,'Test'])
    // process.env.OS == 'Windows_NT' - this is not set on Linux.
    const { transporterId, ...transportConfig } = getTransportConfig(
        process.env.NODEMAILER_TRANSPORTER_ID || null
    )
    
    // verify path
    const transporter = nodemailer.createTransport(transportConfig)
    
    const mailOptions = {
        from: fromAddress,
        to: toAddress,
        subject: subject,
        text: message,
        html: false
    }
    
    if (html) {
        mailOptions.html = html
    }

    return new Promise((resolve) => {
        transporter.sendMail(mailOptions, (error, info) => {
            // info = {accepted:[], rejected:[],response:'250 2.0.0 OK....', messageId:''}
            if (error) {
                const errorMessage = resolveErrorMessage(error,transporterId)
                resolve([false,errorMessage])
                return
            }
            // accepted -  a list of accepted recipient addresses
            // rejected - a list of rejected recipient addresses
            // response - the last SMTP response from the server
            // messageId - the message ID string
            // console.debug('Email sent', info)
            
            info.transporterId = transporterId
            // console.info('Email send info',info)
            if (info.accepted && info.accepted.length > 0) {
                if (transporterId === 'ethereal') {
                    // info.loginUrl = 'https://ethereal.email/login'
                    // info.inbox = 'https://ethereal.email/messages'
                    const ethMsgId = info.response.match(/STATUS=new MSGID=(.*)\]^/)
                    if (ethMsgId && ethMsgId[1]) {
                        info.publicUrl = `https://ethereal.email/message/${ethMsgId[1]}`
                    }
                }
                if (transporterId === 'google') {
                    info.inbox = 'https://mail.google.com/'
                }
                info.message = 'Email sent'
            } else {
                info.message = 'No email addresses were accepted'
            }

            resolve([true,info])
        })
    })
}

export const inbox = async (un:string | null) => {
    const username = un ?? process.env.USER;
    const dir = `/var/spool/mail/${username}`;
    const fs = require('fs');
    const emails = fs.readFileSync(dir).toString().split(/\nFrom /)

    const parsedList = []

    for (let email of emails) {
        const parsed = await simpleParser('From '+email)
        parsedList.push(parsed)
    }
    // console.debug(parsedList
    // [0])
    
    return parsedList
}
