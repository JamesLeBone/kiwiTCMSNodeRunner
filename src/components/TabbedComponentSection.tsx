
import { ReactNode, useEffect, useState } from 'react'
import { ComponentSection } from './ComponentSection'

type TabDetails = {
    id: string
    label: string
    content: ReactNode
}
type tcsprops = {
    tabs: TabDetails[]
    activeTabId?: string
}
type TabProps = {
    isActive: boolean
    details: TabDetails
    setTab: () => void
}
const Tab = ({ isActive, details, setTab }: TabProps) => {
    const updateTab = () => {
        if (isActive) return
        setTab()
    }
    return <li className={isActive ? 'active': 'inactive'} onClick={updateTab}>{details.label}</li>
}

export default function TabbedComponentSection(props: tcsprops) {
    const { tabs } = props
    const [activeTabId, setActiveTabId] = useState<number>(0)
    const [header, setHeader] = useState<string>(tabs[0].label)
    
    useEffect(() => {
        const activeTab = tabs[activeTabId]
        setHeader(activeTab.label)
    }, [activeTabId])

    return <ComponentSection header={header} style={{display:'grid'}}>
        <div className='tabbed-section'>
            <ul className='tab-labels'>
                {tabs.map((tab, index) => {
                    const isActive = index === activeTabId
                    const setTab = () => setActiveTabId(index)
                    return <Tab key={tab.id} isActive={isActive} details={tab} setTab={setTab} />
                })}
            </ul>
            <div className='tab-content'>
                {tabs.map((tab, index) => {
                    const isActive = index === activeTabId
                    const style = { display: isActive ? 'block' : 'none' }
                    return <div style={style} key={tab.id}>{tab.content}</div>
                })}
            </div>
        </div>
    </ComponentSection>
}
