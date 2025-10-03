// Data Management Utilities for Muhasaba App
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

export const getDateString = (date = new Date()) => {
  return date.toDateString()
}

// Helper function to convert date to YYYY-MM-DD format for Firestore
const getFirestoreDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getMonthlyData = async (year, month, userId) => {
  if (!userId) {
    throw new Error('User ID is required to fetch monthly data')
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthData = {
    prayers: [],
    growth: [],
    tasks: [],
    summary: {
      totalDays: daysInMonth,
      trackedDays: 0,
      prayerStats: { total: 0, jamat: 0, missed: 0 },
      growthStats: { iman: [], life: [], overall: [] },
      taskStats: { mustDo: 0, goodToDo: 0, completed: 0 }
    }
  }

  try {
    // Get user type preference
    let userType = 'student'
    try {
      const userPrefsRef = doc(db, 'userPreferences', userId)
      const prefsDoc = await getDoc(userPrefsRef)
      if (prefsDoc.exists() && prefsDoc.data().userType) {
        userType = prefsDoc.data().userType
      }
    } catch (error) {
      console.warn('Could not fetch user type, using default:', error)
    }

    // Collect data for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const firestoreDateStr = getFirestoreDateString(date)
      const displayDateStr = getDateString(date)
      
      // Collect prayer data from Firestore
      try {
        const dailyPrayerRef = doc(db, 'userPrayers', userId, 'dailyPrayers', firestoreDateStr)
        const prayerDoc = await getDoc(dailyPrayerRef)
        
        if (prayerDoc.exists()) {
          const prayers = prayerDoc.data().prayers
          const dayStats = calculateDayPrayerStats(prayers, day, displayDateStr)
          monthData.prayers.push(dayStats)
          updatePrayerSummary(monthData.summary.prayerStats, dayStats)
        }
      } catch (error) {
        console.warn(`Could not fetch prayer data for ${firestoreDateStr}:`, error)
      }

      // Collect growth data from Firestore
      try {
        const dailyGrowthRef = doc(db, 'userGrowth', userId, 'dailyGrowth', firestoreDateStr)
        const growthDoc = await getDoc(dailyGrowthRef)
        
        if (growthDoc.exists()) {
          const growth = growthDoc.data().growthData
          const dayUserType = growthDoc.data().userType || userType
          const dayStats = calculateDayGrowthStats(growth, dayUserType, day, displayDateStr)
          monthData.growth.push(dayStats)
          updateGrowthSummary(monthData.summary.growthStats, dayStats)
          monthData.summary.trackedDays++
        }
      } catch (error) {
        console.warn(`Could not fetch growth data for ${firestoreDateStr}:`, error)
      }
    }

    return monthData
  } catch (error) {
    console.error('Error fetching monthly data:', error)
    throw error
  }
}

const calculateDayPrayerStats = (prayers, day, dateStr) => {
  const prayedCount = Object.values(prayers).filter(p => p.prayed).length
  const jamatCount = Object.values(prayers).filter(p => p.jamat).length
  const missedCount = 5 - prayedCount

  return {
    date: dateStr,
    day: day,
    prayed: prayedCount,
    jamat: jamatCount,
    missed: missedCount,
    percentage: Math.round((prayedCount / 5) * 100),
    details: prayers
  }
}

const calculateDayGrowthStats = (growth, userType, day, dateStr) => {
  const imanScore = calculateImanScore(growth.iman)
  const lifeScore = calculateLifeScore(growth.life, userType)
  const overallScore = Math.round((imanScore + lifeScore) / 2)

  return {
    date: dateStr,
    day: day,
    iman: imanScore,
    life: lifeScore,
    overall: overallScore,
    details: growth
  }
}

const calculateImanScore = (imanData) => {
  if (!imanData) return 0
  const items = ['istigfar', 'salam', 'miswak', 'quranTouch', 'masnunDua', 'prayerOnTime', 'quranReflect']
  const completed = items.filter(item => imanData[item]).length
  return Math.round((completed / items.length) * 100)
}

const calculateLifeScore = (lifeData, userType) => {
  if (!lifeData) return 0
  const lifeChecklists = {
    student: ['academics', 'career', 'meal', 'attendance', 'gratitude', 'exercise', 'sleep'],
    professional: ['messages', 'meal', 'deepWork', 'help', 'gratitude', 'exercise', 'sleep'],
    homemaker: ['organizing', 'family', 'selfCare', 'learning', 'communication', 'muhasaba', 'exercise']
  }
  const items = lifeChecklists[userType] || lifeChecklists.student
  const completed = items.filter(item => lifeData[item]).length
  return Math.round((completed / items.length) * 100)
}

const updatePrayerSummary = (summary, dayStats) => {
  summary.total += dayStats.prayed
  summary.jamat += dayStats.jamat
  summary.missed += dayStats.missed
}

const updateGrowthSummary = (summary, dayStats) => {
  summary.iman.push(dayStats.iman)
  summary.life.push(dayStats.life)
  summary.overall.push(dayStats.overall)
}

export const getAverage = (arr) => {
  if (arr.length === 0) return 0
  return Math.round(arr.reduce((sum, val) => sum + val, 0) / arr.length)
}

export const exportMonthlyReport = (reportData, month, year) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const reportContent = {
    title: `Muhasaba Monthly Report - ${months[month]} ${year}`,
    generatedAt: new Date().toISOString(),
    period: {
      month: months[month],
      year: year,
      totalDays: reportData.summary.totalDays,
      trackedDays: reportData.summary.trackedDays
    },
    summary: {
      prayerAverage: reportData.prayers.length > 0 ? 
        Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length * 5)) * 100) : 0,
      growthAverage: getAverage(reportData.summary.growthStats.overall),
      imanAverage: getAverage(reportData.summary.growthStats.iman),
      lifeAverage: getAverage(reportData.summary.growthStats.life),
      totalPrayers: reportData.summary.prayerStats.total,
      jamatPrayers: reportData.summary.prayerStats.jamat,
      missedPrayers: reportData.summary.prayerStats.missed
    },
    dailyData: {
      prayers: reportData.prayers,
      growth: reportData.growth
    },
    insights: generateInsights(reportData)
  }

  return reportContent
}

const generateInsights = (reportData) => {
  const insights = []

  // Prayer insights
  if (reportData.prayers.length > 0) {
    const avgPrayerPercentage = Math.round((reportData.summary.prayerStats.total / (reportData.prayers.length * 5)) * 100)
    const jamatPercentage = Math.round((reportData.summary.prayerStats.jamat / reportData.summary.prayerStats.total) * 100)
    
    if (avgPrayerPercentage >= 90) {
      insights.push("Excellent prayer consistency! Keep up the great work.")
    } else if (avgPrayerPercentage >= 70) {
      insights.push("Good prayer habits. Try to improve consistency for even better results.")
    } else {
      insights.push("Focus on improving prayer consistency. Set reminders to help maintain regular prayers.")
    }

    if (jamatPercentage >= 70) {
      insights.push("Great job maintaining Jamat prayers!")
    } else if (jamatPercentage >= 40) {
      insights.push("Try to increase Jamat prayer participation when possible.")
    }
  }

  // Growth insights
  if (reportData.growth.length > 0) {
    const avgGrowth = getAverage(reportData.summary.growthStats.overall)
    const avgIman = getAverage(reportData.summary.growthStats.iman)
    const avgLife = getAverage(reportData.summary.growthStats.life)

    if (avgGrowth >= 80) {
      insights.push("Outstanding personal growth! You're maintaining excellent habits.")
    } else if (avgGrowth >= 60) {
      insights.push("Good progress on personal development. Keep building these positive habits.")
    } else {
      insights.push("Focus on building consistent daily habits for better personal growth.")
    }

    if (avgIman > avgLife) {
      insights.push("Your spiritual practices are strong. Consider balancing with life skills development.")
    } else if (avgLife > avgIman) {
      insights.push("Great life management! Consider strengthening spiritual practices for balance.")
    }
  }

  // Tracking consistency
  const trackingPercentage = Math.round((reportData.summary.trackedDays / reportData.summary.totalDays) * 100)
  if (trackingPercentage < 70) {
    insights.push("Try to track your progress more consistently for better insights and motivation.")
  }

  return insights
}

export default {
  getDateString,
  getMonthlyData,
  getAverage,
  exportMonthlyReport
}