import { ComponentEdit } from './ComponentEdit'
import { get } from '@server/kiwi/Component.js'
import { ComponentSmallSearch } from '@/components/kiwi/Component.js'

// Static metadata for the page
export const metadata = {
    title: 'Kiwi Testing - Components'
}

export default async function ComponentIdPage({params,searchParams}) {
    const componentId = await params.then(r => r.id)

    if (componentId == null) {
        return <ComponentSmallSearch />
    }

    const request = await get(componentId)
    
    if (!request.status) {
        return <ComponentSmallSearch />
    }
    const component = request.message
    
    // console.debug('Component', component)

    return (
        <main>
            <ComponentEdit component={component} />
        </main>
    )
}
