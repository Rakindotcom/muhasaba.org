import React, { useState, useEffect } from 'react'
import { X, Calendar, TrendingUp, Heart, Clock, Star, ChevronLeft, ChevronRight, Lightbulb, CheckCircle, XCircle, Download } from 'lucide-react'
import { toast } from 'react-toastify'
import { getDailyData } from '../utils/dataManager'
import { useAuth } from '../contexts/AuthContext'
import { downloadReportAsImage, formatDateForFilename } from '../utils/downloadUtils'

const DailyReport = ({ onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const formatDate = (date) => {
    return date.toLocaleDateString('bn-BD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const generateReport = async () => {
    if (!user?.uid) {
      toast.error('Please log in to view reports')
      return
    }

    setLoading(true)
    
    try {
      const dailyData = await getDailyData(selectedDate, user.uid)
      setReportData(dailyData)
    } catch (error) {
      console.error('Error generating daily report:', error)
      toast.error('Failed to generate daily report')
    } finally {
      setLoading(false)
    }
  }

  const changeDate = (direction) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + direction)
      return newDate
    })
    setReportData(null)
  }

  useEffect(() => {
    generateReport()
  }, [selectedDate])

  const handleDownload = async () => {
    try {
      const filename = `daily-report-${formatDateForFilename(selectedDate)}`
      await downloadReportAsImage('daily-report-modal', filename)
      toast.success('রিপোর্ট ডাউনলোড হয়েছে!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('রিপোর্ট ডাউনলোড করতে সমস্যা হয়েছে')
    }
  }

  const prayerNames = {
    fajr: 'ফজর',
    dhuhr: 'যুহর',
    asr: 'আসর',
    maghrib: 'মাগরিব',
    isha: 'ইশা'
  }

  const imanItems = {
    istigfar: 'ইস্তিগফার',
    salam: 'সালাম',
    miswak: 'মিসওয়াক',
    quranTouch: 'কুরআন স্পর্শ',
    masnunDua: 'মাসনুন দোয়া',
    prayerOnTime: 'সময়মত নামাজ',
    quranReflect: 'কুরআন চিন্তা'
  }

  const lifeItems = {
    student: {
      academics: 'পড়াশোনা',
      career: 'ক্যারিয়ার',
      meal: 'খাবার',
      attendance: 'উপস্থিতি',
      gratitude: 'কৃতজ্ঞতা',
      exercise: 'ব্যায়াম',
      sleep: 'ঘুম'
    },
    professional: {
      messages: 'বার্তা',
      meal: 'খাবার',
      deepWork: 'গভীর কাজ',
      help: 'সাহায্য',
      gratitude: 'কৃতজ্ঞতা',
      exercise: 'ব্যায়াম',
      sleep: 'ঘুম'
    },
    homemaker: {
      organizing: 'সংগঠন',
      family: 'পরিবার',
      selfCare: 'স্ব-যত্ন',
      learning: 'শেখা',
      communication: 'যোগাযোগ',
      muhasaba: 'মুহাসাবা',
      exercise: 'ব্যায়াম'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div id="daily-report-modal" className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">দৈনিক রিপোর্ট</h2>
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

        {/* Date Selector */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {formatDate(selectedDate)}
              </h3>
              <p className="text-sm text-gray-600">তারিখ নির্বাচন করুন</p>
            </div>
            
            <button
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={selectedDate >= new Date()}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div id="daily-report-content" className="report-content p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">রিপোর্ট তৈরি হচ্ছে...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">নামাজ</h4>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.prayers ? reportData.prayers.prayed : 0}/5
                  </div>
                  <p className="text-sm text-green-700">
                    {reportData.prayers ? reportData.prayers.jamat : 0} জামাত
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">ঈমান স্কোর</h4>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.growth ? reportData.growth.iman : 0}%
                  </div>
                  <p className="text-sm text-blue-700">
                    আধ্যাত্মিক গ্রোথ
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-800">জীবন স্কোর</h4>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.growth ? reportData.growth.life : 0}%
                  </div>
                  <p className="text-sm text-purple-700">
                    দৈনন্দিন জীবন
                  </p>
                </div>
              </div>

              {/* Prayer Details */}
              {reportData.prayers && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    নামাজের বিস্তারিত
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {Object.entries(prayerNames).map(([key, name]) => {
                      const prayer = reportData.prayers.details[key]
                      return (
                        <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-gray-700 mb-2">{name}</div>
                          <div className="flex justify-center items-center gap-2">
                            {prayer?.prayed ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                            {prayer?.jamat && (
                              <Star className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {prayer?.jamat ? 'জামাত' : prayer?.prayed ? 'একা' : 'মিসড'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Growth Details */}
              {reportData.growth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Iman Details */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      ঈমানী কাজসমূহ
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(imanItems).map(([key, name]) => {
                        const completed = reportData.growth.details.iman[key]
                        return (
                          <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{name}</span>
                            {completed ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Life Details */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      জীবনযাত্রার কাজসমূহ
                    </h4>
                    <div className="space-y-2">
                      {reportData.growth.details.life && Object.entries(lifeItems[reportData.growth.userType] || lifeItems.student).map(([key, name]) => {
                        const completed = reportData.growth.details.life[key]
                        return (
                          <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{name}</span>
                            {completed ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Insights */}
              {(reportData.prayers || reportData.growth) && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    দৈনিক অন্তর্দৃষ্টি
                  </h4>
                  <div className="space-y-2">
                    {reportData.prayers && (
                      <>
                        {reportData.prayers.percentage >= 100 ? (
                          <div className="text-sm text-green-700 bg-green-100 rounded p-2">
                            🌟 মাশাআল্লাহ! আজ সব নামাজ আদায় করেছেন।
                          </div>
                        ) : reportData.prayers.percentage >= 80 ? (
                          <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                            👍 ভালো! বেশিরভাগ নামাজ আদায় করেছেন।
                          </div>
                        ) : (
                          <div className="text-sm text-orange-700 bg-orange-100 rounded p-2">
                            💡 আগামীকাল আরও নামাজ আদায়ের চেষ্টা করুন।
                          </div>
                        )}
                      </>
                    )}

                    {reportData.growth && (
                      <>
                        {reportData.growth.overall >= 80 ? (
                          <div className="text-sm text-purple-700 bg-purple-100 rounded p-2">
                            🚀 চমৎকার! আজ খুব ভালো গ্রোথ হয়েছে।
                          </div>
                        ) : reportData.growth.overall >= 60 ? (
                          <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                            📈 ভালো অগ্রগতি! আরও গ্রোথের সুযোগ আছে।
                          </div>
                        ) : (
                          <div className="text-sm text-yellow-700 bg-yellow-100 rounded p-2">
                            🎯 আগামীকাল আরও ভালো করার চেষ্টা করুন।
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {!reportData.prayers && !reportData.growth && (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">কোন ডেটা পাওয়া যায়নি</h3>
                  <p className="text-gray-500">
                    এই দিনের জন্য কোন নামাজ বা গ্রোথ ট্র্যাকিং ডেটা পাওয়া যায়নি।
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="text-center text-sm text-gray-500">
            দৈনিক রিপোর্ট - {formatDate(selectedDate)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyReport