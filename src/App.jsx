import React, { useState, useEffect } from 'react'
import BottomNavigation from './Components/BottomNavigation.jsx'
import SideNavigation from './Components/SideNavigation.jsx'
import AuthWrapper from './Components/AuthWrapper.jsx'
import TodoPage from './Pages/TodoPage.jsx'
import PrayerPage from './Pages/PrayerPage.jsx'
import GrowthPage from './Pages/GrowthPage.jsx'
import ContactsPage from './Pages/ContactsPage.jsx'
import SettingsPage from './Pages/SettingsPage.jsx'
import { useTimeTracking } from './hooks/useTimeTracking'
import { useDeviceSession } from './hooks/useDeviceSession'

const App = () => {
  const [activeTab, setActiveTab] = useState('tasks')
  const [isMobile, setIsMobile] = useState(false)
  const { trackAction } = useTimeTracking('main_app')
  
  // Initialize device session management
  useDeviceSession()

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    // Ensure light theme by removing any dark class
    document.documentElement.classList.remove('dark')
    localStorage.removeItem('theme')
  }, [])

  const handleTabChange = (newTab) => {
    trackAction('tab_change', { from: activeTab, to: newTab })
    setActiveTab(newTab)
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'tasks':
        return <TodoPage />
      case 'player':
        return <PrayerPage />
      case 'growth':
        return <GrowthPage />
      case 'contacts':
        return <ContactsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <TodoPage />
    }
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        {isMobile ? (
          // Mobile Layout
          <>
            {renderPage()}
            <BottomNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
          </>
        ) : (
          // Desktop Layout
          <div className="flex">
            <SideNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
            <main className="flex-1 ml-64">
              {renderPage()}
            </main>
          </div>
        )}
      </div>
    </AuthWrapper>
  )
}

export default App