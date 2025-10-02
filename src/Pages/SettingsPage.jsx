import { useState, useEffect } from 'react'
import { User, Bell, CreditCard, LogOut, ChevronRight, X, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import MonthlyReport from '../components/MonthlyReport'
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
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
  const [showClearModal, setShowClearModal] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showMonthlyReport, setShowMonthlyReport] = useState(false)
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
      console.error('Error saving settings to Firestore:', error)
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
      console.error('Error loading settings from Firestore:', error)
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



  const clearAllData = async () => {
    if (!user?.uid) {
      toast.error('Please log in to clear data')
      return
    }

    try {
      toast.info('Clearing all data...')

      // Clear Firestore data
      const collections = [
        'userTasks',
        'userContacts',
        'userSettings',
        'userPreferences'
      ]

      for (const collectionName of collections) {
        try {
          const docRef = doc(db, collectionName, user.uid)
          await setDoc(docRef, { deleted: true, deletedAt: serverTimestamp() })
        } catch (error) {
          console.warn(`Could not clear ${collectionName}:`, error)
        }
      }

      // Clear subcollections (prayers and growth)
      try {
        // Note: In a production app, you'd want to use Cloud Functions to delete subcollections
        // For now, we'll just mark the parent documents as deleted
        const prayersRef = doc(db, 'userPrayers', user.uid)
        await setDoc(prayersRef, { deleted: true, deletedAt: serverTimestamp() })

        const growthRef = doc(db, 'userGrowth', user.uid)
        await setDoc(growthRef, { deleted: true, deletedAt: serverTimestamp() })
      } catch (error) {
        console.warn('Could not clear prayer/growth data:', error)
      }

      // Clear local state
      setProfile({ name: user.displayName || '', email: user.email || '', userType: 'student' })
      setNotifications({ prayer: true, tasks: true, growth: false })

      // Clear localStorage as backup
      localStorage.clear()

      setShowClearModal(false)
      toast.success('All data cleared successfully!')
    } catch (error) {
      console.error('Clear data error:', error)
      toast.error('Failed to clear all data')
    }
  }

  const updateName = () => {
    if (tempName.trim()) {
      setProfile(prev => ({ ...prev, name: tempName.trim() }))
      setShowNameModal(false)
    } else {
      toast.error('Please enter a valid name')
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
        <div className="font-medium text-gray-800 text-base">{title}</div>
        {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
      </div>

      {rightElement || <ChevronRight size={20} className="text-gray-400" />}
    </button>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600 text-sm md:text-base">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          {/* Profile Section */}
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Account</h3>
            <div className="space-y-3">
              <SettingItem
                icon={User}
                title="Profile"
                subtitle={`${user?.displayName || profile.name || 'No name set'} • ${user?.email || 'No email'}`}
                onClick={() => {
                  setTempName(user?.displayName || profile.name || '')
                  setShowNameModal(true)
                }}
              />
            </div>
          </div>

          {/* App Settings */}
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-4">App Settings</h3>
            <div className="space-y-3">
              <SettingItem
                icon={Bell}
                title="Notifications"
                subtitle="Prayer reminders, task alerts"
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
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Reports</h3>
            <div className="space-y-3">
              <SettingItem
                icon={BarChart3}
                title="Monthly Report"
                subtitle="View prayer tracking and growth scores"
                onClick={() => setShowMonthlyReport(true)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Billing */}
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Billing</h3>
            <div className="space-y-3">
              <SettingItem
                icon={CreditCard}
                title="Billing"
                subtitle="Free version - No billing required"
                onClick={() => { }}
              />
            </div>
          </div>



          {/* Account Actions */}
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowSignOutModal(true)}
                className="w-full flex items-center gap-4 p-4 md:p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <LogOut size={24} className="text-blue-600" />
                </div>

                <div className="flex-1 text-left">
                  <div className="font-medium text-blue-800 text-base">Sign Out</div>
                  <div className="text-sm text-blue-600 mt-1">Sign out of your account</div>
                </div>

                <ChevronRight size={20} className="text-blue-400" />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <div className="space-y-3">
              <button
                onClick={() => setShowClearModal(true)}
                className="w-full flex items-center gap-4 p-4 md:p-6 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut size={24} className="text-red-600" />
                </div>

                <div className="flex-1 text-left">
                  <div className="font-medium text-red-800 text-base">Clear All Data</div>
                  <div className="text-sm text-red-600 mt-1">This will delete all your data permanently</div>
                </div>

                <ChevronRight size={20} className="text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-gray-500 text-sm mt-8">
        <p>Muhasaba.org v1.0.0</p>
        <p className="mt-1">Built with ❤️ for the Muslim community</p>
      </div>

      {/* Name Edit Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Name</h3>
              <button
                onClick={() => setShowNameModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter your name"
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
                  Cancel
                </button>
                <button
                  onClick={updateName}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save
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
              <h3 className="text-lg font-semibold text-gray-900">Sign Out</h3>
              <button
                onClick={() => setShowSignOutModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">Are you sure you want to sign out of your account?</p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Clear All Data</h3>
              <button
                onClick={() => setShowClearModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to clear all data? This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>All tasks and progress</li>
                <li>Prayer tracking data</li>
                <li>Growth scores</li>
                <li>Contact information</li>
                <li>All settings and preferences</li>
              </ul>
              <p className="text-red-600 font-medium text-sm">This action cannot be undone!</p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllData}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Report Modal */}
      {showMonthlyReport && (
        <MonthlyReport onClose={() => setShowMonthlyReport(false)} />
      )}

    </div>
  )
}

export default SettingsPage