import './globals.css'
import PageHeader from './PageHeader'

export const metadata = {
    title: 'React Toolbox',
    description: 'Runinng on Next framework',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link href="/fontAwesome6/css/fontawesome.css" rel="stylesheet" />
                <link href="/fontAwesome6/css/brands.css" rel="stylesheet" />
                <link href="/fontAwesome6/css/solid.css" rel="stylesheet" />
                <link rel="icon" href="/toolbox.png" type="image/png" sizes="any" />
            </head>
            <body>
                <PageHeader />
                {children}
            </body>
        </html>
    )
}
