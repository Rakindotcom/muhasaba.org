import { useState, useEffect } from 'react'
import { Plus, Check, X, Star, Clock, Calendar } from 'lucide-react'
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { user } = useAuth()
  const { trackAction } = useTimeTracking('todo_page')

  // Helper function to get today's date string
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  }

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
      setHasUnsavedChanges(false)
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
      toast.error('Failed to load tasks. Please refresh the page.')
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

  // Save data when navigating away from page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges && user?.uid) {
        saveTasksToFirestore()
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges && user?.uid) {
        saveTasksToFirestore()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // Save on component unmount (navigation away)
      if (hasUnsavedChanges && user?.uid) {
        saveTasksToFirestore()
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, user?.uid])

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
        setHasUnsavedChanges(true)

        trackAction('task_added', {
          section: activeSection,
          taskText: newTask,
          taskId: task.id
        })

        setNewTask('')
        setShowAddModal(false)
      } else {
        toast.error('You can only add new tasks to today\'s list')
      }
    } else {
      toast.error('Please enter a task description')
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
    setHasUnsavedChanges(true)
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
    setHasUnsavedChanges(true)
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
    setHasUnsavedChanges(true)
    
    toast.success('Task moved to today\'s list')
  }

  const TaskSection = ({ title, tasks, section, icon: Icon, bgColor, isMissed = false }) => (
    <div className={`${bgColor} rounded-xl p-4 md:p-6 mb-4 lg:mb-0`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className="text-gray-700" />
        <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
        <span className="text-sm text-gray-600 bg-white/60 px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">{isMissed ? 'No missed tasks' : 'No tasks added yet'}</p>
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
                {task.completed && <Check size={14} />}
              </button>

              <div className="flex-1">
                <span className={`text-sm md:text-base transition-all block ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                  }`}>
                  {task.text}
                </span>
                {isMissed && task.dateCreated && (
                  <span className="text-xs text-gray-500 mt-1 block">
                    Created: {new Date(task.dateCreated).toLocaleDateString('en-US', {
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
                    className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Move to today"
                  >
                    <Calendar size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteTask(task.id, section, isMissed)}
                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={16} />
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
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Daily Tasks</h1>
        <div className="flex flex-col items-center gap-1">
          <p className="text-gray-600 text-sm md:text-base">Beginning of the Day Planning</p>
          <p className="text-blue-600 font-medium text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'today'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Today's Tasks
          </button>
          <button
            onClick={() => setActiveTab('missed')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${activeTab === 'missed'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Missed Tasks
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
          className="fixed bottom-33 md:bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSection('mustDo')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'mustDo'
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                  >
                    Must Do
                  </button>
                  <button
                    onClick={() => setActiveSection('goodToDo')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === 'goodToDo'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                  >
                    Good to Do
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Description</label>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder={`Enter ${activeSection === 'mustDo' ? 'important' : 'optional'} task...`}
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
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Task
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
              title="Most Important Tasks - Must Do"
              tasks={tasks.mustDo}
              section="mustDo"
              icon={Star}
              bgColor="bg-red-50"
              isMissed={false}
            />

            <TaskSection
              title="Other Tasks - Good to Do"
              tasks={tasks.goodToDo}
              section="goodToDo"
              icon={Check}
              bgColor="bg-blue-50"
              isMissed={false}
            />
          </>
        ) : (
          <>
            <TaskSection
              title="Missed Important Tasks"
              tasks={missedTasks.mustDo}
              section="mustDo"
              icon={Clock}
              bgColor="bg-orange-50"
              isMissed={true}
            />

            <TaskSection
              title="Missed Other Tasks"
              tasks={missedTasks.goodToDo}
              section="goodToDo"
              icon={Clock}
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