import React, { useState, useMemo } from 'react';
import { 
  Signal, 
  Tv, 
  Activity, 
  Clock, 
  Sliders, 
  Camera, 
  ShieldAlert, 
  AlertTriangle, 
  Wifi,
  Radio,
  Play,
  CheckCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { Junction } from '../types';

interface TrafficSignalsTabProps {
  junctions: Junction[];
  onSelectJunction: (id: string | null) => void;
  onOverrideJunction: (id: string, status: 'GREEN' | 'RED' | 'OVERRIDE' | 'YELLOW') => void;
}

export default function TrafficSignalsTab({
  junctions,
  onSelectJunction,
  onOverrideJunction
}: TrafficSignalsTabProps) {

  const [activeSigId, setActiveSigId] = useState<string>('JV');

  // Memoized current signal specs
  const activeSig = useMemo(() => {
    return junctions.find(j => j.id === activeSigId) || junctions[0];
  }, [junctions, activeSigId]);

  // Connected adjacent signals mapping
  const adjacentSignals = useMemo(() => {
    const connects: Record<string, string[]> = {
      'JV': ['AV', 'CS', 'APOLLO'],
      'AV': ['JV', 'VV'],
      'VV': ['AV', 'RS', 'MC', 'APOLLO'],
      'RS': ['VV'],
      'CS': ['JV', 'PS', 'FS'],
      'KI': ['PS'],
      'PS': ['KI', 'DS', 'CS', 'IC'],
      'DS': ['PS', 'APOLLO'],
      'KS': ['CS', 'FS'],
      'FS': ['KS', 'JV', 'AIIMS'],
      'RM': ['MC', 'KL', 'CAPITAL'],
      'KL': ['RM'],
      'MC': ['RM', 'VV'],
      'IC': ['PS']
    };
    return connects[activeSigId] || ['JV'];
  }, [activeSigId]);

  // Historical crossing stats for specific selected junction
  const historicalCrossingStats = useMemo(() => {
    const database: Record<string, any[]> = {
      'JV': [
        { id: 'C-904', time: '11:42:08', type: 'Alpha-102', event: 'Approved Pre-emption', duration: '52s override' },
        { id: 'C-714', time: '11:15:32', type: 'Beta-205', event: 'Automatic Clearance', duration: '34s override' }
      ],
      'AV': [
        { id: 'C-811', time: '11:42:25', type: 'Alpha-102', event: 'Approved Pre-emption', duration: '41s override' }
      ],
      'VV': [
        { id: 'C-731', time: '11:42:50', type: 'Alpha-102', event: 'Force Queue Drainage', duration: '68s override' }
      ],
      'RS': [
        { id: 'C-654', time: '11:43:18', type: 'Alpha-102', event: 'Green Wave Lockout', duration: '20s override' }
      ],
      'CS': [
        { id: 'C-501', time: '10:55:12', type: 'Gamma-301', event: 'Cellular Handoff Slices', duration: '40s override' }
      ]
    };
    return database[activeSigId] || [
      { id: 'C-100', time: '10:04:12', type: 'Gamma-301', event: 'Automated 5G Pre-emption Wave', duration: '28s override' }
    ];
  }, [activeSigId]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'RED': return 'border-red-500 text-red-400 bg-red-500/10';
      case 'GREEN': return 'border-emerald-500 text-emerald-400 bg-emerald-500/10';
      case 'OVERRIDE': return 'border-[#D9EF92] text-[#D9EF92] bg-emerald-950/80 animate-pulse font-bold';
      default: return 'border-amber-500 text-amber-400 bg-amber-500/10';
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Intelligent V2X Intersections & Signal Hub</h2>
          <p className="text-xs text-gray-400">
            Monitor and override cellular-connected signal phases, trace real-time queue densities, and analyze historical pre-emption runs.
          </p>
        </div>
      </div>

      {/* Primary Split: Left side Signal Cards Grid / Right Side Camera Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: List grid of signals (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {junctions.map((j) => {
              const isActive = j.id === activeSigId;
              
              return (
                <div 
                  key={j.id}
                  onClick={() => {
                    setActiveSigId(j.id);
                    onSelectJunction(j.id);
                  }}
                  className={`bg-[#0F1115] border p-4.5 rounded-xl flex flex-col gap-3.5 select-none transition-all duration-300 relative overflow-hidden cursor-pointer ${
                    isActive 
                      ? 'border-[#D9EF92] bg-[#1C2029]/75 shadow-xl scale-[1.02]' 
                      : 'border-[#1F242E] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase">SIGNAL ID</span>
                      <h4 className="text-sm font-sans font-extrabold text-white mt-0.5">{j.id} • {j.name.split(' - ')[1]}</h4>
                    </div>
                    
                    <span className={`text-[9.5px] font-mono border px-2 py-0.5 rounded uppercase leading-none ${getStatusBadgeStyle(j.status)}`}>
                      {j.status}
                    </span>
                  </div>

                  <div className="h-px bg-[#1F242E]/70" />

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10.5px] font-mono text-gray-400">
                    <span>Active Phase:</span>
                    <strong className="text-white text-right truncate">{j.phase}</strong>
                    <span>Queue Length:</span>
                    <strong className="text-white text-right">{j.queueLength} units</strong>
                    <span>Phase Remainder:</span>
                    <strong className="text-white text-right">{j.waitSec}s</strong>
                    <span>Average Wait:</span>
                    <strong className="text-[#D9EF92] text-right">{j.avgWaitTime}s</strong>
                  </div>

                  {/* Density Progress bar */}
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between text-[9px] font-mono text-gray-500">
                      <span>Line Vehicle Density Limit</span>
                      <strong className={j.density > 80 ? 'text-red-400' : 'text-gray-300'}>{j.density}%</strong>
                    </div>
                    <div className="h-1 bg-black rounded overflow-hidden">
                      <div 
                        className={`h-full rounded ${j.density > 80 ? 'bg-red-500' : 'bg-[#D9EF92]'}`}
                        style={{ width: `${j.density}%` }}
                      />
                    </div>
                  </div>

                  {/* Absolute shadow label background */}
                  <div className="absolute right-0 bottom-0 text-[45px] font-extrabold font-mono text-white/[0.012] leading-none pointer-events-none select-none">
                    {j.id}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connected Topology line and pre-emption overview */}
          <div className="bg-[#0F1115] border border-[#1F242E] p-4.5 rounded-xl text-left select-none shadow-xl mt-2">
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <Radio className="w-4 h-4 text-[#D9EF92]" />
              Signal Communications Topology Mesh Network
            </h3>
            <p className="text-xs text-gray-400">
              The ARKA 5G mmWave V2V mesh connects overlapping intersections to pre-emptively propagate traffic wave clearances.
            </p>

            {/* Visual connected topology blocks representation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3.5">
              
              <div className="bg-[#0A0C11] border border-[#1F242E] p-3 rounded-lg">
                <span className="text-[9px] font-mono text-gray-500 uppercase">Selected Signal Center Instance</span>
                <strong className="text-[#D9EF92] text-sm font-sans font-bold block mt-1">{activeSig.id} • {activeSig.name.split(' - ')[1]}</strong>
                <span className="text-[9.5px] font-mono text-emerald-400 mt-1 block">Status: phase synchronized</span>
              </div>

              <div className="bg-[#0A0C11] border border-[#1F242E] p-3 rounded-lg flex flex-col justify-between">
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Adjacent Linked Neighbors</span>
                <div className="flex gap-2 flex-wrap mt-1">
                  {adjacentSignals.map((sig) => (
                    <span key={sig} className="bg-[#D9EF92]/5 border border-[#D9EF92]/20 text-[10px] font-mono font-bold text-[#D9EF92] px-2 py-0.5 rounded">
                      Linked: {sig}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#0A0C11] border border-[#1F242E] p-3 rounded-lg flex flex-col justify-between">
                <span className="text-[9px] font-mono text-gray-500 uppercase">Packet Slicing Latency</span>
                <strong className="text-white text-base font-mono block mt-1">~2.4ms (mmWave)</strong>
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">100% SLA Guarantee</span>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Signal Camera CCTV feedback and Overrides controls (5 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {activeSig && (
            <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 text-left select-none shadow-xl relative overflow-hidden">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#D9EF92] bg-[#D9EF92]/5 border border-[#D9EF92]/10 px-2.5 py-0.5 rounded w-fit uppercase">
                  AI YOLOv11 CCTV Camera Feeds ({activeSig.id})
                </span>
                <h3 className="font-sans font-extrabold text-[#D9EF92] text-sm mt-2 uppercase flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Live Edge Camera Feed: {activeSig.cameraId}
                </h3>
              </div>

              {/* Dynamic CCTV Box simulation with scanning grids */}
              <div className="bg-black border border-[#1F242E] rounded-xl h-[170px] relative overflow-hidden flex items-center justify-center font-mono">
                
                {/* Horizontal scan line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[#D9EF92]/10 shadow-[0_0_10px_#D9EF92] animate-bounce pointer-events-none" />
                
                {/* Visual detection square overlays */}
                <div className="absolute top-7 left-12 h-14 w-15 border border-red-500 bg-red-500/10 p-0.5 rounded text-[8px] font-mono text-red-400 flex flex-col justify-between">
                  <span>CAR #488</span>
                  <span>94.2% AI</span>
                </div>

                <div className="absolute bottom-5 right-10 h-10 w-12 border border-blue-500 bg-blue-500/10 p-0.5 rounded text-[8px] font-mono text-blue-400 flex flex-col justify-between">
                  <span>BUS #12</span>
                  <span>89.1% AI</span>
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(0,0,0,0.8)_100%)] pointer-events-none" />

                {/* CCTV Corner labels */}
                <div className="absolute top-2 left-2 text-[8px] text-[#D9EF92] font-mono tracking-widest leading-none bg-black/60 p-1 border border-[#1F242E]">
                  REC ● {activeSig.cameraId} // {activeSig.name.split(' - ')[1].toUpperCase()}
                </div>

                <div className="absolute bottom-2 right-2 text-[8px] text-gray-500 font-mono tracking-wider">
                  FPS: 30.0 // YOLOv11 CONF_THRES: 85.0%
                </div>

                <div className="text-[10px] text-zinc-600 font-sans font-bold uppercase mt-12 select-none animate-pulse">
                  Stream connected via Edge nodes
                </div>
              </div>

              {/* Interactive Override Trigger buttons */}
              <div className="bg-[#1C1112] p-4 border border-red-500/25 rounded-xl flex flex-col gap-2.5">
                <span className="text-[9.5px] font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 pl-0.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  Manual Command Signal Override
                </span>
                <p className="text-[10.5px] text-red-200 leading-normal font-sans">
                  Instantly override this intersection signal phase. Useful during synchronized civil disaster transits or network blackouts.
                </p>

                <div className="flex gap-2.5 mt-1.5">
                  <button
                    onClick={() => onOverrideJunction(activeSig.id, 'OVERRIDE')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold font-mono text-[10px] py-2 rounded-lg cursor-pointer uppercase tracking-wider transition-colors"
                  >
                    FORCE EMERGENCY OVERRIDE
                  </button>
                  <button
                    onClick={() => onOverrideJunction(activeSig.id, 'GREEN')}
                    className="flex-1 bg-[#1F242E] border border-[#1F242E] hover:border-emerald-500 hover:text-emerald-400 text-gray-300 font-bold font-mono text-[10px] py-2 rounded-lg cursor-pointer uppercase transition-all"
                  >
                    FORCE GREEN LANE
                  </button>
                </div>
              </div>

              {/* Emergency history crosses list */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold">
                  Recent Emergency pre-emption passes
                </span>

                {historicalCrossingStats.length > 0 ? (
                  <div className="flex flex-col gap-2 font-mono text-[10.5px]">
                    {historicalCrossingStats.map((item) => (
                      <div key={item.id} className="bg-black/60 border border-[#1F242E] rounded-lg p-2.5 text-left flex items-start justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{item.event}</span>
                          <span className="text-gray-500 text-[9px] mt-0.5">Passed unit: {item.type} // {item.time}</span>
                        </div>
                        <span className="text-[#D9EF92] text-[10px] bg-[#D9EF92]/5 border border-[#D9EF92]/20 px-2 py-0.5 rounded">
                          {item.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 font-mono text-center py-4 border border-dashed border-[#1F242E] rounded-lg">
                    No emergency override crosses logged at this node during current period cycle.
                  </p>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
