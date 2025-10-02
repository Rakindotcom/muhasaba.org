import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase'

const GrowthPage = () => {
  const [userType, setUserType] = useState('student')
  const [growthData, setGrowthData] = useState({
    iman: {
      istigfar: false,
      salam: false,
      miswak: false,
      quranTouch: false,
      masnunDua: false,
      prayerOnTime: false,
      quranReflect: false
    },
    life: {}
  })
  const [loading, setLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { user } = useAuth()

  const userTypes = {
    student: 'Students',
    professional: 'Professionals',
    homemaker: 'Homemakers'
  }

  const imanChecklist = [
    { key: 'istigfar', label: 'Do Istighfar at least 70 times' },
    { key: 'salam', label: 'Give Salam to at least 7 people' },
    { key: 'miswak', label: 'Use Miswak' },
    { key: 'quranTouch', label: 'Touch the Qur\'an at least once' },
    { key: 'masnunDua', label: 'Recite morning and evening duas' },
    { key: 'prayerOnTime', label: 'Pray on time / in congregation' },
    { key: 'quranReflect', label: 'Reflect a little on the Qur\'an' }
  ]

  const lifeChecklists = {
    student: [
      { key: 'academics', label: 'Deep study for at least 1 hour – academic' },
      { key: 'career', label: 'Career-related study for 1 hour / podcast / event / book' },
      { key: 'meal', label: 'Eat together – with family, friends, or roommates (at least one meal)' },
      { key: 'attendance', label: 'Attend classes on time' },
      { key: 'gratitude', label: 'Gratitude: smile at least once for Allah\'s mercy' },
      { key: 'exercise', label: 'Daily exercise: walking / walking to mosque or office / using stairs' },
      { key: 'sleep', label: 'Proper sleep – at least 6 hours at the right time' }
    ],
    professional: [
      { key: 'messages', label: 'Check urgent calls, emails, and messages' },
      { key: 'meal', label: 'Eat together – with family, friends, or colleagues (at least one meal)' },
      { key: 'deepWork', label: 'Deep work – at least 3 hours' },
      { key: 'help', label: 'Help someone – even giving a glass of water counts' },
      { key: 'gratitude', label: 'Gratitude: smile at least once for Allah\'s mercy' },
      { key: 'exercise', label: 'Daily exercise: walking / walking to mosque or office / using stairs' },
      { key: 'sleep', label: 'Proper sleep – at least 6 hours at the right time' }
    ],
    homemaker: [
      { key: 'organizing', label: 'Organizing Home and Kitchen - Ensuring delegation at least' },
      { key: 'family', label: 'Spending special time with kids or Husband/ Over phone at least' },
      { key: 'selfCare', label: 'Taking self care' },
      { key: 'learning', label: 'Learning anything for personal life excellence' },
      { key: 'communication', label: 'Essential communication with family and relatives' },
      { key: 'muhasaba', label: 'Muhasaba of the day - mane diner hisheb neya je din ta kmn chilo' },
      { key: 'exercise', label: 'Exercise & Sound sleep hoyeche ki?' }
    ]
  }

  // Helper function to get today's date string
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  }

  // Save growth data to Firestore
  const saveGrowthDataToFirestore = async (growthDataToSave = growthData, userTypeToSave = userType) => {
    if (!user?.uid) return

    try {
      const today = getTodayDateString()
      
      // Save today's growth data
      const dailyGrowthRef = doc(db, 'userGrowth', user.uid, 'dailyGrowth', today)
      await setDoc(dailyGrowthRef, {
        growthData: growthDataToSave,
        userType: userTypeToSave,
        date: today,
        lastUpdated: serverTimestamp()
      })

      // Save user type preference
      const userPrefsRef = doc(db, 'userPreferences', user.uid)
      await setDoc(userPrefsRef, {
        userType: userTypeToSave,
        lastUpdated: serverTimestamp()
      }, { merge: true })

      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving growth data to Firestore:', error)
    }
  }

  // Load growth data from Firestore
  const loadGrowthDataFromFirestore = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    try {
      const today = getTodayDateString()
      
      // Load user type preference
      const userPrefsRef = doc(db, 'userPreferences', user.uid)
      const prefsDoc = await getDoc(userPrefsRef)
      
      if (prefsDoc.exists() && prefsDoc.data().userType) {
        setUserType(prefsDoc.data().userType)
      }

      // Load today's growth data
      const dailyGrowthRef = doc(db, 'userGrowth', user.uid, 'dailyGrowth', today)
      const dailyDoc = await getDoc(dailyGrowthRef)
      
      if (dailyDoc.exists()) {
        setGrowthData(dailyDoc.data().growthData)
        if (dailyDoc.data().userType) {
          setUserType(dailyDoc.data().userType)
        }
      }

    } catch (error) {
      console.error('Error loading growth data from Firestore:', error)
      toast.error('Failed to load growth data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Initialize life data when user type changes
  useEffect(() => {
    setGrowthData(prev => {
      const newLifeData = {}
      lifeChecklists[userType].forEach(item => {
        newLifeData[item.key] = prev.life[item.key] || false
      })
      return {
        ...prev,
        life: newLifeData
      }
    })
  }, [userType])

  // Load data when user changes or component mounts
  useEffect(() => {
    if (user?.uid) {
      loadGrowthDataFromFirestore()
    } else {
      setLoading(false)
    }
  }, [user?.uid])

  // Save data when navigating away from page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges && user?.uid) {
        saveGrowthDataToFirestore()
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges && user?.uid) {
        saveGrowthDataToFirestore()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // Save on component unmount (navigation away)
      if (hasUnsavedChanges && user?.uid) {
        saveGrowthDataToFirestore()
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, user?.uid])

  const toggleItem = (category, key) => {
    setGrowthData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }))
    setHasUnsavedChanges(true)
  }

  const getScore = (category) => {
    const items = category === 'iman' ? imanChecklist : lifeChecklists[userType]
    const completed = items.filter(item => growthData[category][item.key]).length
    return Math.round((completed / items.length) * 100)
  }

  const ChecklistSection = ({ title, items, category, color }) => (
    <div className={`${color} rounded-xl p-4 md:p-6 mb-4 lg:mb-0 h-fit`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
        <div className="text-2xl md:text-3xl font-bold text-gray-700">{getScore(category)}%</div>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const isCompleted = growthData[category][item.key]

          return (
            <button
              key={item.key}
              onClick={() => toggleItem(category, item.key)}
              className={`w-full flex items-start gap-3 p-3 md:p-4 rounded-lg transition-all hover:scale-[1.02] ${isCompleted
                  ? 'bg-white/80 text-gray-800 shadow-sm'
                  : 'bg-white/40 text-gray-600 hover:bg-white/60'
                }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${isCompleted
                  ? 'bg-green-500 border-green-500 text-white scale-110'
                  : 'border-gray-400 hover:border-green-400'
                }`}>
                {isCompleted && <Check size={14} />}
              </div>

              <span className={`flex-1 text-left text-sm md:text-base leading-relaxed ${isCompleted ? 'line-through opacity-75' : ''
                }`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your growth data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Growth Score</h1>
        <p className="text-gray-600 text-sm md:text-base">End of the Day Review</p>
        <div className="mt-2 text-lg font-semibold text-blue-600">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center justify-center gap-2 text-xs text-orange-600 mt-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      {/* User Type Selector */}
      <div className="bg-white rounded-xl p-4 md:p-6 mb-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 text-lg mb-4">Select Your Role</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(userTypes).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setUserType(key)
                setHasUnsavedChanges(true)
              }}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all ${userType === key
                  ? 'bg-blue-500 text-white scale-105 shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Overall Score - Dark Theme */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 mb-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-lg">Overall Growth Score</h3>
            <p className="text-sm text-gray-300">Daily Average</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{getScore('iman')}%</div>
              <div className="text-xs text-gray-400">Iman</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{getScore('life')}%</div>
              <div className="text-xs text-gray-400">Life</div>
            </div>
            <div className="text-center ml-2">
              <div className="text-3xl font-bold text-purple-400">
                {Math.round((getScore('iman') + getScore('life')) / 2)}%
              </div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Iman Growth */}
        <ChecklistSection
          title="Iman Growth (7 Checklist)"
          items={imanChecklist}
          category="iman"
          color="bg-green-50"
        />

        {/* Life Growth */}
        <ChecklistSection
          title={`Life Growth (7 Checklist) - ${userTypes[userType]}`}
          items={lifeChecklists[userType]}
          category="life"
          color="bg-blue-50"
        />
      </div>
    </div>
  )
}

export default GrowthPage