import './globals.css'
import PageHeader from './PageHeader'

export const metadata = {
    title: 'React Toolbox',
    description: 'Runinng on Next framework',
}

export default function RootLayout({ children } : { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link href="/fontAwesome6/css/fontawesome.css" rel="stylesheet" />
                <link href="/fontAwesome6/css/brands.css" rel="stylesheet" />
                <link href="/fontAwesome6/css/solid.css" rel="stylesheet" />
            </head>
            <body>
                <PageHeader />
                {children}
            </body>
        </html>
    )
}
