import React, { useState, useEffect } from 'react'
import { X, Calendar, TrendingUp, Heart, Clock, Star, Download, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { toast } from 'react-toastify'
import { getMonthlyData, getAverage, exportMonthlyReport } from '../utils/dataManager'
import { useAuth } from '../contexts/AuthContext'

const MonthlyReport = ({ onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const generateReport = async () => {
    if (!user?.uid) {
      toast.error('Please log in to view reports')
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
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }



  const exportReport = () => {
    if (!reportData) return
    
    const reportContent = exportMonthlyReport(
      reportData, 
      selectedMonth.getMonth(), 
      selectedMonth.getFullYear()
    )
    
    const dataStr = JSON.stringify(reportContent, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `muhasaba-report-${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}.json`
    link.click()
    
    URL.revokeObjectURL(url)
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
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Monthly Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={24} />
          </button>
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
              <p className="text-sm text-gray-600">Select month to view report</p>
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating report...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Days Tracked</h4>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.summary.trackedDays}/{reportData.summary.totalDays}
                  </div>
                  <p className="text-sm text-blue-700">
                    {Math.round((reportData.summary.trackedDays / reportData.summary.totalDays) * 100)}% coverage
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Prayer Average</h4>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.prayers.length > 0 ? 
                      Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length * 5)) * 100) : 0}%
                  </div>
                  <p className="text-sm text-green-700">
                    {reportData.summary.prayerStats.jamat} Jamat prayers
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-800">Growth Average</h4>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {getAverage(reportData.summary.growthStats.overall)}%
                  </div>
                  <p className="text-sm text-purple-700">
                    Iman: {getAverage(reportData.summary.growthStats.iman)}% | 
                    Life: {getAverage(reportData.summary.growthStats.life)}%
                  </p>
                </div>
              </div>

              {/* Prayer Details */}
              {reportData.prayers.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Prayer Tracking Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Daily Prayer Count</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {reportData.prayers.slice(-10).map((day, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>Day {day.day}</span>
                            <span className="text-green-600">
                              {day.prayed}/5 ({day.percentage || Math.round((day.prayed / 5) * 100)}%) 
                              {day.jamat > 0 && ` • ${day.jamat} Jamat`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Monthly Totals</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Total Prayers:</span>
                          <span className="font-medium">{reportData.summary.prayerStats.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Jamat Prayers:</span>
                          <span className="font-medium text-blue-600">{reportData.summary.prayerStats.jamat}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Missed Prayers:</span>
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
                    Growth Score Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Recent Daily Scores</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {reportData.growth.slice(-10).map((day, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>Day {day.day}</span>
                            <span className="text-purple-600">{day.overall}% (I:{day.iman}% L:{day.life}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Monthly Averages</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Overall Score:</span>
                          <span className="font-medium text-purple-600">{getAverage(reportData.summary.growthStats.overall)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Iman Score:</span>
                          <span className="font-medium text-green-600">{getAverage(reportData.summary.growthStats.iman)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Life Score:</span>
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
                    Monthly Insights
                  </h4>
                  <div className="space-y-2">
                    {/* Prayer Insights */}
                    {reportData.prayers.length > 0 && (
                      <>
                        {Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length * 5)) * 100) >= 90 ? (
                          <div className="text-sm text-green-700 bg-green-100 rounded p-2">
                            🌟 Excellent prayer consistency! Keep up the great work.
                          </div>
                        ) : Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length * 5)) * 100) >= 70 ? (
                          <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                            👍 Good prayer habits. Try to improve consistency for even better results.
                          </div>
                        ) : (
                          <div className="text-sm text-orange-700 bg-orange-100 rounded p-2">
                            💡 Focus on improving prayer consistency. Set reminders to help maintain regular prayers.
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Growth Insights */}
                    {reportData.growth.length > 0 && (
                      <>
                        {getAverage(reportData.summary.growthStats.overall) >= 80 ? (
                          <div className="text-sm text-purple-700 bg-purple-100 rounded p-2">
                            🚀 Outstanding personal growth! You're maintaining excellent habits.
                          </div>
                        ) : getAverage(reportData.summary.growthStats.overall) >= 60 ? (
                          <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                            📈 Good progress on personal development. Keep building these positive habits.
                          </div>
                        ) : (
                          <div className="text-sm text-yellow-700 bg-yellow-100 rounded p-2">
                            🎯 Focus on building consistent daily habits for better personal growth.
                          </div>
                        )}
                      </>
                    )}

                    {/* Tracking Consistency */}
                    {Math.round((reportData.summary.trackedDays / reportData.summary.totalDays) * 100) < 70 && (
                      <div className="text-sm text-gray-700 bg-gray-100 rounded p-2">
                        📊 Try to track your progress more consistently for better insights and motivation.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {reportData.prayers.length === 0 && reportData.growth.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h3>
                  <p className="text-gray-500">
                    No prayer or growth tracking data found for {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {/* Footer content removed as requested */}
        </div>
      </div>
    </div>
  )
}

export default MonthlyReport