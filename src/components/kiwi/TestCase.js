class TestCase {
    constructor(input) {
    }
    
    static formatSummary(summary,securityGroupId=null) {
        let summaryTemp = summary
            .replaceAll(/&gt;-?/g, '-')
            .replaceAll(/--?/g, '-')
            .replaceAll(/-? ?&?amp;/g, '')
            .replaceAll(/&amp;/g, '')
            .replaceAll(/gt;/g, '-')

        if (securityGroupId==null) return summaryTemp
        
        const regExp = /\[((?:FULLADMIN)|(?:FLEXADMIN)|(?:MARKETING)|(?:SALESAGENT)|(?:STAFF)|(?:TUTOR)|(?:ACCOUNTING)|(?:STUDENT)|(?:APPLICANT)|(?:RECEPTION)|(?:PUBLIC))\]/gi
        
        summaryTemp = summaryTemp
            .replaceAll(regExp, '')
            .trim()
            + ' ['+securityGroupId+']'
        return summaryTemp
    }
}

export { TestCase }
