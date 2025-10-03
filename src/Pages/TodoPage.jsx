import { useState, useEffect } from 'react'
import { FileText, Clock } from 'lucide-react'
import { useTimeTracking } from '../hooks/useTimeTracking'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { migrateAllLocalStorageToFirestore, checkForLocalData } from '../utils/taskMigration'

const TodoPage = () => {
  // Helper function to get today's date string
  const getTodayDateString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [tasks, setTasks] = useState({
    mustDo: [],
    goodToDo: []
  })
  const [missedTasks, setMissedTasks] = useState({
    mustDo: [],
    goodToDo: []
  })
  const [newTask, setNewTask] = useState('')
  const [activeSection, setActiveSection] = useState('mustDo')
  const [activeTab, setActiveTab] = useState('today') // 'today' or 'missed'
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(getTodayDateString())
  const { user } = useAuth()
  const { trackAction } = useTimeTracking('todo_page')

  // Helper function to check if a task is from today
  const isTaskFromToday = (task) => {
    if (!task.dateCreated) return true // Legacy tasks without date are considered today's
    return task.dateCreated === getTodayDateString()
  }

  // Helper function to move old tasks to missed
  const moveOldTasksToMissed = (currentTasks, currentMissed) => {
    const todayTasks = { mustDo: [], goodToDo: [] }
    const newMissedTasks = { ...currentMissed }

    // Process mustDo tasks
    currentTasks.mustDo.forEach(task => {
      if (isTaskFromToday(task)) {
        todayTasks.mustDo.push(task)
      } else if (!task.completed) {
        // Only move incomplete tasks to missed
        newMissedTasks.mustDo.push(task)
      }
    })

    // Process goodToDo tasks
    currentTasks.goodToDo.forEach(task => {
      if (isTaskFromToday(task)) {
        todayTasks.goodToDo.push(task)
      } else if (!task.completed) {
        // Only move incomplete tasks to missed
        newMissedTasks.goodToDo.push(task)
      }
    })

    return { todayTasks, newMissedTasks }
  }

  // Save tasks to Firestore
  const saveTasksToFirestore = async (todayTasks = tasks, missedTasksData = missedTasks) => {
    if (!user?.uid) return

    try {
      const userTasksRef = doc(db, 'userTasks', user.uid)
      await setDoc(userTasksRef, {
        todayTasks,
        missedTasks: missedTasksData,
        lastUpdated: serverTimestamp(),
        dateUpdated: getTodayDateString()
      })

    } catch (error) {
      console.error('Error saving tasks to Firestore:', error)
    }
  }

  // Load tasks from Firestore
  const loadTasksFromFirestore = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    try {
      // Check if user has local data that needs migration
      if (checkForLocalData()) {
        await migrateAllLocalStorageToFirestore(user.uid)
      }

      const userTasksRef = doc(db, 'userTasks', user.uid)
      const docSnap = await getDoc(userTasksRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        const loadedTasks = data.todayTasks || { mustDo: [], goodToDo: [] }
        const loadedMissedTasks = data.missedTasks || { mustDo: [], goodToDo: [] }

        // Check and move old tasks to missed
        const { todayTasks, newMissedTasks } = moveOldTasksToMissed(loadedTasks, loadedMissedTasks)

        setTasks(todayTasks)
        setMissedTasks(newMissedTasks)

        // If tasks were moved, save the updated state
        if (JSON.stringify(todayTasks) !== JSON.stringify(loadedTasks) ||
          JSON.stringify(newMissedTasks) !== JSON.stringify(loadedMissedTasks)) {
          await saveTasksToFirestore(todayTasks, newMissedTasks)
        }
      } else {
        // No existing data, initialize empty
        setTasks({ mustDo: [], goodToDo: [] })
        setMissedTasks({ mustDo: [], goodToDo: [] })
      }

    } catch (error) {
      console.error('Error loading tasks from Firestore:', error)
      toast.error('কাজগুলো লোড করতে ব্যর্থ। দয়া করে পেজ রিফ্রেশ করুন।')
    } finally {
      setLoading(false)
    }
  }

  // Load tasks when user changes or component mounts
  useEffect(() => {
    if (user?.uid) {
      loadTasksFromFirestore()
    } else {
      setLoading(false)
    }
  }, [user?.uid])

  // Auto-save when tasks change
  useEffect(() => {
    if (!loading && user?.uid) {
      saveTasksToFirestore()
    }
  }, [tasks, missedTasks, user?.uid, loading])

  // Check for date change and reload tasks for new day
  useEffect(() => {
    const checkDateChange = async () => {
      const today = getTodayDateString()
      if (today !== currentDate && !loading) {
        // Date has changed, reload tasks for the new day
        setCurrentDate(today)
        if (user?.uid) {
          await loadTasksFromFirestore()
        }
      }
    }

    // Check every minute for date change
    const interval = setInterval(checkDateChange, 60000)
    
    return () => clearInterval(interval)
  }, [currentDate, loading, user?.uid])

  // Force refresh when component becomes visible (handles browser tab switching)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user?.uid) {
        const today = getTodayDateString()
        if (today !== currentDate) {
          setCurrentDate(today)
          await loadTasksFromFirestore()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [currentDate, user?.uid])

  const addTask = async () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        createdAt: new Date().toISOString(),
        dateCreated: getTodayDateString() // Add date for tracking
      }

      // Only allow adding tasks to today's tasks
      if (activeTab === 'today') {
        const updatedTasks = {
          ...tasks,
          [activeSection]: [...tasks[activeSection], task]
        }

        setTasks(updatedTasks)

        trackAction('task_added', {
          section: activeSection,
          taskText: newTask,
          taskId: task.id
        })

        setNewTask('')
        setShowAddModal(false)
      } else {
        toast.error('আপনি শুধুমাত্র আজকের তালিকায় নতুন কাজ যোগ করতে পারেন')
      }
    } else {
      toast.error('দয়া করে কাজের বিবরণ লিখুন')
    }
  }

  const toggleTask = (id, section, isMissed = false) => {
    if (isMissed) {
      const updatedMissedTasks = {
        ...missedTasks,
        [section]: missedTasks[section].map(task =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      }
      setMissedTasks(updatedMissedTasks)
    } else {
      const updatedTasks = {
        ...tasks,
        [section]: tasks[section].map(task =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      }
      setTasks(updatedTasks)
    }
  }

  const deleteTask = (id, section, isMissed = false) => {
    if (isMissed) {
      const updatedMissedTasks = {
        ...missedTasks,
        [section]: missedTasks[section].filter(task => task.id !== id)
      }
      setMissedTasks(updatedMissedTasks)
    } else {
      const updatedTasks = {
        ...tasks,
        [section]: tasks[section].filter(task => task.id !== id)
      }
      setTasks(updatedTasks)
    }
  }

  const moveTaskToToday = (task, section) => {
    // Remove from missed tasks
    const updatedMissedTasks = {
      ...missedTasks,
      [section]: missedTasks[section].filter(t => t.id !== task.id)
    }

    // Add to today's tasks with updated date
    const updatedTask = {
      ...task,
      dateCreated: getTodayDateString(),
      completed: false // Reset completion status
    }

    const updatedTasks = {
      ...tasks,
      [section]: [...tasks[section], updatedTask]
    }

    setMissedTasks(updatedMissedTasks)
    setTasks(updatedTasks)

    toast.success('কাজটি আজকের তালিকায় স্থানান্তরিত হয়েছে')
  }

  const TaskSection = ({ title, tasks, section, bgColor, isMissed = false }) => (
    <div className={`${bgColor} rounded-xl p-4 md:p-6 mb-4 lg:mb-0`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
        <span className="text-sm text-gray-600 bg-white/60 px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isMissed ? (
              <>
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">কোন মিসড কাজ নেই</p>
              </>
            ) : (
              <>
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">এখনো কোন কাজ যোগ করা হয়নি</p>
              </>
            )}
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 bg-white/70 rounded-lg p-3 md:p-4 hover:bg-white/90 transition-colors">
              <button
                onClick={() => toggleTask(task.id, section, isMissed)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed
                  ? 'bg-green-500 border-green-500 text-white scale-110'
                  : 'border-gray-300 hover:border-green-400 hover:scale-105'
                  }`}
              >
                {task.completed && '✓'}
              </button>

              <div className="flex-1">
                <span className={`text-sm md:text-base transition-all block ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                  }`}>
                  {task.text}
                </span>
                {isMissed && task.dateCreated && (
                  <span className="text-xs text-gray-500 mt-1 block">
                    তৈরি: {new Date(task.dateCreated).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isMissed && (
                  <button
                    onClick={() => moveTaskToToday(task, section)}
                    className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                    title="আজকে নিয়ে যান"
                  >
                    আজকে
                  </button>
                )}
                <button
                  onClick={() => deleteTask(task.id, section, isMissed)}
                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">আপনার কাজগুলো লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">দৈনিক কাজসমূহ</h1>
        <div className="flex flex-col items-center gap-1">
          <p className="text-gray-600 text-sm md:text-base">দিনের শুরুর পরিকল্পনা</p>
          <p className="text-blue-600 font-medium text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>

        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'today'
              ? 'bg-white text-blue-600 shadow-sm border-2 border-black'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            আজকের কাজ
          </button>
          <button
            onClick={() => setActiveTab('missed')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${activeTab === 'missed'
              ? 'bg-white text-orange-600 shadow-sm border-2 border-black'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            মিসড কাজ
            {(missedTasks.mustDo.length + missedTasks.goodToDo.length) > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {missedTasks.mustDo.length + missedTasks.goodToDo.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Add Button - Only show for today's tasks */}
      {activeTab === 'today' && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-33 md:bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 text-2xl font-bold"
        >
          +
        </button>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">নতুন কাজ যোগ করুন</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ক্যাটেগরি</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSection('mustDo')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'mustDo'
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                  >
                    অবশ্যই করতে হবে
                  </button>
                  <button
                    onClick={() => setActiveSection('goodToDo')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'goodToDo'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                  >
                    করলে ভালো হয়
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">কাজের বিবরণ</label>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder={`${activeSection === 'mustDo' ? 'গুরুত্বপূর্ণ' : 'ঐচ্ছিক'} কাজ লিখুন...`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={addTask}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  কাজ যোগ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Lists - Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'today' ? (
          <>
            <TaskSection
              title="সবচেয়ে গুরুত্বপূর্ণ কাজ - অবশ্যই করতে হবে"
              tasks={tasks.mustDo}
              section="mustDo"
              bgColor="bg-red-50"
              isMissed={false}
            />

            <TaskSection
              title="অন্যান্য কাজ - করলে ভালো হয়"
              tasks={tasks.goodToDo}
              section="goodToDo"
              bgColor="bg-blue-50"
              isMissed={false}
            />
          </>
        ) : (
          <>
            <TaskSection
              title="মিসড গুরুত্বপূর্ণ কাজ"
              tasks={missedTasks.mustDo}
              section="mustDo"
              bgColor="bg-orange-50"
              isMissed={true}
            />

            <TaskSection
              title="মিসড অন্যান্য কাজ"
              tasks={missedTasks.goodToDo}
              section="goodToDo"
              bgColor="bg-yellow-50"
              isMissed={true}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default TodoPage