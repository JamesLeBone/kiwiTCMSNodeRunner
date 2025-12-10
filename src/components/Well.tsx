'use client'
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

function WellTitle({children}: {children: React.ReactNode}) {
    return <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
        {children}
    </Typography>
}

declare type wp = {
    title?: string
    children: React.ReactNode
}
/**
 * I've wrapped the MUI Card in a well because MUI doesn't like NextJs.
 */
export default function Well({title, children} : wp) {
    return <div className="Well">
        <Card variant="outlined">
            <CardContent>
                {title ? <WellTitle>{title}</WellTitle> : null}
                {children}
            </CardContent>
        </Card>
    </div>
}