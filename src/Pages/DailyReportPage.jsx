import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, CheckCircle, XCircle, Clock, Target } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
    doc,
    getDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore'
import { db } from '../firebase'

const DailyReportPage = () => {
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState('')
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
            console.log('Loading report data for date:', date, 'user:', user.uid)

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

            console.log('Loaded data:', {
                growthExists: growthDoc.exists(),
                growthData,
                prayerExists: prayerDoc.exists(),
                prayerData,
                userType
            })

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

    // Handle date change
    const handleDateChange = (newDate) => {
        setSelectedDate(newDate)
        setLoading(true)
        loadReportData(newDate)
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
            <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">রিপোর্ট লোড হচ্ছে...</p>
                </div>
            </div>
        )
    }

    const { imanScore, lifeScore, overallScore } = calculateGrowthScores()
    const { totalPrayed, totalJamat, totalMissed } = calculatePrayerStats()
    const { completed, missed } = getGrowthBreakdown()

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
            {/* Header */}
            <div className="text-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">দৈনিক রিপোর্ট</h1>
                
                {/* Date Selector */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            max={getTodayDateString()}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                
                <div className="text-base md:text-lg text-gray-600 px-4 break-words">
                    {formatDateForDisplay(selectedDate)}
                </div>
            </div>

            {/* Overall Score Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 md:p-6 mb-6 text-white">
                <div className="text-center">
                    <h2 className="text-lg md:text-2xl font-bold mb-2">সামগ্রিক গ্রোথ স্কোর</h2>
                    <div className="text-3xl md:text-5xl font-bold mb-4">{overallScore}%</div>
                    
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="bg-white/20 rounded-lg p-3 md:p-4">
                            <div className="text-xl md:text-2xl font-bold">{imanScore}%</div>
                            <div className="text-sm md:text-lg">ইমান গ্রোথ</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3 md:p-4">
                            <div className="text-xl md:text-2xl font-bold">{lifeScore}%</div>
                            <div className="text-sm md:text-lg">লাইফ গ্রোথ</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prayer Stats */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="text-green-600" />
                    নামাজের অবস্থা
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{totalPrayed}/5</div>
                        <div className="text-gray-700">পড়েছি</div>
                    </div>
                    <div className="text-center bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">{totalJamat}/5</div>
                        <div className="text-gray-700">জামাতে</div>
                    </div>
                    <div className="text-center bg-red-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-red-600">{totalMissed}/5</div>
                        <div className="text-gray-700">মিসড</div>
                    </div>
                </div>
            </div>

            {/* No Data Message */}
            {!reportData?.growth && !reportData?.prayers && (
                <div className="bg-gray-50 rounded-xl p-8 mb-6 text-center">
                    <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-gray-600 mb-2">এই দিনের কোন ডেটা পাওয়া যায়নি</h3>
                    <p className="text-gray-500">
                        {selectedDate === getTodayDateString() 
                            ? 'আজকের গ্রোথ ট্র্যাকিং শুরু করতে গ্রোথ স্কোর পেজে যান।'
                            : 'এই দিনে কোন গ্রোথ ডেটা রেকর্ড করা হয়নি।'
                        }
                    </p>
                </div>
            )}

            {/* Completed Tasks */}
            {completed.length > 0 && (
                <div className="bg-green-50 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="text-green-600" />
                        সম্পন্ন কাজসমূহ ({completed.length})
                    </h3>
                    
                    <div className="space-y-2">
                        {completed.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                                <span className="text-gray-800 text-sm md:text-base">
                                    <span className="font-medium text-xs md:text-sm text-green-600">[{item.category}]</span> {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Missed Tasks */}
            {missed.length > 0 && (
                <div className="bg-red-50 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <XCircle className="text-red-600" />
                        অসম্পূর্ণ কাজসমূহ ({missed.length})
                    </h3>
                    
                    <div className="space-y-2">
                        {missed.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                <XCircle className="text-red-500 flex-shrink-0" size={20} />
                                <span className="text-gray-800 text-sm md:text-base">
                                    <span className="font-medium text-xs md:text-sm text-red-600">[{item.category}]</span> {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Motivational Message */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 text-center">
                <Target className="mx-auto text-purple-600 mb-3" size={32} />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {overallScore >= 80 ? 'চমৎকার! আপনি দুর্দান্ত করছেন!' :
                     overallScore >= 60 ? 'ভালো! আরো উন্নতির সুযোগ আছে।' :
                     overallScore >= 40 ? 'চেষ্টা চালিয়ে যান! আপনি পারবেন।' :
                     'নতুন দিন, নতুন সুযোগ! আজ আরো ভালো করুন।'}
                </h3>
                <p className="text-gray-600">
                    প্রতিদিনের ছোট ছোট উন্নতিই বড় পরিবর্তন আনে। আল্লাহ আপনার সাথে আছেন।
                </p>
            </div>
        </div>
    )
}

export default DailyReportPage