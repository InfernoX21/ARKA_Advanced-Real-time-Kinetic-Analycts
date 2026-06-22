import React from 'react';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  Sliders, 
  Zap, 
  Flame, 
  HelpCircle,
  Activity,
  Award,
  HeartPulse,
  Navigation
} from 'lucide-react';
import { Hospital, LogEvent, Ambulance } from '../types';

/* 1. Hospital Command Panel */
interface HospitalPanelProps {
  hospitals: Hospital[];
  currentAmbulance: Ambulance | null;
}

export function HospitalPanel({ hospitals, currentAmbulance }: HospitalPanelProps) {
  return (
    <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 select-none h-full">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-[#D9EF92]" />
        <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
          Hospital Command Center Alert System
        </h3>
      </div>
      
      <p className="text-xs text-gray-400">
        Trauma centers automatically sync beds, dispatch ICU coordinates & prepare trauma bays when ambulance is en-route.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
        {hospitals.map((hos) => {
          // Check if current ambulance route ends on this hospital
          const isTargeted = currentAmbulance && currentAmbulance.route[currentAmbulance.route.length - 1] === hos.id;
          const isEnRoute = currentAmbulance && (currentAmbulance.status === 'Green Corridor Active' || currentAmbulance.status === 'En Route');
          const isIncoming = isTargeted && isEnRoute;

          return (
            <div 
              key={hos.id}
              className={`border p-4 rounded-xl flex flex-col gap-3 transition-all duration-300 ${
                isIncoming 
                  ? 'bg-[#1E1116] border-red-500/40 shadow-lg shadow-red-950/20' 
                  : 'bg-[#0A0C11] border-[#1F242E]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isIncoming ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-[#D9EF92]/10 text-[#D9EF92]'}`}>
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-sans font-bold text-white uppercase tracking-wider">{hos.name}</span>
                </div>
                
                {isIncoming ? (
                  <span className="text-[8px] font-mono font-bold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded uppercase animate-pulse">
                    TRAUMA BAY READY - INCOMING
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded">
                    STANDBY
                  </span>
                )}
              </div>

              <div className="h-px bg-[#1F242E]/70" />

              {/* Grid content stats */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] font-mono text-gray-400">
                <div className="flex flex-col">
                  <span>Available Beds:</span>
                  <span className="text-white font-bold text-xs mt-0.5">{hos.availableBeds} / {hos.totalBeds} Beds</span>
                </div>

                <div className="flex flex-col">
                  <span>ICU Occupancy Rate:</span>
                  <span className="text-white font-bold text-xs mt-0.5">{hos.icuOccupancy}%</span>
                </div>
              </div>

              {/* Beds and ICU progress bars */}
              <div className="flex flex-col gap-1.5 mt-0.5">
                <div className="flex justify-between text-[8px] font-mono text-gray-500">
                  <span>ICU Occupancy Saturation</span>
                  <span className="text-white">{hos.icuOccupancy}% occupied</span>
                </div>
                <div className="h-1.5 bg-[#1F242E] rounded overflow-hidden">
                  <div 
                    className={`h-full rounded transition-all duration-300 ${
                      hos.icuOccupancy > 85 ? 'bg-red-500 animate-pulse' : 'bg-[#D9EF92]'
                    }`}
                    style={{ width: `${hos.icuOccupancy}%` }}
                  />
                </div>
              </div>

              {/* Ambulance Specific Dispatch details */}
              {isIncoming && currentAmbulance && (
                <div className="p-2.5 bg-[#2B1015] border border-red-500/20 rounded-lg flex items-center justify-between text-[10px] font-mono mt-1 text-red-200">
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-red-400 animate-spin" />
                    <span>Ambulance <strong className="text-white">{currentAmbulance.id}</strong> ETA</span>
                  </div>
                  <span className="font-extrabold text-white text-xs bg-red-600/30 px-1.5 py-0.5 rounded animate-pulse">
                    {Math.floor(currentAmbulance.etaToHospital / 60)}m {currentAmbulance.etaToHospital % 60}s
                  </span>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}


/* 2. Golden Hour Analytics */
export function GoldenHourAnalytics() {
  return (
    <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 select-none h-full">
      <div className="flex items-center gap-2">
        <Award className="w-4 h-4 text-[#D9EF92]" />
        <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
          PLATFORM GOLDEN HOUR PERFORMANCE ANALYTICS
        </h3>
      </div>

      <p className="text-xs text-gray-400">
        Aggregated 5G-Powered synchronization metrics demonstrates emergency response performance at smart-city deployments.
      </p>

      {/* Grid numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        <div className="bg-[#0A0C11] border border-[#1F242E] p-3.5 rounded-xl flex flex-col">
          <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wide">RESPONSE TIME SAVED</span>
          <span className="text-2xl font-sans font-extrabold text-[#D9EF92] tracking-tight mt-1.5">
            4.2m
          </span>
          <span className="text-[8px] font-mono text-emerald-400 tracking-wider font-semibold uppercase mt-1">
            ▲ 22.4% vs Standard
          </span>
        </div>

        <div className="bg-[#0A0C11] border border-[#1F242E] p-3.5 rounded-xl flex flex-col">
          <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wide">GOLDEN HOUR SUCCESS</span>
          <span className="text-2xl font-sans font-extrabold text-white tracking-tight mt-1.5">
            98.6%
          </span>
          <span className="text-[8px] font-mono text-emerald-400 tracking-wider font-semibold uppercase mt-1">
            ▲ 4.8% SLA Target
          </span>
        </div>

        <div className="bg-[#0A0C11] border border-[#1F242E] p-3.5 rounded-xl flex flex-col">
          <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wide">CORRIDORS ENGAGED</span>
          <span className="text-2xl font-sans font-extrabold text-white tracking-tight mt-1.5">
            1,402
          </span>
          <span className="text-[8px] font-mono text-gray-500 tracking-wider uppercase mt-1">
            YTD Cumulative
          </span>
        </div>

        <div className="bg-[#0A0C11] border border-[#1F242E] p-3.5 rounded-xl flex flex-col">
          <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wide">INCIDENTS RESOLVED</span>
          <span className="text-2xl font-sans font-extrabold text-[#D9EF92] tracking-tight mt-1.5">
            3,820+
          </span>
          <span className="text-[8px] font-mono text-[#D9EF92] tracking-wider uppercase mt-1">
            Live V2X Nodes
          </span>
        </div>

        <div className="bg-[#0A0C11] border border-[#1F242E] p-3.5 rounded-xl flex flex-col">
          <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wide">AVG DELAY PREVENTED</span>
          <span className="text-2xl font-sans font-extrabold text-white tracking-tight mt-1.5">
            128s
          </span>
          <span className="text-[8px] font-mono text-emerald-400 tracking-wider uppercase mt-1">
            PER INTERSECTION
          </span>
        </div>

        <div className="bg-[#0A0C11] border border-[#1F242E] p-3.5 rounded-xl flex flex-col">
          <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wide">CORE EFFICIENCY INDEX</span>
          <span className="text-2xl font-sans font-extrabold text-white tracking-tight mt-1.5">
            92.8%
          </span>
          <span className="text-[8px] font-mono text-emerald-400 tracking-wider uppercase mt-1">
            ▲ 1.4% OVERALL FLOW
          </span>
        </div>

      </div>

      {/* Simplified High-Contrast Performance Trend Chart using pure, highly clean CSS vector layouts */}
      <div className="bg-[#0A0C11] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-gray-400 uppercase">MONTHLY AVERAGE TIME SAVED OVER YEAR 2026 (MINUTES)</span>
          <span className="text-[#D9EF92]">Target SLA Baseline: 3.5m</span>
        </div>

        {/* CSS Chart Columns */}
        <div className="flex items-end justify-between h-32 pt-6 pb-2 border-b border-[#1F242E] px-4 gap-2">
          {[
            { month: 'Jan', val: 2.8, saved: 2.8 },
            { month: 'Feb', val: 3.1, saved: 3.1 },
            { month: 'Mar', val: 3.4, saved: 3.4 },
            { month: 'Apr', val: 4.1, saved: 4.1 },
            { month: 'May', val: 4.0, saved: 4.0 },
            { month: 'Jun', val: 4.2, saved: 4.2 },
            { month: 'Jul', val: 4.5, saved: 4.5 },
            { month: 'Aug', val: 4.3, saved: 4.3 },
            { month: 'Sep', val: 4.6, saved: 4.6 },
            { month: 'Oct', val: 4.8, saved: 4.8 },
            { month: 'Nov', val: 4.9, saved: 4.9 },
            { month: 'Dec', val: 5.1, saved: 5.1 }
          ].map((bar, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer h-full justify-end">
              <div className="text-[8px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1E293B] px-1 py-0.5 rounded -translate-y-1">
                {bar.saved}m
              </div>
              <div 
                className="w-full bg-[#1F2533] hover:bg-[#D9EF92] rounded-t transition-all duration-300 relative overflow-hidden" 
                style={{ 
                  height: `${(bar.val / 6) * 100}%`,
                  backgroundImage: 'linear-gradient(to top, rgba(217,239,146,0.05), rgba(217,239,146,0.3))'
                }}
              />
              <span className="text-[9px] font-mono text-gray-500">{bar.month}</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}


/* 3. Incident Timeline Feed */
interface IncidentTimelineProps {
  logs: LogEvent[];
  onClear: () => void;
}

export function IncidentTimeline({ logs, onClear }: IncidentTimelineProps) {
  const getLogDotColor = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-red-500';
      case 'corridor': return 'bg-[#D9EF92]';
      case 'prediction': return 'bg-blue-400';
      case 'success': return 'bg-emerald-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-3.5 select-none h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#D9EF92]" />
          <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
            Dispatcher Tactical Incident Timeline
          </h3>
        </div>
        
        <button
          onClick={onClear}
          className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors cursor-pointer border border-[#1F242E] px-2 py-1 rounded bg-[#0A0C11]"
        >
          CLEAR LOGS
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Trace audit sequence logs generated autonomously by V2X cellular infrastructure sensors.
      </p>

      {/* Timeline container */}
      <div className="mt-2 flex-1 flex flex-col gap-3 text-left max-h-72 overflow-y-auto pr-1 scrollbar-thin">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-xs py-4 text-center">No timeline events captured.</p>
        ) : (
          logs.map((log, idx) => (
            <div key={log.id} className="relative pl-6 pb-2.5 last:pb-0">
              {/* Vertical line connector */}
              {idx < logs.length - 1 && (
                <div className="absolute left-1.5 top-2.5 bottom-0 w-px bg-[#1F242E]" />
              )}
              
              {/* Dot indicator */}
              <div className={`absolute left-0.5 top-1.5 w-2.5 h-2.5 rounded-full border border-black ${getLogDotColor(log.type)}`} />

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-white tracking-wide">{log.message}</span>
                <span className="text-[8.5px] font-mono text-gray-500 bg-[#0A0C11] border border-[#1F242E] px-1 py-0.5 rounded leading-none shrink-0">
                  {log.timestamp}
                </span>
              </div>
              <span className="text-[8px] font-mono text-gray-500 uppercase mt-0.5 block tracking-widest">
                Source Node // Telemetry Level // {log.type}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}


/* 4. AI Insights & Actionable Recommendations Panel */
export function AiInsights() {
  const insights = [
    {
      id: 'I1',
      title: 'Heavy congestion adjacent Junction C (Metro Interchange)',
      desc: 'Alternate corridor route mapped via Sector 5 Expressway reduces medical transit ETA by 1.8 mins.',
      benefit: 'Recommended alternative route',
      stats: 'Save 1.8 minutes',
      badge: 'URGENT'
    },
    {
      id: 'I2',
      title: 'Hospital alert automatically dispatched',
      desc: 'Bed coordination signals synced with Apex Trauma ICU. Code-Red trauma bay cleared and pre-assigned.',
      benefit: 'Trauma Bay Pre-allocation Active',
      stats: 'Alert confirmed',
      badge: 'AUTOMATED'
    },
    {
      id: 'I3',
      title: 'Golden Hour survival probability surge',
      desc: 'ARKA pre-emptive queue clearance protocols spikes immediate emergency phase accuracy by +22%',
      benefit: 'Critical SLA target met successfully',
      stats: '+22% Survival Spike',
      badge: 'AI ANALYTICS'
    }
  ];

  return (
    <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 select-none h-full">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#D9EF92]" />
        <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
          ARKA AI Intelligent Insights Platform
        </h3>
      </div>

      <p className="text-xs text-gray-400">
        AI-driven telemetry identifies grid bottlenecks, suggests alternate corridors, and automatically alerts hospital partners.
      </p>

      {/* Grid of cards */}
      <div className="flex flex-col gap-3 py-1">
        {insights.map((ins) => (
          <div 
            key={ins.id}
            className="bg-[#0A0C11] border border-[#1FA354]/10 hover:border-[#D9EF92]/30 p-3.5 rounded-xl flex items-start gap-3.5 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="p-1.5 h-7 w-7 rounded-lg bg-[#D9EF92]/10 text-[#D9EF92] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>

            <div className="flex-1 flex flex-col gap-1 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-bold text-white tracking-wide">{ins.title}</span>
                <span className="text-[8px] font-mono text-[#D9EF92] border border-[#D9EF92]/30 px-1.5 py-0.5 rounded leading-none">
                  {ins.badge}
                </span>
              </div>
              <p className="text-[10.5px] text-gray-400 leading-relaxed font-sans">{ins.desc}</p>
              
              <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-[#1F242E]/50 text-[9px] font-mono text-gray-500">
                <span>{ins.benefit}</span>
                <span className="text-[#D9EF92] font-semibold">{ins.stats}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
