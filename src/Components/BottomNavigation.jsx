import { CheckSquare, Play, TrendingUp, Users, Settings } from "lucide-react"

const navigationItems = [
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "player", label: "Prayer", icon: Play },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
]

export default function BottomNavigation({ activeTab, setActiveTab }) {

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white to-transparent pt-4">
      <div className="max-w-md mx-auto">
        <nav className="bg-gray-900 px-2 py-3">
          <div className="flex items-center justify-between">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const isCenter = index === 2 // Growth is the center item

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    relative flex flex-col items-center justify-center transition-all duration-200 ease-out
                    ${isCenter ? "px-4 py-2" : "px-3 py-2"}
                    ${
                      isActive
                        ? isCenter
                          ? "bg-white text-gray-900 rounded-xl scale-105 shadow-lg"
                          : "text-white scale-105"
                        : "text-gray-400 hover:text-gray-200"
                    }
                  `}
                >
                  <Icon
                    size={isCenter ? 24 : 20}
                    className={`
                      transition-all duration-200
                      ${isActive && !isCenter ? "drop-shadow-sm" : ""}
                    `}
                  />
                  <span
                    className={`
                      text-xs font-medium mt-1 transition-all duration-200
                      ${isCenter ? "text-xs" : "text-[10px]"}
                      ${isActive ? "opacity-100" : "opacity-70"}
                    `}
                  >
                    {item.label}
                  </span>

                  {/* Active indicator dot for non-center items */}
                  {isActive && !isCenter && <div className="absolute -top-1 w-1 h-1 bg-white rounded-full" />}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
