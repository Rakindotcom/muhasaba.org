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
  // Helper function to get today's date string
  const getTodayDateString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [userType, setUserType] = useState('student')
  const [growthData, setGrowthData] = useState({
    iman: {
      istigfar: false,
      prayer: false,
      quran: false,
      islamicLecture: false,
      protection: false
    },
    life: {}
  })
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(getTodayDateString())
  const { user } = useAuth()

  const userTypes = {
    student: 'স্টুডেন্ট',
    professional: 'চাকুরিজীবি/ব্যবসায়ী',
    homemaker: 'হোমমেকার'
  }

  const imanChecklist = [
    { key: 'istigfar', label: 'ইস্তিগফার ও মাইন্ডফুল জিকির করেছি' },
    { key: 'prayer', label: '৫ ওয়াক্ত নামাজ পড়েছি' },
    { key: 'quran', label: 'কমপক্ষে ১০ মিনিট অর্থসহ কুরআন পড়েছি' },
    { key: 'islamicLecture', label: 'ইসলামিক লেকচার শুনেছি/সীরাত পড়েছি' },
    { key: 'protection', label: 'চোখ ও মুখের হেফাজত করেছি' }
  ]

  const lifeChecklists = {
    student: [
      { key: 'deepStudy', label: 'কমপক্ষে ২ঘণ্টা ডিপ স্ট্যাডি করেছি - একাডেমিক' },
      { key: 'careerDev', label: 'ক্যারিয়ার ডেভেলপমেন্টে সময় দিয়েছি - পডকাস্ট/বই/ইভেন্ট' },
      { key: 'family', label: 'পরিবারকে সময় দিয়েছি/খোঁজখবর নিয়েছি' },
      { key: 'exercise', label: 'অন্তত ১৫ মিনিট হেঁটেছি/ফিজিকাল এক্সারসাইজ করেছি' },
      { key: 'sleep', label: 'রাত ১১ টার মধ্যে ঘুমাতে এসেছি' }
    ],
    professional: [
      { key: 'deepWork', label: 'কমপক্ষে ৩ ঘণ্টা ডিপ ওয়ার্ক করেছি' },
      { key: 'professionalDev', label: 'প্রফেশনাল লাইফ ডেভেলপমেন্টে সময় দিয়েছি - পডকাস্ট/বই/ইভেন্ট/নেটওয়ার্কিং' },
      { key: 'family', label: 'পরিবার ও আত্মীয়স্বজনকে সময় দিয়েছি/খোঁজখবর নিয়েছি' },
      { key: 'exercise', label: 'অন্তত ১৫ মিনিট হেঁটেছি/ফিজিকাল এক্সারসাইজ করেছি' },
      { key: 'sleep', label: 'রাত ১১ টার মধ্যে ঘুমাতে এসেছি' }
    ],
    homemaker: [
      { key: 'hobby', label: 'শখের কোনো কাজে সময় দিয়েছি' },
      { key: 'journaling', label: 'মনের কথাগুলো জার্নালিং করা' },
      { key: 'selfCare', label: 'নিজের যত্নে হেঁটেছি/ব্যায়াম করেছি অথবা বই পড়েছি/লেকচারে শুনেছি' },
      { key: 'communication', label: 'পরিবার ও আত্মীয়দের সাথে প্রয়োজনীয় যোগাযোগ' },
      { key: 'sleep', label: 'রাত ১১ টার মধ্যে ঘুমাতে এসেছি' }
    ]
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

      if (dailyDoc.exists() && dailyDoc.data().growthData) {
        setGrowthData(dailyDoc.data().growthData)
        if (dailyDoc.data().userType) {
          setUserType(dailyDoc.data().userType)
        }
      } else {
        // Reset to default state for new day
        setGrowthData({
          iman: {
            istigfar: false,
            prayer: false,
            quran: false,
            islamicLecture: false,
            protection: false
          },
          life: {}
        })
      }

    } catch (error) {
      console.error('Error loading growth data from Firestore:', error)
      toast.error('গ্রোথ ডেটা লোড করতে ব্যর্থ। দয়া করে পেজ রিফ্রেশ করুন।')
    } finally {
      setLoading(false)
    }
  }

  // Initialize life data when user type changes
  useEffect(() => {
    setGrowthData(prev => {
      if (!prev) return prev
      
      const newLifeData = {}
      lifeChecklists[userType].forEach(item => {
        newLifeData[item.key] = (prev.life && prev.life[item.key]) || false
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

  // Auto-save when growth data changes
  useEffect(() => {
    if (!loading && user?.uid) {
      saveGrowthDataToFirestore()
    }
  }, [growthData, userType, user?.uid, loading])

  // Check for date change and reset growth data for new day
  useEffect(() => {
    const checkDateChange = async () => {
      const today = getTodayDateString()
      if (today !== currentDate && !loading) {
        // Date has changed, reset growth data and reload
        setCurrentDate(today)
        setGrowthData({
          iman: {
            istigfar: false,
            prayer: false,
            quran: false,
            islamicLecture: false,
            protection: false
          },
          life: {}
        })
        // Reload data for the new day
        if (user?.uid) {
          await loadGrowthDataFromFirestore()
        }
      }
    }

    // Check every minute for date change
    const interval = setInterval(checkDateChange, 60000)

    return () => clearInterval(interval)
  }, [currentDate, loading, user?.uid])

  // Force refresh when component becomes visible (handles browser tab switching)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user?.uid) {
        const today = getTodayDateString()
        if (today !== currentDate) {
          setCurrentDate(today)
          await loadGrowthDataFromFirestore()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [currentDate, user?.uid])

  const toggleItem = (category, key) => {
    setGrowthData(prev => {
      if (!prev || !prev[category]) {
        return prev
      }
      
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: !prev[category][key]
        }
      }
    })
  }

  const getScore = (category) => {
    if (!growthData || !growthData[category]) {
      return 0
    }
    
    const items = category === 'iman' ? imanChecklist : lifeChecklists[userType]
    const completed = items.filter(item => growthData[category] && growthData[category][item.key]).length
    return Math.round((completed / items.length) * 100)
  }

  const ChecklistSection = ({ title, items, category, color }) => (
    <div className={`${color} rounded-xl p-4 md:p-6 mb-4 lg:mb-0 h-fit`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 text-2xl">{title}</h3>
        <div className="text-2xl md:text-3xl font-bold text-gray-700">{getScore(category)}%</div>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const isCompleted = growthData && growthData[category] ? growthData[category][item.key] : false

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

              <span className={`flex-1 text-left text-2xl md:text-lg leading-relaxed ${isCompleted ? 'line-through opacity-75' : ''
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
          <p className="text-gray-600">আপনার গ্রোথ ডেটা লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">গ্রোথ স্কোর</h1>
        <p className="text-gray-600 text-2xl md:text-lg">দিনের শেষে পর্যালোচনা</p>
        <div className="mt-2 text-lg font-semibold text-blue-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>

      </div>

      {/* User Type Selector */}
      <div className="bg-white rounded-xl p-4 md:p-6 mb-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 text-2xl mb-4">আপনার ভূমিকা নির্বাচন করুন</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(userTypes).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setUserType(key)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-lg text-2xl md:text-lg font-medium transition-all ${userType === key
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
            <h3 className="font-semibold text-white text-2xl">সামগ্রিক গ্রোথ স্কোর</h3>
            <p className="text-2xl text-gray-300">দৈনিক গড়</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{getScore('iman')}%</div>
              <div className="text-2xl text-gray-400">ইমান</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{getScore('life')}%</div>
              <div className="text-2xl text-gray-400">লাইফ</div>
            </div>
            <div className="text-center ml-2">
              <div className="text-3xl font-bold text-purple-400">
                {Math.round((getScore('iman') + getScore('life')) / 2)}%
              </div>
              <div className="text-2xl text-gray-400">মোট</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Iman Growth */}
        <ChecklistSection
          title="ইমান গ্রোথ (৫টি চেকলিস্ট)"
          items={imanChecklist}
          category="iman"
          color="bg-green-50"
        />

        {/* Life Growth */}
        <ChecklistSection
          title={`লাইফ গ্রোথ (৫টি চেকলিস্ট) - ${userTypes[userType]}`}
          items={lifeChecklists[userType]}
          category="life"
          color="bg-blue-50"
        />
      </div>
    </div>
  )
}

export default GrowthPage