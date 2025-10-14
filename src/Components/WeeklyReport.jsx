import React, { useState, useEffect } from 'react'
import { X, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const WeeklyReport = ({ onClose }) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // Helper function to get date string
  const getDateString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get week range (Sunday to Saturday)
  const getWeekRange = (date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    return { start: startOfWeek, end: endOfWeek }
  }

  // Format week range for display
  const formatWeekRange = (date) => {
    const { start, end } = getWeekRange(date)
    const startStr = `${start.getDate()}/${start.getMonth() + 1}`
    const endStr = `${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`
    return `${startStr} - ${endStr}`
  }

  // Load weekly data
  const loadWeeklyData = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { start } = getWeekRange(selectedWeek)
      const weekData = {
        prayers: [],
        growth: [],
        summary: {
          totalPrayers: 0,
          totalJamat: 0,
          totalMissed: 0,
          avgGrowthScore: 0,
          avgImanScore: 0,
          avgLifeScore: 0,
          trackedDays: 0
        }
      }

      // Load data for each day of the week
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(start)
        currentDate.setDate(start.getDate() + i)
        const dateStr = getDateString(currentDate)

        // Load prayer data
        const prayerRef = doc(db, 'userPrayers', user.uid, 'dailyPrayers', dateStr)
        const prayerDoc = await getDoc(prayerRef)
        
        // Load growth data
        const growthRef = doc(db, 'userGrowth', user.uid, 'dailyGrowth', dateStr)
        const growthDoc = await getDoc(growthRef)

        if (prayerDoc.exists() || growthDoc.exists()) {
          weekData.summary.trackedDays++
        }

        if (prayerDoc.exists()) {
          const prayers = prayerDoc.data().prayers
          const prayed = Object.values(prayers).filter(p => p.prayed).length
          const jamat = Object.values(prayers).filter(p => p.jamat).length
          
          weekData.prayers.push({
            date: dateStr,
            day: currentDate.getDate(),
            dayName: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'][currentDate.getDay()],
            prayed,
            jamat,
            missed: 5 - prayed,
            prayers
          })

          weekData.summary.totalPrayers += prayed
          weekData.summary.totalJamat += jamat
          weekData.summary.totalMissed += (5 - prayed)
        }

        if (growthDoc.exists()) {
          const growthData = growthDoc.data().growthData
          const userType = growthDoc.data().userType || 'student'
          
          // Calculate scores
          const imanItems = ['istigfar', 'prayer', 'quran', 'islamicLecture', 'protection']
          const imanCompleted = imanItems.filter(item => growthData.iman && growthData.iman[item]).length
          const imanScore = Math.round((imanCompleted / imanItems.length) * 100)

          const lifeChecklists = {
            student: ['deepStudy', 'careerDev', 'family', 'exercise', 'sleep'],
            professional: ['deepWork', 'professionalDev', 'family', 'exercise', 'sleep'],
            homemaker: ['hobby', 'journaling', 'selfCare', 'communication', 'sleep']
          }
          const lifeItems = lifeChecklists[userType] || lifeChecklists.student
          const lifeCompleted = lifeItems.filter(item => growthData.life && growthData.life[item]).length
          const lifeScore = Math.round((lifeCompleted / lifeItems.length) * 100)
          const overallScore = Math.round((imanScore + lifeScore) / 2)

          weekData.growth.push({
            date: dateStr,
            day: currentDate.getDate(),
            dayName: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'][currentDate.getDay()],
            imanScore,
            lifeScore,
            overallScore
          })

          weekData.summary.avgImanScore += imanScore
          weekData.summary.avgLifeScore += lifeScore
          weekData.summary.avgGrowthScore += overallScore
        }
      }

      // Calculate averages
      if (weekData.growth.length > 0) {
        weekData.summary.avgImanScore = Math.round(weekData.summary.avgImanScore / weekData.growth.length)
        weekData.summary.avgLifeScore = Math.round(weekData.summary.avgLifeScore / weekData.growth.length)
        weekData.summary.avgGrowthScore = Math.round(weekData.summary.avgGrowthScore / weekData.growth.length)
      }

      setReportData(weekData)
    } catch (error) {
      console.error('Error loading weekly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeWeek = (direction) => {
    setSelectedWeek(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + (direction * 7))
      return newDate
    })
  }

  useEffect(() => {
    loadWeeklyData()
  }, [selectedWeek, user?.uid])

  // Handle download
  const handleDownload = async () => {
    try {
      const { downloadReportAsImage, formatWeekForFilename } = await import('../utils/downloadUtils')
      const { start, end } = getWeekRange(selectedWeek)
      const filename = formatWeekForFilename(start, end)
      await downloadReportAsImage('weekly-report-modal', filename)
      
      const { toast } = await import('react-toastify')
      toast.success('সাপ্তাহিক রিপোর্ট ডাউনলোড হয়েছে!')
    } catch (error) {
      console.error('Download error:', error)
      const { toast } = await import('react-toastify')
      toast.error('রিপোর্ট ডাউনলোড করতে সমস্যা হয়েছে')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div id="weekly-report-modal" className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">সাপ্তাহিক রিপোর্ট</h2>
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
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Week Selector */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeWeek(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-800">
                {formatWeekRange(selectedWeek)}
              </h3>
            </div>
            
            <button
              onClick={() => changeWeek(1)}
              className="p-2 hover:bg-gray-200 rounded-lg"
              disabled={selectedWeek >= new Date()}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div id="weekly-report-content" className="p-6 pb-32 md:pb-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">রিপোর্ট লোড হচ্ছে...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3">সাপ্তাহিক সারসংক্ষেপ</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white border rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{reportData.summary.trackedDays}/7</div>
                    <div className="text-gray-600">ট্র্যাক করা দিন</div>
                  </div>
                  <div className="bg-white border rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{reportData.summary.totalPrayers}</div>
                    <div className="text-gray-600">মোট নামাজ</div>
                  </div>
                  <div className="bg-white border rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{reportData.summary.totalJamat}</div>
                    <div className="text-gray-600">জামাত নামাজ</div>
                  </div>
                  <div className="bg-white border rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{reportData.summary.avgGrowthScore}%</div>
                    <div className="text-gray-600">গড় গ্রোথ স্কোর</div>
                  </div>
                </div>
              </div>

              {/* Daily Details */}
              {reportData.summary.trackedDays > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-800 mb-4">দৈনিক বিবরণ</h4>
                  <div className="space-y-2">
                    {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'].map((dayName, index) => {
                      const prayerData = reportData.prayers.find(p => new Date(p.date).getDay() === index)
                      const growthData = reportData.growth.find(g => new Date(g.date).getDay() === index)
                      
                      if (!prayerData && !growthData) return null
                      
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2 text-sm">
                          <span className="font-medium text-gray-800">{dayName}</span>
                          <div className="flex gap-4">
                            {prayerData && (
                              <span className="text-gray-600">
                                নামাজ: {prayerData.prayed}/5 {prayerData.jamat > 0 && `(${prayerData.jamat} জামাত)`}
                              </span>
                            )}
                            {growthData && (
                              <span className="text-gray-600">
                                গ্রোথ: {growthData.overallScore}%
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {reportData.summary.trackedDays === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">কোন ডেটা পাওয়া যায়নি</h3>
                  <p className="text-gray-500 text-sm">
                    এই সপ্তাহের জন্য কোন নামাজ বা গ্রোথ ট্র্যাকিং ডেটা পাওয়া যায়নি।
                  </p>
                </div>
              )}

              {/* Simple Summary */}
              {reportData.summary.trackedDays > 0 && (
                <div className="bg-gray-50 border rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-700">
                    এই সপ্তাহে আপনি {reportData.summary.trackedDays} দিন ট্র্যাক করেছেন এবং 
                    গড়ে {Math.round(reportData.summary.totalPrayers / reportData.prayers.length || 0)} টি নামাজ পড়েছেন।
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default WeeklyReport