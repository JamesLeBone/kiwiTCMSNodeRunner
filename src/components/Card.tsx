import React from 'react'
import { ActionBar } from './Actions'

typeps = {
    header: React.ReactNode
    children: React.ReactNode
    actions?: React.ReactNode
    isActive?: boolean
}
export default function Card({header, children, actions, isActive}: CardProps) {
    const className = isActive ? 'Card active' : 'Card'

    return <div className={className}>
        <div className="card-content">
            <h3>{header}</h3>
            <div className="card-content">{children}</div>
        </div>
        {actions && <ActionBar>{actions}</ActionBar>}
    </div>
}
