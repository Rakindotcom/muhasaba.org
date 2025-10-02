import { CheckSquare, Play, TrendingUp, Users, Settings, Moon } from "lucide-react"

const navigationItems = [
  { id: "tasks", label: "Todo List", icon: CheckSquare, description: "Daily task management" },
  { id: "player", label: "Prayer Tracker", icon: Play, description: "Track your daily prayers" },
  { id: "growth", label: "Growth Score", icon: TrendingUp, description: "Iman & Life development" },
  { id: "contacts", label: "Urgent Contacts", icon: Users, description: "Quick access contacts" },
  { id: "settings", label: "Settings", icon: Settings, description: "App preferences" },
]

export default function SideNavigation({ activeTab, setActiveTab }) {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r-4 border-gray-700 z-50">
      <div className="p-6">
        {/* Logo/Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/logo.png"
              alt="Muhasaba Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // Fallback to Moon icon if logo fails to load
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'inline-block';
              }}
            />
            <Moon className="text-green-600 hidden" size={28} />
            <h1 className="text-2xl font-bold text-gray-800">
              Muhasaba
            </h1>
          </div>
          <p className="text-sm text-gray-600">Islamic Lifestyle Tracker</p>
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
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="text-xs text-gray-500 text-center">
            <p>v1.0.0</p>
            <p className="mt-1">Built with ❤️ for Muslims</p>
          </div>
        </div>
      </div>
    </div>
  )
}