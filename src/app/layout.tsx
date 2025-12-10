import './globals.css'
import PageHeader from './PageHeader'
import { currentUser } from '@server/Auth'
import ThemeRegistry from './ThemeRegistry'

export const metadata = {
    title: 'React Toolbox',
    description: 'Runinng on Next framework',
}

export default async function RootLayout({ children } : { children: React.ReactNode }) {
    // Call is cached per request
    const userInfo = await currentUser()
    const userName = userInfo.data ? userInfo.data.username : ''

    return <html lang="en">
        <head>
            <link href="/fontAwesome6/css/fontawesome.css" rel="stylesheet" />
            <link href="/fontAwesome6/css/brands.css" rel="stylesheet" />
            <link href="/fontAwesome6/css/solid.css" rel="stylesheet" />
            <link href="/favicon.png" rel="icon" type='png' />
        </head>
        <body>
            <ThemeRegistry>
                <PageHeader userName={userName} />
                {children}
            </ThemeRegistry>
        </body>
    </html>
}
