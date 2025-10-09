import { useState, useEffect } from 'react'
import { Calendar, X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
    doc,
    getDoc
} from 'firebase/firestore'
import { db } from '../firebase'

const DailyReportModal = ({ onClose }) => {
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const { user } = useAuth()

    // Helper function to get today's date string
    const getTodayDateString = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Helper function to format date for display
    const formatDateForDisplay = (dateString) => {
        const date = new Date(dateString)
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
        
        // Use English locale for better compatibility and then translate
        const englishDate = date.toLocaleDateString('en-US', options)
        
        // Simple Bengali translation for common day/month names
        const bengaliTranslations = {
            'Sunday': 'রবিবার',
            'Monday': 'সোমবার', 
            'Tuesday': 'মঙ্গলবার',
            'Wednesday': 'বুধবার',
            'Thursday': 'বৃহস্পতিবার',
            'Friday': 'শুক্রবার',
            'Saturday': 'শনিবার',
            'January': 'জানুয়ারি',
            'February': 'ফেব্রুয়ারি',
            'March': 'মার্চ',
            'April': 'এপ্রিল',
            'May': 'মে',
            'June': 'জুন',
            'July': 'জুলাই',
            'August': 'আগস্ট',
            'September': 'সেপ্টেম্বর',
            'October': 'অক্টোবর',
            'November': 'নভেম্বর',
            'December': 'ডিসেম্বর'
        }
        
        let translatedDate = englishDate
        Object.entries(bengaliTranslations).forEach(([english, bengali]) => {
            translatedDate = translatedDate.replace(english, bengali)
        })
        
        return translatedDate
    }

    // Load report data for a specific date
    const loadReportData = async (date) => {
        if (!user?.uid || !date) {
            setLoading(false)
            return
        }

        try {
            // Load growth data
            const growthRef = doc(db, 'userGrowth', user.uid, 'dailyGrowth', date)
            const growthDoc = await getDoc(growthRef)

            // Load prayer data
            const prayerRef = doc(db, 'userPrayers', user.uid, 'dailyPrayers', date)
            const prayerDoc = await getDoc(prayerRef)

            // Load user preferences for user type
            const prefsRef = doc(db, 'userPreferences', user.uid)
            const prefsDoc = await getDoc(prefsRef)

            const growthData = growthDoc.exists() ? growthDoc.data() : null
            const prayerData = prayerDoc.exists() ? prayerDoc.data() : null
            const userType = prefsDoc.exists() ? prefsDoc.data().userType || 'student' : 'student'

            setReportData({
                date,
                growth: growthData,
                prayers: prayerData,
                userType
            })

        } catch (error) {
            console.error('Error loading report data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Initialize with today's date
    useEffect(() => {
        const today = getTodayDateString()
        setSelectedDate(today)
        loadReportData(today)
    }, [user?.uid])

    // Close date picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDatePicker && !event.target.closest('.date-picker-container')) {
                setShowDatePicker(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showDatePicker])

    // Handle date change
    const handleDateChange = (newDate) => {
        setSelectedDate(newDate)
        setLoading(true)
        setShowDatePicker(false)
        loadReportData(newDate)
    }

    // Navigate to previous/next day
    const navigateDate = (direction) => {
        const currentDate = new Date(selectedDate)
        currentDate.setDate(currentDate.getDate() + direction)
        const newDateString = getDateString(currentDate)
        
        // Don't go beyond today
        if (newDateString <= getTodayDateString()) {
            handleDateChange(newDateString)
        }
    }

    // Helper to convert date object to string
    const getDateString = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Get short date format for display
    const getShortDateFormat = (dateString) => {
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        
        if (dateString === getTodayDateString()) {
            return 'আজ'
        } else if (dateString === getDateString(yesterday)) {
            return 'গতকাল'
        } else {
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
        }
    }

    // Handle download
    const handleDownload = async () => {
        try {
            const { downloadReportAsImage, formatDateForFilename } = await import('../utils/downloadUtils')
            const filename = `daily-report-${formatDateForFilename(new Date(selectedDate))}`
            await downloadReportAsImage('daily-report-modal', filename)
            
            const { toast } = await import('react-toastify')
            toast.success('দৈনিক রিপোর্ট ডাউনলোড হয়েছে!')
        } catch (error) {
            console.error('Download error:', error)
            const { toast } = await import('react-toastify')
            toast.error('রিপোর্ট ডাউনলোড করতে সমস্যা হয়েছে')
        }
    }

    // Calculate growth scores
    const calculateGrowthScores = () => {
        if (!reportData?.growth?.growthData) {
            return { imanScore: 0, lifeScore: 0, overallScore: 0 }
        }

        const { growthData } = reportData.growth
        
        // Iman score calculation
        const imanItems = ['istigfar', 'prayer', 'quran', 'islamicLecture', 'protection']
        const imanCompleted = imanItems.filter(item => growthData.iman && growthData.iman[item]).length
        const imanScore = Math.round((imanCompleted / imanItems.length) * 100)

        // Life score calculation based on user type
        const lifeChecklists = {
            student: ['deepStudy', 'careerDev', 'family', 'exercise', 'sleep'],
            professional: ['deepWork', 'professionalDev', 'family', 'exercise', 'sleep'],
            homemaker: ['hobby', 'journaling', 'selfCare', 'communication', 'sleep']
        }

        const lifeItems = lifeChecklists[reportData.userType] || lifeChecklists.student
        const lifeCompleted = lifeItems.filter(item => growthData.life && growthData.life[item]).length
        const lifeScore = Math.round((lifeCompleted / lifeItems.length) * 100)

        const overallScore = Math.round((imanScore + lifeScore) / 2)

        return { imanScore, lifeScore, overallScore }
    }

    // Calculate prayer stats
    const calculatePrayerStats = () => {
        if (!reportData?.prayers?.prayers) {
            return { totalPrayed: 0, totalJamat: 0, totalMissed: 5 }
        }

        const prayers = Object.values(reportData.prayers.prayers)
        const totalPrayed = prayers.filter(p => p && p.prayed).length
        const totalJamat = prayers.filter(p => p && p.jamat).length
        const totalMissed = 5 - totalPrayed

        return { totalPrayed, totalJamat, totalMissed }
    }

    // Get detailed growth breakdown
    const getGrowthBreakdown = () => {
        if (!reportData?.growth?.growthData) return { completed: [], missed: [] }

        const { growthData } = reportData.growth
        
        const imanItems = [
            { key: 'istigfar', label: 'ইস্তিগফার ও মাইন্ডফুল জিকির' },
            { key: 'prayer', label: '৫ ওয়াক্ত নামাজ' },
            { key: 'quran', label: 'কমপক্ষে ১০ মিনিট অর্থসহ কুরআন' },
            { key: 'islamicLecture', label: 'ইসলামিক লেকচার/সীরাত' },
            { key: 'protection', label: 'চোখ ও মুখের হেফাজত' }
        ]

        const lifeChecklists = {
            student: [
                { key: 'deepStudy', label: 'কমপক্ষে ২ঘণ্টা ডিপ স্ট্যাডি - একাডেমিক' },
                { key: 'careerDev', label: 'ক্যারিয়ার ডেভেলপমেন্ট' },
                { key: 'family', label: 'পরিবারকে সময়' },
                { key: 'exercise', label: 'অন্তত ১৫ মিনিট হাঁটা/ব্যায়াম' },
                { key: 'sleep', label: 'রাত ১১ টার মধ্যে ঘুম' }
            ],
            professional: [
                { key: 'deepWork', label: 'কমপক্ষে ৩ ঘণ্টা ডিপ ওয়ার্ক' },
                { key: 'professionalDev', label: 'প্রফেশনাল ডেভেলপমেন্ট' },
                { key: 'family', label: 'পরিবার ও আত্মীয়স্বজনকে সময়' },
                { key: 'exercise', label: 'অন্তত ১৫ মিনিট হাঁটা/ব্যায়াম' },
                { key: 'sleep', label: 'রাত ১১ টার মধ্যে ঘুম' }
            ],
            homemaker: [
                { key: 'hobby', label: 'শখের কাজে সময়' },
                { key: 'journaling', label: 'মনের কথা জার্নালিং' },
                { key: 'selfCare', label: 'নিজের যত্ন' },
                { key: 'communication', label: 'পরিবার ও আত্মীয়দের সাথে যোগাযোগ' },
                { key: 'sleep', label: 'রাত ১১ টার মধ্যে ঘুম' }
            ]
        }

        const allItems = [
            ...imanItems.map(item => ({ ...item, category: 'ইমান' })),
            ...(lifeChecklists[reportData.userType] || lifeChecklists.student).map(item => ({ ...item, category: 'জীবন' }))
        ]

        const completed = []
        const missed = []

        allItems.forEach(item => {
            const isCompleted = item.category === 'ইমান' 
                ? growthData.iman && growthData.iman[item.key]
                : growthData.life && growthData.life[item.key]

            if (isCompleted) {
                completed.push(item)
            } else {
                missed.push(item)
            }
        })

        return { completed, missed }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">রিপোর্ট লোড হচ্ছে...</p>
                    </div>
                </div>
            </div>
        )
    }

    const { imanScore, lifeScore, overallScore } = calculateGrowthScores()
    const { totalPrayed, totalJamat, totalMissed } = calculatePrayerStats()
    const { completed, missed } = getGrowthBreakdown()

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div id="daily-report-modal" className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header with Close Button */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-800">দৈনিক রিপোর্ট</h2>
                    <div className="flex items-center gap-2">
                        {reportData && (
                            <button
                                onClick={handleDownload}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                title="রিপোর্ট ডাউনলোড করুন"
                            >
                                <Download size={20} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div id="daily-report-content" className="p-6 pb-32 md:pb-6">
                    {/* Modern Date Selector */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            {/* Previous Day Button */}
                            <button
                                onClick={() => navigateDate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="আগের দিন"
                            >
                                <ChevronLeft size={20} className="text-gray-600" />
                            </button>

                            {/* Date Display Button */}
                            <div className="relative date-picker-container">
                                <button
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors shadow-sm"
                                >
                                    <Calendar className="text-blue-600" size={18} />
                                    <span className="font-medium text-gray-800">
                                        {getShortDateFormat(selectedDate)}
                                    </span>
                                </button>

                                {/* Custom Date Picker Dropdown */}
                                {showDatePicker && (
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-3 min-w-[200px]">
                                        <div className="text-xs text-gray-500 mb-3 text-center">তারিখ নির্বাচন করুন</div>
                                        
                                        {/* Quick Date Shortcuts */}
                                        <div className="flex gap-1 mb-3">
                                            <button
                                                onClick={() => handleDateChange(getTodayDateString())}
                                                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                                            >
                                                আজ
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const yesterday = new Date()
                                                    yesterday.setDate(yesterday.getDate() - 1)
                                                    handleDateChange(getDateString(yesterday))
                                                }}
                                                className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                                            >
                                                গতকাল
                                            </button>
                                        </div>

                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => handleDateChange(e.target.value)}
                                            max={getTodayDateString()}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Next Day Button */}
                            <button
                                onClick={() => navigateDate(1)}
                                disabled={selectedDate >= getTodayDateString()}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="পরের দিন"
                            >
                                <ChevronRight size={20} className="text-gray-600" />
                            </button>
                        </div>
                        
                        <div className="text-sm text-gray-600 px-4">
                            {formatDateForDisplay(selectedDate)}
                        </div>
                    </div>

                    {/* Simple Score Card */}
                    <div className="bg-gray-50 border rounded-lg p-4 mb-6">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">সামগ্রিক গ্রোথ স্কোর</h3>
                            <div className="text-2xl font-bold text-gray-800 mb-3">{overallScore}%</div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-white border rounded p-2">
                                    <div className="font-semibold text-gray-800">{imanScore}%</div>
                                    <div className="text-gray-600">ইমান গ্রোথ</div>
                                </div>
                                <div className="bg-white border rounded p-2">
                                    <div className="font-semibold text-gray-800">{lifeScore}%</div>
                                    <div className="text-gray-600">লাইফ গ্রোথ</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prayer Details */}
                    <div className="bg-white border rounded-lg p-4 mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">নামাজের বিস্তারিত</h4>
                        
                        {/* Prayer Summary */}
                        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                            <div className="text-center bg-gray-50 rounded p-2">
                                <div className="font-semibold text-gray-800">{totalPrayed}/5</div>
                                <div className="text-gray-600">পড়েছি</div>
                            </div>
                            <div className="text-center bg-gray-50 rounded p-2">
                                <div className="font-semibold text-gray-800">{totalJamat}/5</div>
                                <div className="text-gray-600">জামাতে</div>
                            </div>
                            <div className="text-center bg-gray-50 rounded p-2">
                                <div className="font-semibold text-gray-800">{totalMissed}/5</div>
                                <div className="text-gray-600">মিসড</div>
                            </div>
                        </div>

                        {/* Individual Prayer Status */}
                        {reportData?.prayers?.prayers && (
                            <div className="space-y-2">
                                {Object.entries({
                                    fajr: 'ফজর',
                                    dhuhr: 'যুহর', 
                                    asr: 'আসর',
                                    maghrib: 'মাগরিব',
                                    isha: 'ইশা'
                                }).map(([key, name]) => {
                                    const prayer = reportData.prayers.prayers[key] || { prayed: false, jamat: false }
                                    return (
                                        <div key={key} className="flex items-center justify-between bg-gray-50 rounded p-2 text-sm">
                                            <span className="font-medium text-gray-800">{name}</span>
                                            <div className="flex gap-2">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    prayer.prayed 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {prayer.prayed ? '✓ পড়েছি' : '✗ মিসড'}
                                                </span>
                                                {prayer.prayed && (
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        prayer.jamat 
                                                            ? 'bg-blue-100 text-blue-700' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {prayer.jamat ? '✓ জামাত' : 'একা'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* No Data Message */}
                    {!reportData?.growth && !reportData?.prayers && (
                        <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
                            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                            <h4 className="text-lg font-bold text-gray-600 mb-2">এই দিনের কোন ডেটা পাওয়া যায়নি</h4>
                            <p className="text-gray-500 text-sm">
                                {selectedDate === getTodayDateString() 
                                    ? 'আজকের গ্রোথ ট্র্যাকিং শুরু করতে গ্রোথ স্কোর পেজে যান।'
                                    : 'এই দিনে কোন গ্রোথ ডেটা রেকর্ড করা হয়নি।'
                                }
                            </p>
                        </div>
                    )}

                    {/* Growth Tasks */}
                    {(completed.length > 0 || missed.length > 0) && (
                        <div className="bg-white border rounded-lg p-4 mb-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">গ্রোথ কার্যক্রম</h4>
                            
                            {/* Completed Tasks */}
                            {completed.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">✓ সম্পন্ন ({completed.length})</h5>
                                    <div className="space-y-1">
                                        {completed.map((item, index) => (
                                            <div key={index} className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                                                <span className="text-xs text-gray-500">[{item.category}]</span> {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missed Tasks */}
                            {missed.length > 0 && (
                                <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">✗ অসম্পূর্ণ ({missed.length})</h5>
                                    <div className="space-y-1">
                                        {missed.map((item, index) => (
                                            <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                                                <span className="text-xs text-gray-400">[{item.category}]</span> {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Simple Summary */}
                    <div className="bg-gray-50 border rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-gray-800 mb-1">
                            {overallScore >= 80 ? 'চমৎকার! আপনি দুর্দান্ত করছেন!' :
                             overallScore >= 60 ? 'ভালো! আরো উন্নতির সুযোগ আছে।' :
                             overallScore >= 40 ? 'চেষ্টা চালিয়ে যান! আপনি পারবেন।' :
                             'নতুন দিন, নতুন সুযোগ! আজ আরো ভালো করুন।'}
                        </p>
                        <p className="text-xs text-gray-600">
                            প্রতিদিনের ছোট ছোট উন্নতিই বড় পরিবর্তন আনে।
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DailyReportModal