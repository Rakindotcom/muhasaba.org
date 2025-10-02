// Complete Data Migration Utility
// Helps migrate existing localStorage data to Firestore for all app features

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export const migrateAllLocalStorageToFirestore = async (userId) => {
  try {
    let totalMigrated = 0
    const migrationResults = []

    // Migrate Tasks
    const taskResult = await migrateTasksData(userId)
    if (taskResult.migrated) {
      totalMigrated += taskResult.count
      migrationResults.push('Tasks')
    }

    // Migrate Contacts
    const contactResult = await migrateContactsData(userId)
    if (contactResult.migrated) {
      totalMigrated += contactResult.count
      migrationResults.push('Contacts')
    }

    // Migrate Settings
    const settingsResult = await migrateSettingsData(userId)
    if (settingsResult.migrated) {
      migrationResults.push('Settings')
    }

    // Migrate Prayer Data (last 7 days)
    const prayerResult = await migratePrayerData(userId)
    if (prayerResult.migrated) {
      totalMigrated += prayerResult.count
      migrationResults.push('Prayer Data')
    }

    // Migrate Growth Data (last 7 days)
    const growthResult = await migrateGrowthData(userId)
    if (growthResult.migrated) {
      totalMigrated += growthResult.count
      migrationResults.push('Growth Data')
    }

    if (migrationResults.length > 0) {
      return {
        success: true,
        migrated: true,
        message: `Successfully migrated: ${migrationResults.join(', ')}`,
        totalItems: totalMigrated
      }
    } else {
      return {
        success: true,
        migrated: false,
        message: 'No local data found to migrate'
      }
    }

  } catch (error) {
    console.error('Migration error:', error)
    return {
      success: false,
      migrated: false,
      message: 'Failed to migrate data: ' + error.message
    }
  }
}

const migrateTasksData = async (userId) => {
  try {
    const userTasksRef = doc(db, 'userTasks', userId)
    const existingDoc = await getDoc(userTasksRef)
    
    if (existingDoc.exists()) {
      return { migrated: false, count: 0 }
    }

    const localTasks = localStorage.getItem('dailyTasks')
    const localMissedTasks = localStorage.getItem('missedTasks')

    if (!localTasks && !localMissedTasks) {
      return { migrated: false, count: 0 }
    }

    const parsedTasks = localTasks ? JSON.parse(localTasks) : { mustDo: [], goodToDo: [] }
    const parsedMissedTasks = localMissedTasks ? JSON.parse(localMissedTasks) : { mustDo: [], goodToDo: [] }

    const addDateToTasks = (taskObj) => {
      const today = new Date().toISOString().split('T')[0]
      return {
        mustDo: taskObj.mustDo.map(task => ({
          ...task,
          dateCreated: task.dateCreated || today
        })),
        goodToDo: taskObj.goodToDo.map(task => ({
          ...task,
          dateCreated: task.dateCreated || today
        }))
      }
    }

    const tasksWithDates = addDateToTasks(parsedTasks)
    const missedTasksWithDates = addDateToTasks(parsedMissedTasks)

    await setDoc(userTasksRef, {
      todayTasks: tasksWithDates,
      missedTasks: missedTasksWithDates,
      lastUpdated: serverTimestamp(),
      dateUpdated: new Date().toISOString().split('T')[0],
      migratedFrom: 'localStorage',
      migrationDate: serverTimestamp()
    })

    localStorage.removeItem('dailyTasks')
    localStorage.removeItem('missedTasks')

    const count = tasksWithDates.mustDo.length + tasksWithDates.goodToDo.length + 
                  missedTasksWithDates.mustDo.length + missedTasksWithDates.goodToDo.length

    return { migrated: true, count }
  } catch (error) {
    console.error('Task migration error:', error)
    return { migrated: false, count: 0 }
  }
}

const migrateContactsData = async (userId) => {
  try {
    const userContactsRef = doc(db, 'userContacts', userId)
    const existingDoc = await getDoc(userContactsRef)
    
    if (existingDoc.exists()) {
      return { migrated: false, count: 0 }
    }

    const localContacts = localStorage.getItem('urgentContacts')
    if (!localContacts) {
      return { migrated: false, count: 0 }
    }

    const parsedContacts = JSON.parse(localContacts)
    
    await setDoc(userContactsRef, {
      contacts: parsedContacts,
      lastUpdated: serverTimestamp(),
      migratedFrom: 'localStorage',
      migrationDate: serverTimestamp()
    })

    localStorage.removeItem('urgentContacts')

    const count = parsedContacts.message.length + parsedContacts.call.length
    return { migrated: true, count }
  } catch (error) {
    console.error('Contacts migration error:', error)
    return { migrated: false, count: 0 }
  }
}

const migrateSettingsData = async (userId) => {
  try {
    const userSettingsRef = doc(db, 'userSettings', userId)
    const existingDoc = await getDoc(userSettingsRef)
    
    if (existingDoc.exists()) {
      return { migrated: false }
    }

    const localProfile = localStorage.getItem('userProfile')
    const localNotifications = localStorage.getItem('notifications')
    const localUserType = localStorage.getItem('userType')

    if (!localProfile && !localNotifications && !localUserType) {
      return { migrated: false }
    }

    const profile = localProfile ? JSON.parse(localProfile) : {}
    const notifications = localNotifications ? JSON.parse(localNotifications) : { prayer: true, tasks: true, growth: false }

    await setDoc(userSettingsRef, {
      profile,
      notifications,
      lastUpdated: serverTimestamp(),
      migratedFrom: 'localStorage',
      migrationDate: serverTimestamp()
    })

    if (localUserType) {
      const userPrefsRef = doc(db, 'userPreferences', userId)
      await setDoc(userPrefsRef, {
        userType: localUserType,
        lastUpdated: serverTimestamp(),
        migratedFrom: 'localStorage',
        migrationDate: serverTimestamp()
      })
      localStorage.removeItem('userType')
    }

    localStorage.removeItem('userProfile')
    localStorage.removeItem('notifications')

    return { migrated: true }
  } catch (error) {
    console.error('Settings migration error:', error)
    return { migrated: false }
  }
}

const migratePrayerData = async (userId) => {
  try {
    let migratedCount = 0

    // Check last 7 days for prayer data
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      const dateKey = date.toISOString().split('T')[0]

      const localPrayerData = localStorage.getItem(`prayer-${dateStr}`)
      if (localPrayerData) {
        const dailyPrayerRef = doc(db, 'userPrayers', userId, 'dailyPrayers', dateKey)
        const existingDoc = await getDoc(dailyPrayerRef)
        
        if (!existingDoc.exists()) {
          await setDoc(dailyPrayerRef, {
            prayers: JSON.parse(localPrayerData),
            date: dateKey,
            lastUpdated: serverTimestamp(),
            migratedFrom: 'localStorage',
            migrationDate: serverTimestamp()
          })
          migratedCount++
        }
        localStorage.removeItem(`prayer-${dateStr}`)
      }
    }

    // Migrate Qaza data
    const localQaza = localStorage.getItem('qazaPrayers')
    if (localQaza) {
      const qazaRef = doc(db, 'userPrayers', userId)
      const existingDoc = await getDoc(qazaRef)
      
      if (!existingDoc.exists() || !existingDoc.data().qazaData) {
        await setDoc(qazaRef, {
          qazaData: JSON.parse(localQaza),
          lastUpdated: serverTimestamp(),
          migratedFrom: 'localStorage',
          migrationDate: serverTimestamp()
        }, { merge: true })
      }
      localStorage.removeItem('qazaPrayers')
    }

    return { migrated: migratedCount > 0, count: migratedCount }
  } catch (error) {
    console.error('Prayer migration error:', error)
    return { migrated: false, count: 0 }
  }
}

const migrateGrowthData = async (userId) => {
  try {
    let migratedCount = 0

    // Check last 7 days for growth data
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      const dateKey = date.toISOString().split('T')[0]

      const localGrowthData = localStorage.getItem(`growth-${dateStr}`)
      if (localGrowthData) {
        const dailyGrowthRef = doc(db, 'userGrowth', userId, 'dailyGrowth', dateKey)
        const existingDoc = await getDoc(dailyGrowthRef)
        
        if (!existingDoc.exists()) {
          await setDoc(dailyGrowthRef, {
            growthData: JSON.parse(localGrowthData),
            date: dateKey,
            lastUpdated: serverTimestamp(),
            migratedFrom: 'localStorage',
            migrationDate: serverTimestamp()
          })
          migratedCount++
        }
        localStorage.removeItem(`growth-${dateStr}`)
      }
    }

    return { migrated: migratedCount > 0, count: migratedCount }
  } catch (error) {
    console.error('Growth migration error:', error)
    return { migrated: false, count: 0 }
  }
}

export const checkForLocalData = () => {
  const keys = [
    'dailyTasks', 'missedTasks', 'urgentContacts', 'userProfile', 
    'notifications', 'userType', 'qazaPrayers'
  ]
  
  // Check for any localStorage keys
  for (const key of keys) {
    if (localStorage.getItem(key)) {
      return true
    }
  }

  // Check for date-based prayer and growth data (last 7 days)
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toDateString()
    
    if (localStorage.getItem(`prayer-${dateStr}`) || localStorage.getItem(`growth-${dateStr}`)) {
      return true
    }
  }

  return false
}

// Legacy function for backward compatibility
export const migrateLocalStorageToFirestore = migrateAllLocalStorageToFirestore

export default {
  migrateAllLocalStorageToFirestore,
  migrateLocalStorageToFirestore,
  checkForLocalData
}