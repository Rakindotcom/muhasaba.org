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
  const { user } = useAuth()

  const userTypes = {
    student: 'স্টুডেন্ট',
    professional: 'চাকুরিজীবি',
    homemaker: 'গৃহিণী'
  }

  const imanChecklist = [
    { key: 'istigfar', label: 'কমপক্ষে ৭০ বার ইস্তিগফার করুন' },
    { key: 'salam', label: 'কমপক্ষে ৭ জনকে সালাম দিন' },
    { key: 'miswak', label: 'মিসওয়াক ব্যবহার করুন' },
    { key: 'quranTouch', label: 'কমপক্ষে একবার কুরআন স্পর্শ করুন' },
    { key: 'masnunDua', label: 'সকাল ও সন্ধ্যার দোয়া পড়ুন' },
    { key: 'prayerOnTime', label: 'সময়মতো / জামাতে নামাজ পড়ুন' },
    { key: 'quranReflect', label: 'কুরআন নিয়ে একটু চিন্তা করুন' }
  ]

  const lifeChecklists = {
    student: [
      { key: 'academics', label: 'কমপক্ষে ১ ঘন্টা গভীর অধ্যয়ন – একাডেমিক' },
      { key: 'career', label: 'ক্যারিয়ার সম্পর্কিত ১ ঘন্টা পড়াশোনা / পডকাস্ট / ইভেন্ট / বই' },
      { key: 'meal', label: 'একসাথে খাওয়া – পরিবার, বন্ধু বা রুমমেটদের সাথে (কমপক্ষে একবেলা)' },
      { key: 'attendance', label: 'সময়মতো ক্লাসে উপস্থিত হওয়া' },
      { key: 'gratitude', label: 'কৃতজ্ঞতা: আল্লাহর রহমতের জন্য কমপক্ষে একবার হাসুন' },
      { key: 'exercise', label: 'দৈনিক ব্যায়াম: হাঁটা / মসজিদ বা অফিসে হেঁটে যাওয়া / সিঁড়ি ব্যবহার' },
      { key: 'sleep', label: 'সঠিক ঘুম – সঠিক সময়ে কমপক্ষে ৬ ঘন্টা' }
    ],
    professional: [
      { key: 'messages', label: 'জরুরি কল, ইমেইল এবং মেসেজ চেক করুন' },
      { key: 'meal', label: 'একসাথে খাওয়া – পরিবার, বন্ধু বা সহকর্মীদের সাথে (কমপক্ষে একবেলা)' },
      { key: 'deepWork', label: 'গভীর কাজ – কমপক্ষে ৩ ঘন্টা' },
      { key: 'help', label: 'কাউকে সাহায্য করুন – এক গ্লাস পানি দেওয়াও গণনা হয়' },
      { key: 'gratitude', label: 'কৃতজ্ঞতা: আল্লাহর রহমতের জন্য কমপক্ষে একবার হাসুন' },
      { key: 'exercise', label: 'দৈনিক ব্যায়াম: হাঁটা / মসজিদ বা অফিসে হেঁটে যাওয়া / সিঁড়ি ব্যবহার' },
      { key: 'sleep', label: 'সঠিক ঘুম – সঠিক সময়ে কমপক্ষে ৬ ঘন্টা' }
    ],
    homemaker: [
      { key: 'organizing', label: 'ঘর ও রান্নাঘর সংগঠিত করা - কমপক্ষে দায়িত্ব বণ্টন নিশ্চিত করা' },
      { key: 'family', label: 'সন্তান বা স্বামীর সাথে বিশেষ সময় কাটানো / কমপক্ষে ফোনে' },
      { key: 'selfCare', label: 'নিজের যত্ন নেওয়া' },
      { key: 'learning', label: 'ব্যক্তিগত জীবনের উৎকর্ষতার জন্য কিছু শেখা' },
      { key: 'communication', label: 'পরিবার ও আত্মীয়দের সাথে প্রয়োজনীয় যোগাযোগ' },
      { key: 'muhasaba', label: 'দিনের মুহাসাবা - দিনটা কেমন কাটলো তার হিসাব নেওয়া' },
      { key: 'exercise', label: 'ব্যায়াম ও ভালো ঘুম হয়েছে কি?' }
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
      toast.error('উন্নতির ডেটা লোড করতে ব্যর্থ। দয়া করে পেজ রিফ্রেশ করুন।')
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

  // Auto-save when growth data changes
  useEffect(() => {
    if (!loading && user?.uid) {
      saveGrowthDataToFirestore()
    }
  }, [growthData, userType, user?.uid, loading])

  const toggleItem = (category, key) => {
    setGrowthData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }))
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
          <p className="text-gray-600">আপনার উন্নতির ডেটা লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">উন্নতির স্কোর</h1>
        <p className="text-gray-600 text-sm md:text-base">দিনের শেষে পর্যালোচনা</p>
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
        <h3 className="font-semibold text-gray-800 text-lg mb-4">আপনার ভূমিকা নির্বাচন করুন</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(userTypes).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setUserType(key)}
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
            <h3 className="font-semibold text-white text-lg">সামগ্রিক উন্নতির স্কোর</h3>
            <p className="text-sm text-gray-300">দৈনিক গড়</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{getScore('iman')}%</div>
              <div className="text-xs text-gray-400">ঈমান</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{getScore('life')}%</div>
              <div className="text-xs text-gray-400">জীবন</div>
            </div>
            <div className="text-center ml-2">
              <div className="text-3xl font-bold text-purple-400">
                {Math.round((getScore('iman') + getScore('life')) / 2)}%
              </div>
              <div className="text-xs text-gray-400">মোট</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Iman Growth */}
        <ChecklistSection
          title="ঈমানের উন্নতি (৭টি চেকলিস্ট)"
          items={imanChecklist}
          category="iman"
          color="bg-green-50"
        />

        {/* Life Growth */}
        <ChecklistSection
          title={`জীবনের উন্নতি (৭টি চেকলিস্ট) - ${userTypes[userType]}`}
          items={lifeChecklists[userType]}
          category="life"
          color="bg-blue-50"
        />
      </div>
    </div>
  )
}

export default GrowthPage