import React from 'react';
import { 
  BarChart2, 
  MapPin, 
  Settings, 
  Activity, 
  Route, 
  AlertTriangle, 
  ShieldAlert, 
  Signal, 
  History, 
  Home, 
  Compass, 
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  HeartPulse
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeEmergenciesCount: number;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  activeEmergenciesCount
}: SidebarProps) {
  
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'live-operations', name: 'Live Operations', icon: Activity },
    { id: 'emergency-vehicles', name: 'Emergency Vehicles', icon: ShieldAlert, badge: activeEmergenciesCount },
    { id: 'traffic-network', name: 'Traffic Network', icon: Route },
    { id: 'gis-map', name: 'GIS Map Layers', icon: MapPin },
    { id: 'analytics', name: 'Golden Hour Analytics', icon: BarChart2 },
    { id: 'historical-events', name: 'Historical Events', icon: History },
    { id: 'hospitals', name: 'Hospital Status', icon: HeartPulse },
    { id: 'traffic-signals', name: 'Traffic Signals', icon: Signal },
    { id: 'settings', name: 'Platform Settings', icon: Settings }
  ];

  return (
    <aside 
      className={`bg-[#0F1115] border-r border-[#1F242E] h-screen transition-all duration-300 flex flex-col justify-between select-none relative z-10 flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Platform Branding Header */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-[#1F242E] h-16">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#D9EF92]/10 border border-[#D9EF92]/30">
                <ShieldAlert className="w-4 h-4 text-[#D9EF92] animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D9EF92] animate-ping" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm tracking-tight text-white uppercase">ARKA Corridor AI</span>
                <span className="text-[10px] font-mono text-gray-500 tracking-wider">5G PLATFORM v1.4</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center w-full">
              <div className="w-8 h-8 rounded-lg bg-[#D9EF92]/10 border border-[#D9EF92]/30 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-[#D9EF92]" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 cursor-pointer relative group ${
                  isActive 
                    ? 'bg-[#D9EF92]/10 text-[#D9EF92] font-medium border border-[#D9EF92]/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#D9EF92]' : 'text-gray-400 group-hover:text-white'}`} />
                </div>
                
                {!collapsed && (
                  <span className="text-sm tracking-wide flex-1 truncate transition-opacity duration-300">
                    {item.name}
                  </span>
                )}

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`flex items-center justify-center h-5 w-5 text-[10px] font-bold rounded-full ${
                    collapsed ? 'absolute top-1 right-1' : ''
                  } ${
                    isActive ? 'bg-[#D9EF92] text-black' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Left Indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r bg-[#D9EF92]" />
                )}

                {/* Tooltip for collapsed view */}
                {collapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-[#151922] text-xs text-white rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 border border-[#1F242E] z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Collapse Trigger Footer */}
      <div className="p-3 border-t border-[#1F242E]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-white hover:bg-white/[0.02] border border-dashed border-[#1F242E] rounded-lg transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-mono tracking-widest uppercase">COLLAPSE RAIL</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
