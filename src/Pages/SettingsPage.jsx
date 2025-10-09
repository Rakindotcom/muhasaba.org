import { useState, useEffect } from 'react'
import { User, Bell, CreditCard, LogOut, ChevronRight, X, BarChart3, Calendar, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import MonthlyReport from '../Components/MonthlyReport'
import WeeklyReport from '../Components/WeeklyReport'
import DailyReportModal from '../Components/DailyReportModal'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

const SettingsPage = () => {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    userType: 'student'
  })
  const [notifications, setNotifications] = useState({
    prayer: true,
    tasks: true,
    growth: false
  })
  const [showNameModal, setShowNameModal] = useState(false)

  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showMonthlyReport, setShowMonthlyReport] = useState(false)
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)
  const [showDailyReport, setShowDailyReport] = useState(false)
  const [tempName, setTempName] = useState('')

  // Save settings to Firestore
  const saveSettingsToFirestore = async (profileData, notificationData) => {
    if (!user?.uid) return

    try {
      const userSettingsRef = doc(db, 'userSettings', user.uid)
      await setDoc(userSettingsRef, {
        profile: profileData,
        notifications: notificationData,
        lastUpdated: serverTimestamp()
      })
    } catch (error) {
      // Silent error handling
    }
  }

  // Load settings from Firestore
  const loadSettingsFromFirestore = async () => {
    if (!user?.uid) return

    try {
      const userSettingsRef = doc(db, 'userSettings', user.uid)
      const docSnap = await getDoc(userSettingsRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.profile) {
          setProfile(data.profile)
        }
        if (data.notifications) {
          setNotifications(data.notifications)
        }
      } else {
        // Initialize with Firebase user data if no settings exist
        const initialProfile = {
          name: user.displayName || '',
          email: user.email || '',
          userType: 'student'
        }
        setProfile(initialProfile)
        await saveSettingsToFirestore(initialProfile, notifications)
      }
    } catch (error) {
      // Silent error handling
    }
  }

  useEffect(() => {
    if (user?.uid) {
      loadSettingsFromFirestore()
    }
  }, [user])

  useEffect(() => {
    if (user?.uid) {
      saveSettingsToFirestore(profile, notifications)
    }
  }, [profile, notifications, user?.uid])





  const updateName = () => {
    if (tempName.trim()) {
      setProfile(prev => ({ ...prev, name: tempName.trim() }))
      setShowNameModal(false)
    } else {
      toast.error('দয়া করে একটি বৈধ নাম লিখুন')
    }
  }

  const handleSignOut = () => {
    logout()
    setShowSignOutModal(false)
  }

  const SettingItem = ({ icon: Icon, title, subtitle, onClick, rightElement }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 md:p-6 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
    >
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
        <Icon size={24} className="text-gray-600" />
      </div>

      <div className="flex-1 text-left">
        <div className="font-medium text-gray-800 text-lg">{title}</div>
        {subtitle && <div className="text-lg text-gray-500 mt-1">{subtitle}</div>}
      </div>

      {rightElement || <ChevronRight size={20} className="text-gray-400" />}
    </button>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">সেটিংস</h1>
        <p className="text-gray-600 text-xl md:text-base">আপনার অ্যাকাউন্ট এবং পছন্দসমূহ পরিচালনা করুন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          {/* Profile Section */}
          <div>
            <h3 className="font-semibold text-gray-800 text-2xl mb-4">অ্যাকাউন্ট</h3>
            <div className="space-y-3 border">
              <SettingItem
                icon={User}
                title="প্রোফাইল"
                subtitle={`${user?.displayName || profile.name || 'কোন নাম সেট করা হয়নি'} • ${user?.email || 'কোন ইমেইল নেই'}`}
                onClick={() => {
                  setTempName(user?.displayName || profile.name || '')
                  setShowNameModal(true)
                }}
              />
            </div>
          </div>

          {/* App Settings */}
          <div>
            <h3 className="font-semibold text-gray-800 text-2xl mb-4">অ্যাপ সেটিংস</h3>
            <div className="space-y-3 border">
              <SettingItem
                icon={Bell}
                title="নোটিফিকেশন"
                subtitle="নামাজের রিমাইন্ডার, কাজের সতর্কতা"
                onClick={() => {
                  const newState = !notifications.prayer
                  setNotifications(prev => ({
                    ...prev,
                    prayer: newState,
                    tasks: newState,
                    growth: newState
                  }))
                }}
                rightElement={
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications.prayer ? 'bg-blue-500' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifications.prayer ? 'translate-x-6' : ''}`} />
                  </div>
                }
              />
            </div>
          </div>

          {/* Reports */}
          <div>
            <h3 className="font-semibold text-gray-800 text-2xl mb-4">রিপোর্ট ডাউনলোড</h3>
            <div className="space-y-3 border">
              <button
                onClick={() => setShowDailyReport(true)}
                className="w-full flex items-center gap-4 p-4 md:p-6 bg-green-50 hover:bg-green-100 transition-colors shadow-sm border border-green-200"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock size={24} className="text-green-600" />
                </div>

                <div className="flex-1 text-left">
                  <div className="font-medium text-green-800 text-lg">দৈনিক রিপোর্ট</div>
                  <div className="text-lg text-green-600 mt-1">আজকের নামাজ ও গ্রোথের বিস্তারিত</div>
                </div>

                <ChevronRight size={20} className="text-green-400" />
              </button>

              <button
                onClick={() => setShowWeeklyReport(true)}
                className="w-full flex items-center gap-4 p-4 md:p-6 bg-green-50 hover:bg-green-100 transition-colors shadow-sm border border-green-200"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar size={24} className="text-green-600" />
                </div>

                <div className="flex-1 text-left">
                  <div className="font-medium text-green-800 text-lg">সাপ্তাহিক রিপোর্ট</div>
                  <div className="text-lg text-green-600 mt-1">সপ্তাহের অগ্রগতি ও পরিসংখ্যান</div>
                </div>

                <ChevronRight size={20} className="text-green-400" />
              </button>

              <button
                onClick={() => setShowMonthlyReport(true)}
                className="w-full flex items-center gap-4 p-4 md:p-6 bg-green-50 hover:bg-green-100 transition-colors shadow-sm border border-green-200"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <BarChart3 size={24} className="text-green-600" />
                </div>

                <div className="flex-1 text-left">
                  <div className="font-medium text-green-800 text-lg">মাসিক রিপোর্ট</div>
                  <div className="text-lg text-green-600 mt-1">নামাজ ট্র্যাকিং এবং গ্রোথের স্কোর দেখুন</div>
                </div>

                <ChevronRight size={20} className="text-green-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Billing */}
          <div>
            <h3 className="font-semibold text-gray-800 text-2xl mb-4">বিলিং</h3>
            <div className="border space-y-3">
              <SettingItem
                icon={CreditCard}
                title="বিলিং"
                subtitle="ফ্রি ভার্সন - আপাতত বিলিং প্রয়োজন নেই"
                onClick={() => { }}
              />
            </div>
          </div>



          {/* Account Actions */}
          <div>
            <h3 className="font-semibold text-gray-800 text-2xl mb-4">অ্যাকাউন্ট অ্যাকশন</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowSignOutModal(true)}
                className="w-full flex items-center gap-4 p-4 md:p-6 bg-red-100 rounded-lg hover:bg-red-200 transition-colors border border-blue-200"
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut size={24} className="text-red-600" />
                </div>

                <div className="flex-1 text-left">
                  <div className="font-medium text-red-600 text-lg">সাইন আউট</div>
                  <div className="text-lg text-red-600 mt-1">আপনার অ্যাকাউন্ট থেকে সাইন আউট করুন</div>
                </div>

                <ChevronRight size={20} className="text-red-400" />
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-gray-500 mt-8">
        <p>Muhasaba.org v1.0.0</p>
        <p className="mt-1">মুসলিমদের জন্য ❤️ দিয়ে তৈরি</p>
        <p>©️Divine Consultancy</p>
      </div>

      {/* Name Edit Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">নাম সম্পাদনা করুন</h3>
              <button
                onClick={() => setShowNameModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xl font-medium text-gray-700 mb-2">আপনার নাম</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="আপনার নাম লিখুন"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && updateName()}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={updateName}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  সেভ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">সাইন আউট</h3>
              <button
                onClick={() => setShowSignOutModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট থেকে সাইন আউট করতে চান?</p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  সাইন আউট
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Report Modals */}
      {showDailyReport && (
        <DailyReportModal onClose={() => setShowDailyReport(false)} />
      )}

      {showWeeklyReport && (
        <WeeklyReport onClose={() => setShowWeeklyReport(false)} />
      )}

      {showMonthlyReport && (
        <MonthlyReport onClose={() => setShowMonthlyReport(false)} />
      )}

    </div>
  )
}

export default SettingsPage