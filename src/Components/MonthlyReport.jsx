import React, { useState, useEffect } from 'react'
import { X, Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-toastify'
import { getMonthlyData, getAverage } from '../utils/dataManager'
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
      <div id="monthly-report-modal" className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">মাসিক রিপোর্ট</h2>
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
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-800">
                {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
              </h3>
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

        {/* Report Content - Scrollable */}
        <div id="monthly-report-content" className="flex-1 overflow-y-auto p-6 pb-32 md:pb-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">রিপোর্ট তৈরি হচ্ছে...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Simple Summary */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3">মাসিক সারসংক্ষেপ</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white border rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{reportData.summary.trackedDays}/{reportData.summary.totalDays}</div>
                    <div className="text-gray-600">ট্র্যাক করা দিন</div>
                  </div>
                  <div className="bg-white border rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">
                      {reportData.prayers.length > 0 ? 
                        Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length * 5)) * 100) : 0}%
                    </div>
                    <div className="text-gray-600">নামাজের গড়</div>
                  </div>
                  <div className="bg-white border rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{reportData.summary.prayerStats.jamat}</div>
                    <div className="text-gray-600">জামাত নামাজ</div>
                  </div>
                  <div className="bg-white border rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{getAverage(reportData.summary.growthStats.overall)}%</div>
                    <div className="text-gray-600">গড় গ্রোথ স্কোর</div>
                  </div>
                </div>
              </div>

              {/* Prayer Details */}
              {reportData.prayers.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-800 mb-4">নামাজের বিস্তারিত</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 text-sm">সাম্প্রতিক দৈনিক নামাজ</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {reportData.prayers.slice(-10).map((day, index) => (
                          <div key={index} className="flex justify-between text-sm bg-gray-50 rounded p-2">
                            <span>{day.day} তারিখ</span>
                            <span className="text-gray-700">
                              {day.prayed}/5 {day.jamat > 0 && `(${day.jamat} জামাত)`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 text-sm">মাসিক মোট</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm bg-gray-50 rounded p-2">
                          <span>মোট নামাজ:</span>
                          <span className="font-medium">{reportData.summary.prayerStats.total}</span>
                        </div>
                        <div className="flex justify-between text-sm bg-gray-50 rounded p-2">
                          <span>জামাত নামাজ:</span>
                          <span className="font-medium">{reportData.summary.prayerStats.jamat}</span>
                        </div>
                        <div className="flex justify-between text-sm bg-gray-50 rounded p-2">
                          <span>মিসড নামাজ:</span>
                          <span className="font-medium">{reportData.summary.prayerStats.missed}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Growth Details */}
              {reportData.growth.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-800 mb-4">গ্রোথ স্কোরের বিস্তারিত</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 text-sm">সাম্প্রতিক দৈনিক স্কোর</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {reportData.growth.slice(-10).map((day, index) => (
                          <div key={index} className="flex justify-between text-sm bg-gray-50 rounded p-2">
                            <span>{day.day} তারিখ</span>
                            <span className="text-gray-700">{day.overall}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2 text-sm">মাসিক গড়</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm bg-gray-50 rounded p-2">
                          <span>সামগ্রিক স্কোর:</span>
                          <span className="font-medium">{getAverage(reportData.summary.growthStats.overall)}%</span>
                        </div>
                        <div className="flex justify-between text-sm bg-gray-50 rounded p-2">
                          <span>ঈমান স্কোর:</span>
                          <span className="font-medium">{getAverage(reportData.summary.growthStats.iman)}%</span>
                        </div>
                        <div className="flex justify-between text-sm bg-gray-50 rounded p-2">
                          <span>জীবন স্কোর:</span>
                          <span className="font-medium">{getAverage(reportData.summary.growthStats.life)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {reportData.prayers.length === 0 && reportData.growth.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">কোন ডেটা পাওয়া যায়নি</h3>
                  <p className="text-gray-500 text-sm">
                    {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()} এর জন্য কোন নামাজ বা গ্রোথ ট্র্যাকিং ডেটা পাওয়া যায়নি।
                  </p>
                </div>
              )}

              {/* Simple Summary */}
              {(reportData.prayers.length > 0 || reportData.growth.length > 0) && (
                <div className="bg-gray-50 border rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-700">
                    এই মাসে আপনি {reportData.summary.trackedDays} দিন ট্র্যাক করেছেন এবং 
                    গড়ে {Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length || 1)))} টি নামাজ পড়েছেন।
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          <div className="text-center text-sm text-gray-500">
            মাসিক রিপোর্ট - {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyReport