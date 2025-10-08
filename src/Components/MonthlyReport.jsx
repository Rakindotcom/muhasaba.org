import React, { useState, useEffect } from 'react'
import { X, Calendar, TrendingUp, Heart, Clock, Star, Download, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { toast } from 'react-toastify'
import { getMonthlyData, getAverage, exportMonthlyReport } from '../utils/dataManager'
import { useAuth } from '../contexts/AuthContext'
import { downloadReportAsImage, formatMonthForFilename } from '../utils/downloadUtils'

const MonthlyReport = ({ onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ]

  const generateReport = async () => {
    if (!user?.uid) {
      toast.error('রিপোর্ট দেখতে লগইন করুন')
      return
    }

    setLoading(true)
    
    try {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth()
      
      const monthData = await getMonthlyData(year, month, user.uid)
      setReportData(monthData)
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('রিপোর্ট তৈরি করতে ব্যর্থ')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth()
      const filename = `monthly-report-${formatMonthForFilename(year, month)}`
      await downloadReportAsImage('monthly-report-modal', filename)
      toast.success('রিপোর্ট ডাউনলোড হয়েছে!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('রিপোর্ট ডাউনলোড করতে সমস্যা হয়েছে')
    }
  }





  const changeMonth = (direction) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
    setReportData(null) // Clear previous report
  }

  useEffect(() => {
    generateReport()
  }, [selectedMonth])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div id="monthly-report-modal" className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">মাসিক রিপোর্ট</h2>
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

        {/* Month Selector */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
              </h3>
              <p className="text-sm text-gray-600">মাস নির্বাচন করুন</p>
            </div>
            
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={selectedMonth >= new Date()}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div id="monthly-report-content" className="report-content p-6 overflow-y-auto max-h-[60vh]">
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
                    {reportData.summary.trackedDays}/{reportData.summary.totalDays}
                  </div>
                  <p className="text-sm text-blue-700">
                    {Math.round((reportData.summary.trackedDays / reportData.summary.totalDays) * 100)}% কভারেজ
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
                    <h4 className="font-semibold text-purple-800">উন্নতির গড়</h4>
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

              {/* Prayer Details */}
              {reportData.prayers.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    নামাজ ট্র্যাকিং বিবরণ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">দৈনিক নামাজের সংখ্যা</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {reportData.prayers.slice(-10).map((day, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{day.day} তারিখ</span>
                            <span className="text-green-600">
                              {day.prayed}/5 ({day.percentage || Math.round((day.prayed / 5) * 100)}%) 
                              {day.jamat > 0 && ` • ${day.jamat} জামাত`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">মাসিক মোট</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>মোট নামাজ:</span>
                          <span className="font-medium">{reportData.summary.prayerStats.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>জামাত নামাজ:</span>
                          <span className="font-medium text-blue-600">{reportData.summary.prayerStats.jamat}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>মিসড নামাজ:</span>
                          <span className="font-medium text-red-600">{reportData.summary.prayerStats.missed}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Growth Details */}
              {reportData.growth.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    উন্নতি স্কোর বিবরণ
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">সাম্প্রতিক দৈনিক স্কোর</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {reportData.growth.slice(-10).map((day, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{day.day} তারিখ</span>
                            <span className="text-purple-600">{day.overall}% (ঈ:{day.iman}% জী:{day.life}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">মাসিক গড়</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>সামগ্রিক স্কোর:</span>
                          <span className="font-medium text-purple-600">{getAverage(reportData.summary.growthStats.overall)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>ঈমান স্কোর:</span>
                          <span className="font-medium text-green-600">{getAverage(reportData.summary.growthStats.iman)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>জীবন স্কোর:</span>
                          <span className="font-medium text-blue-600">{getAverage(reportData.summary.growthStats.life)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Insights Section */}
              {(reportData.prayers.length > 0 || reportData.growth.length > 0) && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    মাসিক অন্তর্দৃষ্টি
                  </h4>
                  <div className="space-y-2">
                    {/* Prayer Insights */}
                    {reportData.prayers.length > 0 && (
                      <>
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
                      </>
                    )}
                    
                    {/* Growth Insights */}
                    {reportData.growth.length > 0 && (
                      <>
                        {getAverage(reportData.summary.growthStats.overall) >= 80 ? (
                          <div className="text-sm text-purple-700 bg-purple-100 rounded p-2">
                            🚀 অসাধারণ ব্যক্তিগত উন্নতি! আপনি চমৎকার অভ্যাস বজায় রাখছেন।
                          </div>
                        ) : getAverage(reportData.summary.growthStats.overall) >= 60 ? (
                          <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                            📈 ব্যক্তিগত উন্নয়নে ভালো অগ্রগতি। এই ইতিবাচক অভ্যাসগুলো গড়ে তুলুন।
                          </div>
                        ) : (
                          <div className="text-sm text-yellow-700 bg-yellow-100 rounded p-2">
                            🎯 ভালো ব্যক্তিগত উন্নতির জন্য ধারাবাহিক দৈনিক অভ্যাস গড়ুন।
                          </div>
                        )}
                      </>
                    )}

                    {/* Tracking Consistency */}
                    {Math.round((reportData.summary.trackedDays / reportData.summary.totalDays) * 100) < 70 && (
                      <div className="text-sm text-gray-700 bg-gray-100 rounded p-2">
                        📊 ভালো অন্তর্দৃষ্টি ও অনুপ্রেরণার জন্য আরও নিয়মিত অগ্রগতি ট্র্যাক করুন।
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
                    {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()} এর জন্য কোন নামাজ বা উন্নতি ট্র্যাকিং ডেটা পাওয়া যায়নি।
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="text-center text-sm text-gray-500">
            মাসিক রিপোর্ট - {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyReport