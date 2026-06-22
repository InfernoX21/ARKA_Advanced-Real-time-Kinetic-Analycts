import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Clock, 
  CheckCircle, 
  Heart, 
  Zap, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Navigation,
  Sparkles,
  Info
} from 'lucide-react';
import { Junction, RoadSegment, Hospital, Ambulance, LogEvent } from '../types';
import GisMap from './GisMap';

interface OverviewTabProps {
  junctions: Junction[];
  roads: RoadSegment[];
  hospitals: Hospital[];
  ambulances: Ambulance[];
  logs: LogEvent[];
  activeJunctionId: string | null;
  onSelectJunction: (id: string | null) => void;
  activeAmbulanceId: string | null;
  onSelectAmbulance: (id: string | null) => void;
  layers: any;
  setLayers: any;
}

export default function OverviewTab({
  junctions,
  roads,
  hospitals,
  ambulances,
  logs,
  activeJunctionId,
  onSelectJunction,
  activeAmbulanceId,
  onSelectAmbulance,
  layers,
  setLayers
}: OverviewTabProps) {

  // Live real-time emergency incidents feed simulator
  const [incidents, setIncidents] = useState([
    { id: 'INC-901', type: 'AMI Heart Attack', location: 'Infocity IT Corridor, Patia', time: '11:42', priority: 'CRITICAL', status: 'Active' },
    { id: 'INC-882', type: 'Trauma Accident', location: 'NH-16 Jaydev Vihar Flyover', time: '11:28', priority: 'HIGH', status: 'Active' },
    { id: 'INC-731', type: 'Respiratory Failure', location: 'Rajmahal Square, Unit-6', time: '10:55', priority: 'MODERATE', status: 'Completed' },
    { id: 'INC-654', type: 'Stroke Emergency', location: 'Sainik School Road, Gajapati Nagar', time: '10:14', priority: 'HIGH', status: 'Completed' }
  ]);

  // Periodic simulated real-time incidents trigger
  useEffect(() => {
    const handle = setInterval(() => {
      const locations = [
        'Khandagiri Intersection',
        'Acharya Vihar Overpass',
        'Patia Square Ring',
        'Vani Vihar Crossing',
        'Kiit Bypass Road'
      ];
      const types = [
        'Severe Road Collision',
        'Cardiovascular Arrest',
        'Pediatric Crisis',
        'Anaphylaxis Response'
      ];
      const priorities = ['CRITICAL', 'HIGH', 'MODERATE'];
      
      const newInc = {
        id: `INC-${Math.floor(Math.random() * 900) + 100}`,
        type: types[Math.floor(Math.random() * types.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: 'Active'
      };
      
      setIncidents(prev => [newInc, ...prev.slice(0, 5)]);
    }, 18000); // add a new incident every 18 seconds to feel truly live!
    
    return () => clearInterval(handle);
  }, []);

  // Compute live stats for KPIs
  const activeEmergencies = ambulances.filter(a => a.status === 'Green Corridor Active' || a.status === 'En Route').length;
  const ambulancesOnline = ambulances.filter(a => a.status !== 'Offline').length;
  const activeCorridorsCount = ambulances.filter(a => a.status === 'Green Corridor Active').length;
  const avgResponseTime = '9.8 min';
  const goldenHourSuccess = '98.6%';
  const networkHealth = '99.9%';

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* 1. TOP KPI PANEL */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col justify-between select-none relative overflow-hidden group hover:border-[#D9EF92]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Active Transits</span>
            <div className="p-1 rounded-lg bg-red-500/10 text-red-400">
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-sans font-extrabold text-white tracking-tight leading-none">{activeEmergencies}</span>
            <span className="text-[9px] font-mono text-gray-500">Missions LIVE</span>
          </div>
          <div className="absolute bottom-0 left-0 h-0.5 bg-red-500 w-full" />
        </div>

        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col justify-between select-none relative overflow-hidden group hover:border-[#D9EF92]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Fleets Online</span>
            <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-sans font-extrabold text-white tracking-tight leading-none">{ambulancesOnline} / {ambulances.length}</span>
            <span className="text-[9px] font-mono text-emerald-400">99.2% Ping</span>
          </div>
          <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 w-full" />
        </div>

        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col justify-between select-none relative overflow-hidden group hover:border-[#D9EF92]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">5G Green Slices</span>
            <div className="p-1 rounded-lg bg-[#D9EF92]/10 text-[#D9EF92]">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-sans font-extrabold text-[#D9EF92] tracking-tight leading-none">{activeCorridorsCount}</span>
            <span className="text-[9px] font-mono text-gray-500">CORRIDORS</span>
          </div>
          <div className="absolute bottom-0 left-0 h-0.5 bg-[#D9EF92] w-full" />
        </div>

        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col justify-between select-none relative overflow-hidden group hover:border-[#D9EF92]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Avg Response</span>
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-sans font-extrabold text-emerald-400 tracking-tight leading-none">{avgResponseTime}</span>
            <span className="text-[9px] font-mono text-emerald-400">▼ 45% ARKA</span>
          </div>
          <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 w-full" />
        </div>

        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col justify-between select-none relative overflow-hidden group hover:border-[#D9EF92]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Golden Hr SLA</span>
            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-sans font-extrabold text-white tracking-tight leading-none">{goldenHourSuccess}</span>
            <span className="text-[9px] font-mono text-emerald-400">Saves Lives</span>
          </div>
          <div className="absolute bottom-0 left-0 h-0.5 bg-amber-500 w-full" />
        </div>

        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col justify-between select-none relative overflow-hidden group hover:border-[#D9EF92]/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Network SLA</span>
            <div className="p-1 rounded-lg bg-sky-500/10 text-sky-400">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-sans font-extrabold text-white tracking-tight leading-none">{networkHealth}</span>
            <span className="text-[9px] font-mono text-[#D9EF92]">5G Slice OK</span>
          </div>
          <div className="absolute bottom-0 left-0 h-0.5 bg-sky-500 w-full" />
        </div>

      </div>

      {/* 2. CENTER section with LEFT Feed and RIGHT recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Emergency Incidents Feed (3 cols) */}
        <div className="lg:col-span-3 bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-4 h-[550px] overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Live Emergency Incidents Feed
            </h3>
            <span className="text-[9px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded animate-pulse">LIVE FEED</span>
          </div>
          <p className="text-[10.5px] text-gray-400">
            Real-time ambulance dispatch triggers and hospital requests across Bhubaneswar sectors.
          </p>
          <div className="h-px bg-[#1F242E]" />

          {/* Incidents Scroller */}
          <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto pr-1">
            {incidents.map((inc) => (
              <div 
                key={inc.id}
                className="bg-[#0A0C11] p-3 rounded-lg border border-[#1F242E] hover:border-red-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-mono font-bold text-[#D9EF92]">{inc.id}</span>
                  <span className={`text-[8.5px] font-mono border px-1.5 py-0.5 rounded leading-none ${
                    inc.priority === 'CRITICAL' ? 'border-red-500 text-red-400 bg-red-500/5' :
                    inc.priority === 'HIGH' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-blue-500 text-blue-400'
                  }`}>
                    {inc.priority}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-1.5">{inc.type}</div>
                <div className="text-[10.5px] text-gray-400 mt-1 flex items-center gap-1">
                  <span className="shrink-0 font-mono text-[8px] text-gray-500">LOC:</span> {inc.location}
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1F242E]/40 text-[9.5px] font-mono text-gray-500">
                  <span>DISPATCHED: {inc.time}</span>
                  <span className={inc.status === 'Active' ? 'text-red-400 animate-pulse font-bold' : 'text-emerald-400'}>
                    ● {inc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER SECTION: Large live city map of Bhubaneswar (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Bhubaneswar City-Wide Twin Canvas</span>
            </h3>
            <span className="text-[10px] font-mono text-gray-400 bg-[#10141D] border border-[#1F242E] px-2 py-0.5 rounded">
              Default: Bhubaneswar, Odisha
            </span>
          </div>
          
          <div className="h-[500px]">
            <GisMap
              junctions={junctions}
              roads={roads}
              hospitals={hospitals}
              ambulances={ambulances}
              activeJunctionId={activeJunctionId}
              onSelectJunction={onSelectJunction}
              activeAmbulanceId={activeAmbulanceId}
              onSelectAmbulance={onSelectAmbulance}
              layers={layers}
              setLayers={setLayers}
              simulationTicking={true}
            />
          </div>
        </div>

        {/* RIGHT PANEL: AI Recommendations & Traffic Alerts (3 cols) */}
        <div className="lg:col-span-3 bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-4 h-[550px] overflow-hidden">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D9EF92]" />
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">AI Recommendation HUD</h3>
          </div>
          <p className="text-[10.5px] text-gray-400">
            ARKA AI Core analyzes congestion and recommends pre-emption slices.
          </p>
          <div className="h-px bg-[#1F242E]" />

          {/* Traffic alert card list */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-[#1C1613] p-3 rounded-lg border border-amber-500/20 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Junction C Overflow
                </span>
                <span className="text-[8px] font-mono text-gray-500">11:43</span>
              </div>
              <p className="text-[10.5px] text-amber-200 mt-1 font-sans leading-relaxed">
                Congestion index at Junction C spike detected (91%). Automated clearance timing adjusted +15s.
              </p>
              <div className="mt-2 text-[9.5px] font-mono text-amber-400/80">Sug: Divert Beta-205 to ring pass</div>
            </div>

            <div className="bg-[#121A15] p-3 rounded-lg border border-emerald-500/20 text-left">
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Active Corridor Lock
              </span>
              <p className="text-[10.5px] text-emerald-200 mt-1 leading-relaxed">
                Ambulance A-102 Green Corridor successfully locked. Intersections A, B, and C overriding signals.
              </p>
              <div className="mt-2 text-[9.5px] font-mono text-emerald-400 flex items-center gap-1 justify-content-between">
                <span>ETA: 4m 12s to Apex General</span>
              </div>
            </div>

            <div className="bg-[#121522] p-3 rounded-lg border border-blue-500/20 text-left">
              <span className="text-[9px] font-mono text-blue-400 font-bold uppercase flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-400" />
                Hospital Alert Dispatch
              </span>
              <p className="text-[10.5px] text-blue-200 mt-1 leading-relaxed">
                Apex Trauma emergency room bed count synced. ICU occupancy is currently at 84%.
              </p>
              <span className="mt-2 block text-[9.5px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-sm uppercase w-fit">Bay 3 Pre-Assigned</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM SECTION: 24-Hour Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        
        {/* Response Time Trends */}
        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-bold text-white uppercase tracking-wider">
              24-Hour Response Time Trend (Min)
            </span>
            <span className="text-[9.5px] font-mono text-[#D9EF92] bg-[#D9EF92]/5 border border-[#D9EF92]/20 px-2 py-0.5 rounded">
              Average Saved: 4.2 mins
            </span>
          </div>
          <p className="text-[10.5px] text-gray-400">
            Emergency transit travel time with ARKA 5G pre-emption slice vs historical baseline.
          </p>

          <div className="h-40 flex items-end justify-between border-b border-[#1F242E] pt-6 pb-2 px-4 gap-2 text-[10px] font-mono">
            {[
              { hr: '00:00', staticTime: 16, arkaTime: 10 },
              { hr: '04:00', staticTime: 14, arkaTime: 8 },
              { hr: '08:00', staticTime: 24, arkaTime: 12 },
              { hr: '12:00', staticTime: 22, arkaTime: 11 },
              { hr: '16:00', staticTime: 26, arkaTime: 13 },
              { hr: '20:00', staticTime: 18, arkaTime: 9 }
            ].map((pt, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex gap-1 items-end h-full justify-center">
                  {/* Static Baseline (Without ARKA) */}
                  <div 
                    className="w-3 bg-red-500/20 border-t border-red-500/50 rounded-t"
                    style={{ height: `${(pt.staticTime / 30) * 100}%` }}
                    title={`Standard: ${pt.staticTime} min`}
                  />
                  {/* ARKA corridor (With ARKA) */}
                  <div 
                    className="w-3 bg-[#D9EF92] hover:brightness-110 rounded-t transition-colors"
                    style={{ height: `${(pt.arkaTime / 30) * 100}%` }}
                    title={`ARKA Enabled: ${pt.arkaTime} min`}
                  />
                </div>
                <span className="text-[9px] text-gray-500">{pt.hr}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[9.5px] font-mono text-gray-500 mt-1 px-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500/40 border border-red-500/50 rounded" />
              <span>Standard Baseline (No ARKA)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#D9EF92] rounded" />
              <span>ARKA 5G mmWave Corridor</span>
            </div>
          </div>
        </div>

        {/* Congestion Trends */}
        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-bold text-white uppercase tracking-wider">
              24-Hour Network Congestion Density Index
            </span>
            <span className="text-[9.5px] font-mono text-red-400 bg-red-400/5 border border-red-400/10 px-2 py-0.5 rounded">
              Average Load: 52%
            </span>
          </div>
          <p className="text-[10.5px] text-gray-400">
            Smart-city sensor network measuring average queue accumulation across critical lanes.
          </p>

          <div className="h-40 flex items-end justify-between border-b border-[#1F242E] pt-6 pb-2 px-4 gap-2 text-[10px] font-mono">
            {[
              { hr: '00:00', density: 25 },
              { hr: '04:00', density: 15 },
              { hr: '08:00', density: 78 },
              { hr: '12:00', density: 64 },
              { hr: '16:00', density: 84 },
              { hr: '20:00', density: 52 }
            ].map((pt, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div 
                  className="w-6 hover:bg-[#D9EF92] rounded-t transition-all duration-300 relative group"
                  style={{ 
                    height: `${pt.density}%`,
                    backgroundColor: pt.density > 75 ? 'rgba(239, 68, 68, 0.4)' : pt.density > 50 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.4)',
                    borderTop: `2px solid ${pt.density > 75 ? '#EF4444' : pt.density > 50 ? '#F59E0B' : '#22C55E'}`
                  }}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[8px] font-mono bg-black text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {pt.density}% Load
                  </span>
                </div>
                <span className="text-[9px] text-gray-500">{pt.hr}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[9.5px] font-mono text-gray-500 mt-1 px-2.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span>Severe (&gt;75%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span>Moderate (50-75%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>Free flow (&lt;50%)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
