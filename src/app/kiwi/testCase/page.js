import CreateTestCase from './CreateTestCase.js'

export const metadata = {
    title: 'New Test Case',
    description: 'Create new test case',
}

export default function TestCase() {
    return <div>
        <CreateTestCase  />
    </div>
}