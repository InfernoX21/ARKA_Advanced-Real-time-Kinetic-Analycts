import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  User, 
  Wifi, 
  Radio, 
  Flame, 
  Clock, 
  CloudSun, 
  Thermometer, 
  MapPin, 
  ShieldAlert,
  ServerCrash
} from 'lucide-react';
import { LogEvent } from '../types';

interface TopBarProps {
  activeEmergenciesCount: number;
  ambulancesOnline: number;
  averageDensity: number;
  responseScore: number;
  onSearchChange: (query: string) => void;
  triggerGlobalEmergency: () => void;
  recentLogs: LogEvent[];
  clearNotifications?: () => void;
}

export default function TopBar({
  activeEmergenciesCount,
  ambulancesOnline,
  averageDensity,
  responseScore,
  onSearchChange,
  triggerGlobalEmergency,
  recentLogs,
  clearNotifications
}: TopBarProps) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchCommit = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <header className="bg-[#0A0C10] border-b border-[#1F242E] h-16 w-full flex items-center justify-between px-6 z-10 select-none relative">
      
      {/* City Logo & Local Clock Area */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <MapPin className="text-[#D9EF92] w-4.5 h-4.5" />
          <div className="flex flex-col">
            <span className="font-sans font-semibold text-xs tracking-tight text-white uppercase">NEO-METROPOLIS</span>
            <span className="text-[10px] font-mono text-[#D9EF92] tracking-wider uppercase">CORE SECTOR METRO-4</span>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-[#1F242E]" />

        {/* Live Digital Clock */}
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-gray-500" />
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-sm font-bold text-white tracking-widest">{timeStr}</span>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{dateStr}</span>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-[#1F242E]" />

        {/* Network & 5G Status */}
        <div className="hidden lg:flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-mono text-gray-400">10Gbps Core Node</span>
          </div>
          
          <div className="flex items-center gap-2 bg-[#D9EF92]/5 border border-[#D9EF92]/20 px-2 py-0.5 rounded">
            <Radio className="w-3 h-3 text-[#D9EF92]" />
            <span className="text-[10px] font-mono text-[#D9EF92] font-semibold">5G SLICING: ACTIVE (4ms)</span>
          </div>
        </div>
      </div>

      {/* Mid Section Quick Telemetry stats (Hidden on medium screens) */}
      <div className="hidden xl:flex items-center gap-6">
        {/* Active Emergency stat */}
        <div className="flex flex-col items-center px-3 border-r border-[#1F242E]/50">
          <span className="text-[10px] font-mono text-gray-500 uppercase">ACTIVE EMERGENCIES</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activeEmergenciesCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-mono text-xs font-semibold text-white">{activeEmergenciesCount}</span>
          </div>
        </div>

        {/* Ambulances online */}
        <div className="flex flex-col items-center px-3 border-r border-[#1F242E]/50">
          <span className="text-[10px] font-mono text-gray-500 uppercase">EMS MOBILE NODES</span>
          <span className="font-mono text-xs font-semibold text-white mt-0.5">{ambulancesOnline} Online</span>
        </div>

        {/* Average Traffic Density */}
        <div className="flex flex-col items-center px-3 border-r border-[#1F242E]/50">
          <span className="text-[10px] font-mono text-gray-500 uppercase">AVG NETWORK DENSITY</span>
          <span className="font-mono text-xs font-semibold text-white mt-0.5">{averageDensity}%</span>
        </div>

        {/* Response Index */}
        <div className="flex flex-col items-center px-3">
          <span className="text-[10px] font-mono text-gray-500 uppercase">CORE RESPONSE INDEX</span>
          <span className="font-mono text-xs font-semibold text-[#D9EF92] mt-0.5">{responseScore}%</span>
        </div>
      </div>

      {/* Search Bar & Operator Controls */}
      <div className="flex items-center gap-4">
        
        {/* Search Bar */}
        <div className="relative w-48 xl:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search signals, drivers, roads..."
            value={searchQuery}
            onChange={handleSearchCommit}
            className="w-full h-8.5 bg-[#141822] border border-[#232A39] text-xs text-white pl-9 pr-3 rounded-lg focus:outline-none focus:border-[#D9EF92]/50 placeholder-gray-500 focus:ring-1 focus:ring-[#D9EF92]/20"
          />
        </div>

        {/* Quick Simulated Incident Alert trigger */}
        <button
          onClick={triggerGlobalEmergency}
          className="relative px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs rounded-lg flex items-center gap-1.5 font-semibold cursor-pointer border border-red-500/20 shadow-md shadow-red-950/40 active:scale-95 transition-all"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>TRG DISPATCH</span>
        </button>

        {/* Notification Bell with Trigger Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.02] border border-[#1F242E] rounded-lg transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {recentLogs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#0A0C10] animate-pulse" />
            )}
          </button>

          {/* Dialog Notification Dropdown overlay */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 bg-[#10141D] border border-[#1F242E] rounded-xl shadow-2xl z-50 p-4">
              <div className="flex items-center justify-between border-b border-[#1F242E]/70 pb-2 mb-2">
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-sans">Dispatcher Log Events</span>
                <span className="text-[10px] font-mono text-[#D9EF92]">{recentLogs.length} Records</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {recentLogs.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No new incidents logged.</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="text-[11px] border-b border-[#1F242E]/40 pb-1.5">
                      <div className="flex justify-between text-[9px] font-mono text-gray-500">
                        <span>{log.timestamp}</span>
                        <span className="text-[#D9EF92] uppercase">{log.type}</span>
                      </div>
                      <p className="text-gray-300 tracking-wide mt-0.5">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
              {recentLogs.length > 0 && (
                <button
                  onClick={() => {
                    if (clearNotifications) clearNotifications();
                    setShowNotificationDropdown(false);
                  }}
                  className="w-full mt-3 py-1 bg-white/[0.02] hover:bg-[#D9EF92]/10 hover:text-[#D9EF92] border border-[#1F242E] text-[10px] font-mono text-gray-400 rounded transition-colors text-center cursor-pointer"
                >
                  Clear Command Logs
                </button>
              )}
            </div>
          )}
        </div>

        {/* Operator Profile */}
        <div className="hidden xs:flex items-center gap-2 px-2.5 py-1.5 bg-[#141822] border border-[#232A39] rounded-lg">
          <div className="w-5.5 h-5.5 rounded bg-gradient-to-tr from-[#D9EF92] to-[#B2C66A] flex items-center justify-center text-[#0F1115]">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold text-white tracking-wide">ayush10.pradhan</span>
            <span className="text-[9px] font-mono text-gray-500 leading-none">SYS LEVEL-4 OPS</span>
          </div>
        </div>

      </div>

    </header>
  );
}
