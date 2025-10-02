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
    const [prayerData, setPrayerData] = useState({
        fajr: { prayed: false, jamat: false },
        dhuhr: { prayed: false, jamat: false },
        asr: { prayed: false, jamat: false },
        maghrib: { prayed: false, jamat: false },
        isha: { prayed: false, jamat: false }
    })
    const [qazaData, setQazaData] = useState({
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
    })

    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    const prayerNames = {
        fajr: 'ফজর',
        dhuhr: 'যুহর',
        asr: 'আসর',
        maghrib: 'মাগরিব',
        isha: 'ইশা'
    }

    // Helper function to get today's date string
    const getTodayDateString = () => {
        return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    }

    // Save prayer data to Firestore
    const savePrayerDataToFirestore = async (todayPrayers = prayerData, qazaPrayers = qazaData) => {
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

            // Save qaza data
            const qazaRef = doc(db, 'userPrayers', user.uid)
            await setDoc(qazaRef, {
                qazaData: qazaPrayers,
                lastUpdated: serverTimestamp()
            }, { merge: true })


        } catch (error) {
            console.error('Error saving prayer data to Firestore:', error)
        }
    }

    // Helper function to get yesterday's date string
    const getYesterdayDateString = () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return yesterday.toISOString().split('T')[0]
    }

    // Check yesterday's prayers and add missed ones to qaza (only if not already checked)
    const checkAndAddMissedPrayersToQaza = async (currentQazaData, lastQazaCheck) => {
        if (!user?.uid) return currentQazaData

        try {
            const yesterday = getYesterdayDateString()
            
            // Only check yesterday if we haven't already processed it
            if (lastQazaCheck === yesterday) {
                return currentQazaData // Already processed yesterday's prayers
            }

            const yesterdayPrayerRef = doc(db, 'userPrayers', user.uid, 'dailyPrayers', yesterday)
            const yesterdayDoc = await getDoc(yesterdayPrayerRef)

            if (yesterdayDoc.exists()) {
                const yesterdayPrayers = yesterdayDoc.data().prayers
                const updatedQaza = { ...currentQazaData }
                let qazaAdded = false

                // Check each prayer from yesterday
                Object.entries(yesterdayPrayers).forEach(([prayerName, prayerStatus]) => {
                    if (!prayerStatus.prayed) {
                        updatedQaza[prayerName] = (updatedQaza[prayerName] || 0) + 1
                        qazaAdded = true
                    }
                })

                if (qazaAdded) {
                    return updatedQaza
                }
            }

            return currentQazaData
        } catch (error) {
            console.error('Error checking yesterday\'s prayers:', error)
            return currentQazaData
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
            }

            // Load qaza data
            const qazaRef = doc(db, 'userPrayers', user.uid)
            const qazaDoc = await getDoc(qazaRef)
            
            let currentQazaData = {
                fajr: 0,
                dhuhr: 0,
                asr: 0,
                maghrib: 0,
                isha: 0
            }

            if (qazaDoc.exists() && qazaDoc.data().qazaData) {
                currentQazaData = qazaDoc.data().qazaData
            }

            // Check if we need to add missed prayers to qaza (only once per missed day)
            const lastQazaCheck = qazaDoc.exists() ? qazaDoc.data().lastQazaCheck : null
            const yesterday = getYesterdayDateString()

            // Only check yesterday's prayers if we haven't already processed that specific day
            if (lastQazaCheck !== yesterday) {
                // Check yesterday's prayers and add any missed ones
                const updatedQazaData = await checkAndAddMissedPrayersToQaza(currentQazaData, lastQazaCheck)
                setQazaData(updatedQazaData)
                
                // Update the last check date to yesterday (the day we just processed)
                if (user?.uid) {
                    const qazaRef = doc(db, 'userPrayers', user.uid)
                    await setDoc(qazaRef, {
                        qazaData: updatedQazaData,
                        lastUpdated: serverTimestamp(),
                        lastQazaCheck: yesterday
                    }, { merge: true })
                }
            } else {
                setQazaData(currentQazaData)
            }

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
        return Object.values(qazaData).reduce((sum, count) => sum + count, 0)
    }

    const prayQaza = async (prayer) => {
        if (qazaData[prayer] > 0) {
            const updatedQazaData = {
                ...qazaData,
                [prayer]: Math.max(0, qazaData[prayer] - 1)
            }
            
            // Update local state immediately
            setQazaData(updatedQazaData)
            
            // Save to database immediately
            if (user?.uid) {
                try {
                    const qazaRef = doc(db, 'userPrayers', user.uid)
                    await setDoc(qazaRef, {
                        qazaData: updatedQazaData,
                        lastUpdated: serverTimestamp()
                    }, { merge: true })
                } catch (error) {
                    console.error('Error saving qaza prayer completion:', error)
                    // Revert local state if save failed
                    setQazaData(qazaData)
                }
            }
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
                    <Calendar size={16} />
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
                    <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                        <Clock size={20} />
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
                    <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Moon size={20} />
                            কাজা নামাজ
                        </div>
                        <span className="text-2xl font-bold text-orange-600">{getTotalQaza()}</span>
                    </h3>

                    {getTotalQaza() === 0 ? (
                        <div className="text-center py-6">
                            <Moon size={48} className="mx-auto mb-4 text-orange-400" />
                            <p className="text-gray-600 text-sm">কোন বাকি নামাজ নেই</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(qazaData).map(([prayer, count]) => (
                                count > 0 && (
                                    <div key={prayer} className="flex items-center justify-between bg-white/70 rounded-lg p-3">
                                        <span className="font-medium text-gray-800">{prayerNames[prayer]}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-orange-600 font-bold">{count}</span>
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