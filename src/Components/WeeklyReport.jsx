import React, { useState, useEffect } from 'react'
import { X, Calendar, TrendingUp, Heart, Clock, Star, ChevronLeft, ChevronRight, Lightbulb, Download } from 'lucide-react'
import { toast } from 'react-toastify'
import { getWeeklyData, getAverage } from '../utils/dataManager'
import { useAuth } from '../contexts/AuthContext'
import { downloadReportAsImage, formatWeekForFilename } from '../utils/downloadUtils'

const WeeklyReport = ({ onClose }) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const getWeekRange = (date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    return { start: startOfWeek, end: endOfWeek }
  }

  const formatWeekRange = (date) => {
    const { start, end } = getWeekRange(date)
    const options = { month: 'short', day: 'numeric' }
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
    } else {
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${start.getFullYear()}`
    }
  }

  const generateReport = async () => {
    if (!user?.uid) {
      toast.error('Please log in to view reports')
      return
    }

    setLoading(true)
    
    try {
      const { start, end } = getWeekRange(selectedWeek)
      const weekData = await getWeeklyData(start, end, user.uid)
      setReportData(weekData)
    } catch (error) {
      console.error('Error generating weekly report:', error)
      toast.error('Failed to generate weekly report')
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
    setReportData(null)
  }

  useEffect(() => {
    generateReport()
  }, [selectedWeek])

  const handleDownload = async () => {
    try {
      const { start, end } = getWeekRange(selectedWeek)
      const filename = `weekly-report-${formatWeekForFilename(start, end)}`
      await downloadReportAsImage('weekly-report-modal', filename)
      toast.success('রিপোর্ট ডাউনলোড হয়েছে!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('রিপোর্ট ডাউনলোড করতে সমস্যা হয়েছে')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div id="weekly-report-modal" className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">সাপ্তাহিক রিপোর্ট</h2>
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

        {/* Week Selector */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeWeek(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {formatWeekRange(selectedWeek)}
              </h3>
              <p className="text-sm text-gray-600">সপ্তাহ নির্বাচন করুন</p>
            </div>
            
            <button
              onClick={() => changeWeek(1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={selectedWeek >= new Date()}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div id="weekly-report-content" className="report-content p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">রিপোর্ট তৈরি হচ্ছে...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">ট্র্যাক করা দিন</h4>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.summary.trackedDays}/7
                  </div>
                  <p className="text-sm text-blue-700">
                    {Math.round((reportData.summary.trackedDays / 7) * 100)}% কভারেজ
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">নামাজের গড়</h4>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.prayers.length > 0 ? 
                      Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length * 5)) * 100) : 0}%
                  </div>
                  <p className="text-sm text-green-700">
                    {reportData.summary.prayerStats.jamat} জামাত নামাজ
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-800">গ্রোথের গড়</h4>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {getAverage(reportData.summary.growthStats.overall)}%
                  </div>
                  <p className="text-sm text-purple-700">
                    ঈমান: {getAverage(reportData.summary.growthStats.iman)}% | 
                    জীবন: {getAverage(reportData.summary.growthStats.life)}%
                  </p>
                </div>
              </div>

              {/* Daily Breakdown */}
              {reportData.prayers.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    দৈনিক বিবরণ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'].map((day, index) => {
                      const dayData = reportData.prayers.find(p => new Date(p.date).getDay() === index)
                      const growthData = reportData.growth.find(g => new Date(g.date).getDay() === index)
                      
                      return (
                        <div key={index} className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium text-sm text-gray-700">{day}</div>
                          <div className="text-xs mt-1">
                            {dayData ? (
                              <div className="text-green-600">{dayData.prayed}/5</div>
                            ) : (
                              <div className="text-gray-400">-</div>
                            )}
                          </div>
                          <div className="text-xs">
                            {growthData ? (
                              <div className="text-purple-600">{growthData.overall}%</div>
                            ) : (
                              <div className="text-gray-400">-</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Insights */}
              {(reportData.prayers.length > 0 || reportData.growth.length > 0) && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    সাপ্তাহিক অন্তর্দৃষ্টি
                  </h4>
                  <div className="space-y-2">
                    {Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length * 5)) * 100) >= 90 ? (
                      <div className="text-sm text-green-700 bg-green-100 rounded p-2">
                        🌟 চমৎকার নামাজের ধারাবাহিকতা! এভাবেই চালিয়ে যান।
                      </div>
                    ) : Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length * 5)) * 100) >= 70 ? (
                      <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                        👍 ভালো নামাজের অভ্যাস। আরও ভালো ফলাফলের জন্য ধারাবাহিকতা বাড়ান।
                      </div>
                    ) : (
                      <div className="text-sm text-orange-700 bg-orange-100 rounded p-2">
                        💡 নামাজের ধারাবাহিকতা উন্নত করুন। নিয়মিত নামাজের জন্য রিমাইন্ডার সেট করুন।
                      </div>
                    )}

                    {getAverage(reportData.summary.growthStats.overall) >= 80 ? (
                      <div className="text-sm text-purple-700 bg-purple-100 rounded p-2">
                        🚀 অসাধারণ ব্যক্তিগত গ্রোথ! আপনি চমৎকার অভ্যাস বজায় রাখছেন।
                      </div>
                    ) : getAverage(reportData.summary.growthStats.overall) >= 60 ? (
                      <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                        📈 ব্যক্তিগত উন্নয়নে ভালো অগ্রগতি। এই ইতিবাচক অভ্যাসগুলো গড়ে তুলুন।
                      </div>
                    ) : (
                      <div className="text-sm text-yellow-700 bg-yellow-100 rounded p-2">
                        🎯 ভালো ব্যক্তিগত গ্রোথের জন্য ধারাবাহিক দৈনিক অভ্যাস গড়ুন।
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {reportData.prayers.length === 0 && reportData.growth.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">কোন ডেটা পাওয়া যায়নি</h3>
                  <p className="text-gray-500">
                    এই সপ্তাহের জন্য কোন নামাজ বা গ্রোথ ট্র্যাকিং ডেটা পাওয়া যায়নি।
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="text-center text-sm text-gray-500">
            সাপ্তাহিক রিপোর্ট - {formatWeekRange(selectedWeek)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyReport