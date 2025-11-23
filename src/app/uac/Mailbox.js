

import './email.css'

function Email({messageId, subject,to,from,date,attachments,headers,text,html}) {

    const dt = typeof date == 'undefined' ? '' : date.toString()
    const fromText = typeof from == 'undefined' ? '' : from.text

    return <div className='email'>
        From: {fromText}<br/>
        Date: {dt}<br/>
        Subject: {subject ?? 'No subject'}<br/>
        <pre>
            {text}
        </pre>
    </div>
}

export default function Mailbox({username, emails}) {
    return <div>
        <h2>Mailbox for {username}</h2>
        <div>
            {emails.map((email,idx) => <Email key={email.messageId ?? idx}  {...email} />)}
        </div>
    </div>   
}
