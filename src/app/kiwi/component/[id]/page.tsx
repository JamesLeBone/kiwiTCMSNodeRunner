import { ComponentEdit } from './ComponentEdit'
import { fetch } from '@server/kiwi/Component'
import { ComponentSearch } from '@/components/kiwi/Component'

// Static metadata for the page
export const metadata = {
    title: 'Kiwi Testing - Components'
}

export default async function ComponentIdPage({params,searchParams} : NextPageProps) {
    const componentId = await params.then(r => {
        if (!r.id || typeof r.id !== 'string') return null
        const id = parseInt(r.id)
        if (isNaN(id)) return null
        return id
    })

    if (componentId == null) {
        return <ComponentSearch />
    }

    const component = await fetch(componentId)
    
    if (!component) {
        return <ComponentSearch />
    }
    
    // console.debug('Component', component)

    return (
        <main>
            <ComponentEdit component={component} />
        </main>
    )
}
