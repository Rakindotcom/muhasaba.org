import { useState, useEffect } from 'react'
import { MessageCircle, Phone, Trash2, User, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

const ContactsPage = () => {
  const [contacts, setContacts] = useState({
    message: [],
    call: []
  })
  const [newContact, setNewContact] = useState('')
  const [activeSection, setActiveSection] = useState('message')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const { user } = useAuth()

  // Save contacts to Firestore
  const saveContactsToFirestore = async (contactsData) => {
    if (!user?.uid) return

    try {
      setSyncing(true)
      const userContactsRef = doc(db, 'userContacts', user.uid)
      await setDoc(userContactsRef, {
        contacts: contactsData,
        lastUpdated: serverTimestamp()
      })
    } catch (error) {
      // Silent error handling
    } finally {
      setSyncing(false)
    }
  }

  // Load contacts from Firestore
  const loadContactsFromFirestore = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    try {
      const userContactsRef = doc(db, 'userContacts', user.uid)
      const docSnap = await getDoc(userContactsRef)

      if (docSnap.exists() && docSnap.data().contacts) {
        setContacts(docSnap.data().contacts)
      }
    } catch (error) {
      toast.error('যোগাযোগ লোড করতে ব্যর্থ। দয়া করে পেজ রিফ্রেশ করুন।')
    } finally {
      setLoading(false)
    }
  }

  // Load data when user changes or component mounts
  useEffect(() => {
    if (user?.uid) {
      loadContactsFromFirestore()
    } else {
      setLoading(false)
    }
  }, [user?.uid])

  // Auto-save when contacts data changes
  useEffect(() => {
    if (!loading && user?.uid) {
      saveContactsToFirestore(contacts)
    }
  }, [contacts, user?.uid, loading])

  const addContact = () => {
    if (newContact.trim()) {
      const contact = {
        id: Date.now(),
        name: newContact.trim(),
        createdAt: new Date().toISOString()
      }

      const updatedContacts = {
        ...contacts,
        [activeSection]: [...contacts[activeSection], contact]
      }

      setContacts(updatedContacts)
      setNewContact('')
      setShowAddModal(false)
    }
  }

  const deleteContact = (id, type) => {
    const updatedContacts = {
      ...contacts,
      [type]: contacts[type].filter(contact => contact.id !== id)
    }

    setContacts(updatedContacts)
  }



  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">আপনার যোগাযোগ লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">জরুরি যোগাযোগ</h1>
        <div className="flex flex-col items-center gap-1">
          <p className="text-gray-600 text-lg">যাদের সাথে যোগাযোগ করতে হবে</p>
          {syncing && (
            <div className="flex items-center justify-center gap-2 text-lg text-gray-500 mt-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
              <span>সিঙ্ক হচ্ছে...</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setActiveSection('message')}
            className={`px-6 py-2 rounded-md text-lg font-medium transition-colors ${activeSection === 'message'
                ? 'bg-white text-green-600 shadow-sm border-2 border-black'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            মেসেজ দিলেও হবে
          </button>
          <button
            onClick={() => setActiveSection('call')}
            className={`px-6 py-2 rounded-md text-lg font-medium transition-colors ${activeSection === 'call'
                ? 'bg-white text-blue-600 shadow-sm border-2 border-black'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            কল করতে হবে
          </button>
        </div>
      </div>



      {/* Contact List */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="font-semibold text-gray-800 text-2xl">
            {activeSection === 'message' ? 'যাদের মেসেজ দিলেও হবে' : 'যাদের কল করতে হবে'}
          </h3>
          <span className="text-2xl text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            {contacts[activeSection].length}
          </span>
        </div>

        <div className="space-y-3">
          {contacts[activeSection].length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {activeSection === 'message' ? (
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              ) : (
                <Phone size={48} className="mx-auto mb-4 opacity-50" />
              )}
              <p className="text-lg">এখনো কোন যোগাযোগ যোগ করা হয়নি</p>
            </div>
          ) : (
            contacts[activeSection].map(contact => (
              <div key={contact.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 md:p-4 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={18} className="text-gray-600" />
                </div>

                <span className="flex-1 text-lg text-gray-800">
                  {contact.name}
                </span>

                <button
                  onClick={() => deleteContact(contact.id, activeSection)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-33 md:bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 text-2xl font-bold"
      >
        +
      </button>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">নতুন যোগাযোগ যোগ করুন</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">ক্যাটেগরি</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSection('message')}
                    className={`flex-1 px-4 py-2 rounded-lg text-lg font-medium transition-colors ${activeSection === 'message'
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                  >
                    মেসেজ যোগাযোগ
                  </button>
                  <button
                    onClick={() => setActiveSection('call')}
                    className={`flex-1 px-4 py-2 rounded-lg text-lg font-medium transition-colors ${activeSection === 'call'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                      }`}
                  >
                    কল যোগাযোগ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">যোগাযোগের নাম</label>
                <input
                  type="text"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder={`${activeSection === 'message' ? 'মেসেজ' : 'কল'} যোগাযোগের নাম লিখুন...`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && addContact()}
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
                  onClick={addContact}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  যোগাযোগ যোগ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactsPage