export function formatSummary(summary: string, securityGroup?: string) : string {
    if (!securityGroup) return summary
    return `${summary} [${securityGroup}]`
}

export function kiwiBaseUrl() : string {
    return [
        process.env.KIWI_PROTOCOL || 'http',
        '://',
        process.env.KIWI_DOMAIN || 'localhost',
        ':',
        process.env.KIWI_PORT || '81'
    ]
    .join('')
}
