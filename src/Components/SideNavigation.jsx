import { CheckSquare, Play, TrendingUp, Users, Settings, Moon } from "lucide-react"

const navigationItems = [
  { id: "tasks", label: "কাজের তালিকা", icon: CheckSquare, description: "দৈনিক কাজ পরিচালনা" },
  { id: "player", label: "নামাজ ট্র্যাকার", icon: Play, description: "আপনার দৈনিক নামাজ ট্র্যাক করুন" },
  { id: "growth", label: "গ্রোথ স্কোর", icon: TrendingUp, description: "ইমান ও জীবনের উন্নয়ন" },
  { id: "contacts", label: "জরুরি যোগাযোগ", icon: Users, description: "দ্রুত যোগাযোগের তালিকা" },
  { id: "settings", label: "সেটিংস", icon: Settings, description: "অ্যাপের পছন্দসমূহ" },
]

export default function SideNavigation({ activeTab, setActiveTab }) {
  return (
    <div className="navbar fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r-4 border-gray-700 z-50">
      <div className="p-6">
        {/* Logo/Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/logo.png"
              alt="মুহাসাবা লোগো"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback to Moon icon if logo fails to load
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'inline-block';
              }}
            />
            <Moon className="text-green-600 hidden" size={28} />
            <h1 className="text-4xl font-bold text-gray-800">
              মুহাসাবা
            </h1>
          </div>
          <p className="text-[17px] text-gray-600">প্রোডাক্টিভ মুসলিম হ্যাবিট ট্র্যাকার</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }
                `}
              >
                <Icon size={20} />
                <div className="text-left flex-1">
                  <div className="font-medium text-[19px]">{item.label}</div>
                  <div className="opacity-75">{item.description}</div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}