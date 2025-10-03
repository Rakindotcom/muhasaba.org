import { useState, useEffect } from 'react'
import { Check, X, Clock, Moon, Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/AuthContext'
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase'

const PrayerPage = () => {
    // Helper function to get today's date string
    const getTodayDateString = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const [prayerData, setPrayerData] = useState({
        fajr: { prayed: false, jamat: false },
        dhuhr: { prayed: false, jamat: false },
        asr: { prayed: false, jamat: false },
        maghrib: { prayed: false, jamat: false },
        isha: { prayed: false, jamat: false }
    })
    const [qazaData, setQazaData] = useState({
        prayers: {
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false
        },
        date: null
    })

    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(getTodayDateString())
    const { user } = useAuth()

    const prayerNames = {
        fajr: 'ফজর',
        dhuhr: 'যুহর',
        asr: 'আসর',
        maghrib: 'মাগরিব',
        isha: 'ইশা'
    }

    // Save prayer data to Firestore
    const savePrayerDataToFirestore = async (todayPrayers = prayerData) => {
        if (!user?.uid) return

        try {
            const today = getTodayDateString()
            
            // Save today's prayer data
            const dailyPrayerRef = doc(db, 'userPrayers', user.uid, 'dailyPrayers', today)
            await setDoc(dailyPrayerRef, {
                prayers: todayPrayers,
                date: today,
                lastUpdated: serverTimestamp()
            })

        } catch (error) {
            console.error('Error saving prayer data to Firestore:', error)
        }
    }

    // Helper function to get yesterday's date string
    const getYesterdayDateString = () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        
        const year = yesterday.getFullYear()
        const month = String(yesterday.getMonth() + 1).padStart(2, '0')
        const day = String(yesterday.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Helper function to format date in Bengali
    const formatDateInBengali = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('bn-BD', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    }

    // Load yesterday's missed prayers for qaza
    const loadYesterdayQaza = async () => {
        if (!user?.uid) return { prayers: {}, date: null }

        try {
            const yesterday = getYesterdayDateString()
            const yesterdayPrayerRef = doc(db, 'userPrayers', user.uid, 'dailyPrayers', yesterday)
            const yesterdayDoc = await getDoc(yesterdayPrayerRef)

            if (yesterdayDoc.exists()) {
                const yesterdayPrayers = yesterdayDoc.data().prayers
                const missedPrayers = {}

                // Find missed prayers from yesterday
                Object.entries(yesterdayPrayers).forEach(([prayerName, prayerStatus]) => {
                    missedPrayers[prayerName] = !prayerStatus.prayed
                })

                return {
                    prayers: missedPrayers,
                    date: yesterday
                }
            }

            return { prayers: {}, date: null }
        } catch (error) {
            console.error('Error loading yesterday\'s prayers:', error)
            return { prayers: {}, date: null }
        }
    }

    // Load prayer data from Firestore
    const loadPrayerDataFromFirestore = async () => {
        if (!user?.uid) {
            setLoading(false)
            return
        }

        try {
            const today = getTodayDateString()
            
            // Load today's prayer data
            const dailyPrayerRef = doc(db, 'userPrayers', user.uid, 'dailyPrayers', today)
            const dailyDoc = await getDoc(dailyPrayerRef)
            
            if (dailyDoc.exists()) {
                setPrayerData(dailyDoc.data().prayers)
            } else {
                // Reset to default state for new day
                setPrayerData({
                    fajr: { prayed: false, jamat: false },
                    dhuhr: { prayed: false, jamat: false },
                    asr: { prayed: false, jamat: false },
                    maghrib: { prayed: false, jamat: false },
                    isha: { prayed: false, jamat: false }
                })
            }

            // Load yesterday's missed prayers for qaza
            const yesterdayQaza = await loadYesterdayQaza()
            setQazaData(yesterdayQaza)

        } catch (error) {
            console.error('Error loading prayer data from Firestore:', error)
        } finally {
            setLoading(false)
        }
    }

    // Load data when user changes or component mounts
    useEffect(() => {
        if (user?.uid) {
            loadPrayerDataFromFirestore()
        } else {
            setLoading(false)
        }
    }, [user?.uid])

    // Auto-save when prayer data changes
    useEffect(() => {
        if (!loading && user?.uid) {
            savePrayerDataToFirestore()
        }
    }, [prayerData, user?.uid, loading])

    // Check for date change and reset prayer data for new day
    useEffect(() => {
        const checkDateChange = async () => {
            const today = getTodayDateString()
            if (today !== currentDate && !loading) {
                // Date has changed, reset prayer data and reload
                setCurrentDate(today)
                setPrayerData({
                    fajr: { prayed: false, jamat: false },
                    dhuhr: { prayed: false, jamat: false },
                    asr: { prayed: false, jamat: false },
                    maghrib: { prayed: false, jamat: false },
                    isha: { prayed: false, jamat: false }
                })
                // Reload data for the new day
                if (user?.uid) {
                    await loadPrayerDataFromFirestore()
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
                    await loadPrayerDataFromFirestore()
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [currentDate, user?.uid])

    const togglePrayer = (prayer, type) => {
        setPrayerData(prev => {
            const currentValue = prev[prayer][type]
            const newValue = !currentValue

            // If toggling jamat to true, also set prayed to true
            if (type === 'jamat' && newValue) {
                return {
                    ...prev,
                    [prayer]: {
                        ...prev[prayer],
                        prayed: true,
                        jamat: true
                    }
                }
            }

            // If toggling prayed to false, also set jamat to false
            if (type === 'prayed' && !newValue) {
                return {
                    ...prev,
                    [prayer]: {
                        ...prev[prayer],
                        prayed: false,
                        jamat: false
                    }
                }
            }

            // Normal toggle
            return {
                ...prev,
                [prayer]: {
                    ...prev[prayer],
                    [type]: newValue
                }
            }
        })
    }

    const getStats = () => {
        const prayers = Object.values(prayerData)
        const totalPrayed = prayers.filter(p => p.prayed).length
        const totalJamat = prayers.filter(p => p.jamat).length
        const totalMissed = 5 - totalPrayed

        return { totalPrayed, totalJamat, totalMissed }
    }



    const getTotalQaza = () => {
        if (!qazaData.prayers) return 0
        return Object.values(qazaData.prayers).filter(missed => missed).length
    }

    const prayQaza = async (prayer) => {
        if (qazaData.prayers[prayer]) {
            const updatedQazaData = {
                ...qazaData,
                prayers: {
                    ...qazaData.prayers,
                    [prayer]: false
                }
            }
            
            // Update local state immediately
            setQazaData(updatedQazaData)
            
            // Show success message
            toast.success(`${prayerNames[prayer]} কাজা নামাজ সম্পন্ন হয়েছে`)
        }
    }



    const { totalPrayed, totalJamat, totalMissed } = getStats()

    // Show loading state
    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">আপনার নামাজের ডেটা লোড হচ্ছে...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
            <div className="text-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">নামাজ ট্র্যাকার</h1>
                <p className="text-gray-600 text-sm md:text-base">দিনের শেষে পর্যালোচনা</p>
                <div className="mt-2 flex items-center justify-center gap-2 text-blue-600">
                    <span className="text-sm font-medium">
                        {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </span>
                </div>

            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
                <div className="bg-green-50 rounded-xl p-4 md:p-6 text-center hover:bg-green-100 transition-colors">
                    <div className="text-2xl md:text-4xl font-bold text-green-600">{totalPrayed}</div>
                    <div className="text-xs md:text-sm text-green-700 mt-1">পড়েছি</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 md:p-6 text-center hover:bg-blue-100 transition-colors">
                    <div className="text-2xl md:text-4xl font-bold text-blue-600">{totalJamat}</div>
                    <div className="text-xs md:text-sm text-blue-700 mt-1">জামাত</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 md:p-6 text-center hover:bg-red-100 transition-colors">
                    <div className="text-2xl md:text-4xl font-bold text-red-600">{totalMissed}</div>
                    <div className="text-xs md:text-sm text-red-700 mt-1">মিসড</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Prayer List */}
                <div className="lg:col-span-2 bg-white rounded-xl p-4 md:p-6 mb-6 lg:mb-0 shadow-sm">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">
                        আজকের নামাজ
                    </h3>

                    <div className="space-y-3">
                        {Object.entries(prayerNames).map(([key, name]) => (
                            <div key={key} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <span className="font-medium text-gray-800 mb-2 md:mb-0 text-lg">{name}</span>

                                <div className="flex gap-2 md:gap-3">
                                    <button
                                        onClick={() => togglePrayer(key, 'prayed')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${prayerData[key].prayed
                                            ? 'bg-green-100 text-green-700 scale-105'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                            }`}
                                    >
                                        {prayerData[key].prayed ? <Check size={16} /> : <X size={16} />}
                                        পড়েছি
                                    </button>

                                    <button
                                        onClick={() => togglePrayer(key, 'jamat')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${prayerData[key].jamat
                                            ? 'bg-blue-100 text-blue-700 scale-105'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                            }`}
                                    >
                                        {prayerData[key].jamat ? <Check size={16} /> : <X size={16} />}
                                        জামাত
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Qaza Section */}
                <div className="bg-orange-50 rounded-xl p-4 md:p-6 h-fit">
                    <h3 className="font-semibold text-gray-800 text-lg mb-2 flex items-center justify-between">
                        <div>
                            কাজা নামাজ
                        </div>
                        <span className="text-2xl font-bold text-orange-600">{getTotalQaza()}</span>
                    </h3>

                    {qazaData.date && (
                        <div className="mb-4 text-center">
                            <p className="text-xs text-gray-600 bg-white/50 rounded-lg px-2 py-1">
                                {formatDateInBengali(qazaData.date)} এর মিসড নামাজ
                            </p>
                        </div>
                    )}

                    {getTotalQaza() === 0 ? (
                        <div className="text-center py-6">
                            <Moon size={48} className="mx-auto mb-4 text-orange-400" />
                            <p className="text-gray-600 text-sm">গতকালের কোন বাকি নামাজ নেই</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(qazaData.prayers).map(([prayer, missed]) => (
                                missed && (
                                    <div key={prayer} className="flex items-center justify-between bg-white/70 rounded-lg p-3">
                                        <span className="font-medium text-gray-800">{prayerNames[prayer]}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => prayQaza(prayer)}
                                                className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                                            >
                                                পড়ুন
                                            </button>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </div>


        </div>
    )
}

export default PrayerPage