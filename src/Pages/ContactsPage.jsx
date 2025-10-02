import { useState, useEffect } from 'react'
import { Plus, MessageCircle, Phone, Trash2, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
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
      console.error('Error saving contacts to Firestore:', error)
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
      console.error('Error loading contacts from Firestore:', error)
      toast.error('Failed to load contacts. Please refresh the page.')
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

  // Save data to Firestore whenever contacts change
  useEffect(() => {
    if (!loading && user?.uid && (contacts.message.length > 0 || contacts.call.length > 0)) {
      saveContactsToFirestore(contacts)
    }
  }, [contacts, loading, user?.uid])

  // Real-time sync with Firestore
  useEffect(() => {
    if (!user?.uid) return

    const userContactsRef = doc(db, 'userContacts', user.uid)
    const unsubscribe = onSnapshot(userContactsRef, (doc) => {
      if (doc.exists() && doc.data().contacts && !loading) {
        const serverContacts = doc.data().contacts
        if (JSON.stringify(serverContacts) !== JSON.stringify(contacts)) {
          setContacts(serverContacts)
        }
      }
    })

    return () => unsubscribe()
  }, [user?.uid, loading])

  const addContact = async () => {
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
      
      // Save to Firestore
      await saveContactsToFirestore(updatedContacts)
    }
  }

  const deleteContact = async (id, type) => {
    const updatedContacts = {
      ...contacts,
      [type]: contacts[type].filter(contact => contact.id !== id)
    }
    
    setContacts(updatedContacts)
    await saveContactsToFirestore(updatedContacts)
  }

  const ContactSection = ({ title, contacts, type, icon: Icon, bgColor }) => (
    <div className={`${bgColor} rounded-xl p-4 md:p-6 mb-4 lg:mb-0`}>
      <div className="flex items-center gap-2 mb-6">
        <Icon size={24} className="text-gray-700" />
        <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
        <span className="text-sm text-gray-600 bg-white/60 px-2 py-1 rounded-full">
          {contacts.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">No contacts added yet</p>
          </div>
        ) : (
          contacts.map(contact => (
            <div key={contact.id} className="flex items-center gap-3 bg-white/70 rounded-lg p-3 md:p-4 hover:bg-white/90 transition-colors">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={18} className="text-gray-600" />
              </div>
              
              <span className="flex-1 text-sm md:text-base text-gray-800">
                {contact.name}
              </span>
              
              <button
                onClick={() => deleteContact(contact.id, type)}
                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Urgent Contacts</h1>
        <p className="text-gray-600 text-sm md:text-base">Quick access to important people</p>
        {syncing && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
            <span>Syncing...</span>
          </div>
        )}
      </div>

      {/* Section Selector */}
      <div className="bg-white rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={() => setActiveSection('message')}
            className={`flex-1 py-3 rounded-lg text-sm md:text-base font-medium transition-all ${
              activeSection === 'message' 
                ? 'bg-green-100 text-green-700 scale-105' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageCircle size={20} className="inline mr-2" />
            Message Contacts
          </button>
          <button
            onClick={() => setActiveSection('call')}
            className={`flex-1 py-3 rounded-lg text-sm md:text-base font-medium transition-all ${
              activeSection === 'call' 
                ? 'bg-blue-100 text-blue-700 scale-105' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Phone size={20} className="inline mr-2" />
            Call Contacts
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 mt-4">
          <input
            type="text"
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            placeholder={`Add ${activeSection === 'message' ? 'message' : 'call'} contact...`}
            className={`flex-1 px-4 py-3 border-2 bg-white rounded-lg focus:outline-none text-sm md:text-base transition-all ${
              activeSection === 'message' 
                ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-green-700 placeholder-green-400' 
                : 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-blue-700 placeholder-blue-400'
            }`}
            onKeyDown={(e) => e.key === 'Enter' && addContact()}
          />
          <button
            onClick={addContact}
            className={`text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeSection === 'message' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            <Plus size={20} />
            <span className="hidden md:inline">Add Contact</span>
          </button>
        </div>
      </div>

      {/* Contact Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContactSection
          title="Person that needs to be messaged"
          contacts={contacts.message}
          type="message"
          icon={MessageCircle}
          bgColor="bg-green-50"
        />
        
        <ContactSection
          title="Person that needs to be called"
          contacts={contacts.call}
          type="call"
          icon={Phone}
          bgColor="bg-blue-50"
        />
      </div>
    </div>
  )
}

export default ContactsPage