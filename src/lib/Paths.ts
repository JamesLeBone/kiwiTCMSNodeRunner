export const TestCase = {
    edit: (id:number) => `/kiwi/testCase/edit/${id}`,
    create: '/kiwi/testCase/create',
    search: '/kiwi/testCase/search',
}
export const Component = {
    edit: (id:number) => `/kiwi/component/${id}`,
}

export const api = {
    test: (id:number) => `/api/testCase/${id}`,
    execution: (id:number, executionId:number) => `/api/executions/${id}/${executionId}`,
    run: (planId:number, runId?:number) => runId ? `/api/runs/${planId}/${runId}` : `/api/runs/${planId}`,
}