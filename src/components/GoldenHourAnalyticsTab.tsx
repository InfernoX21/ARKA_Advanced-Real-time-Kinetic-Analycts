import React, { useState } from 'react';
import { 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  HelpCircle, 
  Sparkles,
  HeartPulse,
  Heart,
  ChevronRight,
  Info
} from 'lucide-react';

export default function GoldenHourAnalyticsTab() {
  
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>('Cardiac');

  // Stats
  const metrics = [
    { title: 'Avg Response Time', value: '9.8 min', diff: '▼ 45.2%', context: 'vs 18.0 min Baseline', positive: true },
    { title: 'Total Time Saved', value: '42,840 min', diff: '▲ 22.8% MoM', context: 'YTD Transit Cumulative', positive: true },
    { title: 'Completion Rate', value: '99.82%', diff: '▲ 1.2% Target', context: 'SLA standard met', positive: true },
    { title: 'Corridors Generated', value: '1,402 Slices', diff: '▲ 14.5% surge', context: 'Dynamic 5G Pre-emption', positive: true },
    { title: 'Patients Assisted', value: '2,928 Souls', diff: '100% ICU Ready', context: 'Trauma Bay allocation OK', positive: true }
  ];

  // Distribution chart parameters
  const typeDistribution = [
    { type: 'Cardiac Arrest', count: 584, pct: 41, color: 'bg-red-500' },
    { type: 'Severe Trauma / Crash', count: 428, pct: 30, color: 'bg-amber-500' },
    { type: 'Stroke Case', count: 256, pct: 18, color: 'bg-indigo-500' },
    { type: 'Pediatric Crisis', count: 134, pct: 11, color: 'bg-[#D9EF92]' }
  ];

  // Alternate Suggestions/Insights feed
  const performanceInsights = [
    {
      id: 'ID-1',
      title: 'DBSCAN Cluster Warns Junction C Loop Bottlenecks',
      desc: 'During 17:00 express hours, Junction C metro lines back up. Suggest Pre-allocating alternate corridor paths on South Expressway.',
      priority: 'URGENT AI REC',
      impact: 'Save extra 1.8m travel time'
    },
    {
      id: 'ID-2',
      title: 'Adaptive Clearances Cut Average Delay at Junction A',
      desc: 'Signal override calibration wave is responding within 2.3 seconds to 5G slice pings, preventing J1 queue pile-up.',
      priority: 'SLA MET',
      impact: 'Delay limit minimal'
    }
  ];

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Golden Hour Life-Saving Performance Portal</h2>
          <p className="text-xs text-gray-400">
            Statistical audit board measuring average response times, time saved, clinical survival ratios, and pre-emption efficiencies.
          </p>
        </div>
      </div>

      {/* 1. TOP CARDS STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((card, idx) => (
          <div key={idx} className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <span className="text-[10px] font-mono text-gray-500 uppercase">{card.title}</span>
            <div className="mt-2 text-xl font-bold text-white font-sans tracking-tight">{card.value}</div>
            <div className="flex flex-col gap-0.5 mt-2">
              <span className={`text-[10px] font-mono font-bold ${card.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {card.diff}
              </span>
              <span className="text-[9px] font-mono text-gray-500">{card.context}</span>
            </div>
            <div className="absolute top-0 right-0 h-10 w-10 bg-white/[0.01] rounded-bl-full pointer-events-none" />
          </div>
        ))}
      </div>

      {/* COMPARATIVE IMPACT SECTION: SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* WITH vs WITHOUT ARKA COMPARATOR DISPLAY (8 cols) */}
        <div className="lg:col-span-8 bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D9EF92]" />
              <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
                ARKA CORRIDOR PRE-EMPTION OVERALL SAVINGS
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
              -8 mins Saved on average
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Comparative analysis of critical ambulance dispatch durations in Bhubaneswar before and after deploying smart 5G slice pre-emption.
          </p>

          {/* Spliced bar visualizer */}
          <div className="flex flex-col gap-5 mt-2 bg-black border border-[#1F242E] p-5 rounded-xl">
            
            {/* WITHOUT ARKA Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Traditional Dispatch response (No Pre-emption)</span>
                <strong className="text-red-400">18.0 mins (Time Sink)</strong>
              </div>
              <div className="h-6 bg-[#1F1214] rounded overflow-hidden p-0.5 border border-red-500/20">
                <div 
                  className="h-full rounded bg-red-600/30 border border-red-500/50 flex items-center px-3"
                  style={{ width: '100%' }}
                >
                  <span className="text-[9px] font-mono text-red-200 uppercase font-black tracking-widest">Congestion blocks, static green cycles, gridlock delays</span>
                </div>
              </div>
            </div>

            {/* WITH ARKA Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">ARKA 5G mmWave Slicing Pre-emption</span>
                <strong className="text-[#D9EF92]">10.0 mins (Locked-In)</strong>
              </div>
              <div className="h-6 bg-[#121A15] rounded overflow-hidden p-0.5 border border-emerald-500/20">
                <div 
                  className="h-full rounded bg-emerald-500/20 border border-emerald-500/50 flex items-center px-3 relative"
                  style={{ width: '55.5%' }} // 10 / 18 min
                >
                  <span className="text-[9px] font-mono text-emerald-200 uppercase font-black tracking-widest truncate">Instant Overrides, Pre-empted Queues</span>
                  <div className="absolute right-2 h-2 w-2 rounded-full bg-[#D9EF92] animate-ping" />
                </div>
              </div>
            </div>

            <div className="bg-[#0F1115] border border-[#1F242E] p-3 rounded-lg flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-400">SLA TARGET MET:</span>
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <span>▲ Saved 8.0 Minutes (44.4% transit reduction)</span>
              </span>
            </div>
          </div>

          {/* Time Saved Monthly Curve */}
          <div className="flex flex-col gap-2 bg-[#0A0C11] border border-[#1F242E] p-4 rounded-xl mt-1">
            <span className="text-[9.5px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
              Monthly Cumulative Saved Hour Rate (2026)
            </span>
            <div className="h-28 flex items-end justify-between border-b border-[#1F242E] pb-2 text-[10px] font-mono px-4 gap-1.5">
              {[
                { month: 'Jan', hrs: 120 },
                { month: 'Feb', hrs: 145 },
                { month: 'Mar', hrs: 180 },
                { month: 'Apr', hrs: 210 },
                { month: 'May', hrs: 285 },
                { month: 'Jun', hrs: 310 }
              ].map((pt, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                  <div className="text-[8px] opacity-0 group-hover:opacity-100 bg-gray-900 border px-1 py-0.5 rounded -translate-y-0.5 whitespace-nowrap text-white">
                    {pt.hrs} hrs
                  </div>
                  <div 
                    className="w-full bg-[#1A1E29] border-t border-[#D9EF92]/50 hover:bg-[#D9EF92] rounded-t transition-all duration-300"
                    style={{ height: `${(pt.hrs / 350) * 100}%` }}
                  />
                  <span className="text-[9px] text-gray-500">{pt.month}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* DISTRIBUTION TABLE & AI RECOMMENDATION FEED (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Distribution card */}
          <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D9EF92]" />
              <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Incident Type Spread</h3>
            </div>
            
            <p className="text-[10px] text-gray-400 leading-normal">
              Pre-emption slice requests broken down by medical trauma department specialization.
            </p>

            <div className="flex flex-col gap-3 mt-1 font-mono text-[11px]">
              {typeDistribution.map((cell, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-gray-300">
                    <span>{cell.type}</span>
                    <span>{cell.count} cycles ({cell.pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-black rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cell.color}`} style={{ width: `${cell.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI INSIGHTS PANEL */}
          <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D9EF92]" />
              <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">AI Insight Engine</h3>
            </div>
            <p className="text-[10px] text-gray-400">
              Machine learning diagnostics suggest local corridor performance recommendations.
            </p>

            <div className="flex flex-col gap-3">
              {performanceInsights.map((ins) => (
                <div key={ins.id} className="bg-[#0A0C11] border border-[#1F242E] p-3 rounded-lg text-left flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#D9EF92] border border-[#D9EF92]/20 px-1 rounded uppercase font-semibold">
                      {ins.priority}
                    </span>
                    <span className="text-[8px] font-mono text-gray-500">{ins.id}</span>
                  </div>
                  <strong className="text-xs text-white font-sans mt-1.5 tracking-wide leading-tight">{ins.title}</strong>
                  <p className="text-[10.5px] text-gray-400 mt-1 leading-normal">{ins.desc}</p>
                  <span className="text-[9.5px] font-mono text-emerald-400 mt-1.5 border-t border-[#1F242E]/70 pt-1.5">Impact: {ins.impact}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
