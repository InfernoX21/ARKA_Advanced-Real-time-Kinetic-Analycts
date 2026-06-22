import React, { useState, useMemo } from 'react';
import { 
  History, 
  Play, 
  Pause, 
  RotateCcw, 
  MapPin, 
  Tv, 
  Activity, 
  Clock, 
  Sparkles, 
  ArrowRight,
  User,
  ChevronRight,
  Sliders,
  Award,
  Navigation
} from 'lucide-react';
import { HistoricalIncident } from '../types';

export default function HistoricalEventsTab() {
  
  // Historical Incidents database
  const historicalIncidents: HistoricalIncident[] = [
    {
      id: 'INC-H701',
      date: '2026-06-19',
      emergencyType: 'Acute MI Cardiac',
      source: 'Junction A (Central)',
      destination: 'Apex Trauma General',
      travelTime: '8m 42s',
      timeSaved: '7m 18s',
      route: ['J1', 'J2', 'J3', 'J4', 'H1'],
      stats: { avgSpeed: 78, gForcePeaks: 1.2, patientStability: 'Stable', trafficDelaysFoilPct: 94 }
    },
    {
      id: 'INC-H592',
      date: '2026-06-18',
      emergencyType: 'Severe Road Trauma',
      source: 'Junction E (Harbour)',
      destination: 'Apex Trauma General',
      travelTime: '11m 15s',
      timeSaved: '9m 45s',
      route: ['J5', 'J3', 'H1'],
      stats: { avgSpeed: 72, gForcePeaks: 1.4, patientStability: 'Guarded', trafficDelaysFoilPct: 88 }
    },
    {
      id: 'INC-H411',
      date: '2026-06-15',
      emergencyType: 'Ischemic Stroke Emergency',
      source: 'Junction A (Central)',
      destination: 'Metro Lifeline Care',
      travelTime: '5m 32s',
      timeSaved: '4m 58s',
      route: ['J1', 'H2'],
      stats: { avgSpeed: 84, gForcePeaks: 1.1, patientStability: 'Stable', trafficDelaysFoilPct: 98 }
    }
  ];

  // Selected Incident for Replay
  const [selectedIncId, setSelectedIncId] = useState<string>('INC-H701');
  
  // Slider Replay state
  const [replayProgress, setReplayProgress] = useState<number>(45); // percentage 0-100
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Memoized selected incident
  const activeIncident = useMemo(() => {
    return historicalIncidents.find(i => i.id === selectedIncId) || historicalIncidents[0];
  }, [selectedIncId]);

  // Interpolate Coordinates based on selected route and progress slider (0 to 100)
  const ambulanceReplayCoords = useMemo(() => {
    // Basic nodes layout mapping
    const nodeCoords: Record<string, { x: number, y: number }> = {
      'J1': { x: 20, y: 35 },
      'J2': { x: 48, y: 28 },
      'J3': { x: 58, y: 64 },
      'J4': { x: 82, y: 44 },
      'J5': { x: 35, y: 78 },
      'H1': { x: 92, y: 78 },
      'H2': { x: 10, y: 72 }
    };

    const route = activeIncident.route;
    const segmentCount = route.length - 1;
    const segmentIndex = Math.min(Math.floor((replayProgress / 100) * segmentCount), segmentCount - 1);
    const segmentProgress = ((replayProgress / 100) * segmentCount) - segmentIndex;

    const fromNode = route[segmentIndex];
    const toNode = route[segmentIndex + 1];

    const fromC = nodeCoords[fromNode] || { x: 20, y: 35 };
    const toC = nodeCoords[toNode] || { x: 92, y: 78 };

    return {
      x: fromC.x + (toC.x - fromC.x) * segmentProgress,
      y: fromC.y + (toC.y - fromC.y) * segmentProgress,
      approachingNode: toNode,
      passedNode: fromNode
    };
  }, [activeIncident, replayProgress]);

  // Periodic automatic increment tick simulation
  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setReplayProgress(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 2;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">V2X Historical Missions & Replay Center</h2>
          <p className="text-xs text-gray-400">
            Replay and review previous life-saving runs, analyze speed curves, signal override timings, and calculate path compliance indexes.
          </p>
        </div>
      </div>

      {/* Grid: Left Incidents table / Right Interactive Replay Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Table of previous missions (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl">
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#D9EF92]" />
              Historical Incident Records
            </h3>

            <div className="overflow-hidden border border-[#1F242E] rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#0A0C11] text-gray-400 font-mono text-[10px] uppercase border-b border-[#1F242E]">
                      <th className="p-3">Incident ID</th>
                      <th className="p-3">Specialty / Emergency</th>
                      <th className="p-3">Route Link</th>
                      <th className="p-3">Time Saved</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F242E]/60 text-gray-300 font-sans">
                    {historicalIncidents.map((inc) => {
                      const isSelected = inc.id === selectedIncId;
                      return (
                        <tr 
                          key={inc.id}
                          className={`hover:bg-[#1E2430]/30 transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#1C2029]/80 border-l-2 border-[#D9EF92] text-white' : ''
                          }`}
                          onClick={() => {
                            setSelectedIncId(inc.id);
                            setReplayProgress(0);
                            setIsPlaying(false);
                          }}
                        >
                          <td className="p-3 font-mono font-bold text-[#D9EF92]">{inc.id}</td>
                          <td className="p-3 font-semibold">
                            <div className="flex flex-col">
                              <span>{inc.emergencyType}</span>
                              <span className="text-[9px] text-gray-500 font-mono font-normal mt-0.5">{inc.date}</span>
                            </div>
                          </td>
                          <td className="p-3 text-[10.5px]">
                            <div className="flex items-center gap-1">
                              <span className="text-white font-semibold">{inc.route[0]}</span>
                              <ArrowRight className="w-3 h-3 text-gray-500" />
                              <span className="text-white font-semibold">{inc.route[inc.route.length - 1]}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400">-{inc.timeSaved}</td>
                          <td className="p-3 text-right">
                            <button className="bg-[#D9EF92]/10 hover:bg-[#D9EF92] text-[#D9EF92] hover:text-black hover:border-transparent font-semibold border border-[#D9EF92]/20 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all">
                              SELECT
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mission Statistics list */}
          <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3.5 select-none">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-1">
              Active Selection Metrics ({activeIncident.id})
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-black/40 border border-[#1F242E] p-3 rounded-lg flex flex-col">
                <span className="text-[9px] font-mono text-gray-500 uppercase">Average Speed</span>
                <strong className="text-white text-base mt-1 font-sans">{activeIncident.stats.avgSpeed} km/h</strong>
              </div>

              <div className="bg-black/40 border border-[#1F242E] p-3 rounded-lg flex flex-col">
                <span className="text-[9px] font-mono text-gray-500 uppercase">G-Force Peaks</span>
                <strong className="text-amber-400 text-base mt-1 font-sans">{activeIncident.stats.gForcePeaks} G</strong>
              </div>

              <div className="bg-black/40 border border-[#1F242E] p-3 rounded-lg flex flex-col">
                <span className="text-[9px] font-mono text-gray-500 uppercase">Patient Stability</span>
                <strong className="text-emerald-400 text-base mt-1 font-sans">{activeIncident.stats.patientStability}</strong>
              </div>

              <div className="bg-black/40 border border-[#1F242E] p-3 rounded-lg flex flex-col">
                <span className="text-[9px] font-mono text-gray-500 uppercase">Congestion Foiled</span>
                <strong className="text-[#D9EF92] text-base mt-1 font-sans">{activeIncident.stats.trafficDelaysFoilPct}%</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Replay Canvas with Timeline slider (6 cols) */}
        <div className="lg:col-span-6 bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Tv className="w-4 h-4 text-[#D9EF92]" />
              Simulation Replay Canvas ({activeIncident.id})
            </h3>
            <span className="text-[9px] font-mono text-gray-400 bg-[#0A0C11] border border-[#1F242E] px-2 py-0.5 rounded">
              Route: {activeIncident.route.join(' ➔ ')}
            </span>
          </div>

          {/* Interactive Replay canvas */}
          <div className="bg-black border border-[#1F242E] rounded-xl h-[330px] relative overflow-hidden flex items-center justify-center select-none">
            
            {/* SVG Roads linking overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <g className="opacity-40">
                {/* Draw complete historical segments */}
                <line x1="20%" y1="35%" x2="48%" y2="28%" style={{ stroke: '#475569', strokeWidth: '3px' }} />
                <line x1="48%" y1="28%" x2="58%" y2="64%" style={{ stroke: '#475569', strokeWidth: '3px' }} />
                <line x1="58%" y1="64%" x2="82%" y2="44%" style={{ stroke: '#475569', strokeWidth: '3px' }} />
                <line x1="82%" y1="44%" x2="92%" y2="78%" style={{ stroke: '#475569', strokeWidth: '3px' }} />
                <line x1="20%" y1="35%" x2="10%" y2="72%" style={{ stroke: '#475569', strokeWidth: '3px' }} />
                <line x1="35%" y1="78%" x2="58%" y2="64%" style={{ stroke: '#475569', strokeWidth: '3px' }} />
              </g>
              
              {/* Highlight active route portion green */}
              {/* Draws highlight line along previous segment nodes */}
              <circle cx="20%" cy="35%" r="4" fill="#D9EF92" />
              <circle cx="92%" cy="78%" r="5" fill="#EF4444" />
            </svg>

            {/* Junction identifiers static overlay */}
            <div className="absolute left-[20%] top-[35%] transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono bg-black/90 text-gray-400 px-1.5 py-0.5 rounded border border-[#1F242E]">J1</div>
            <div className="absolute left-[48%] top-[28%] transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono bg-black/90 text-gray-400 px-1.5 py-0.5 rounded border border-[#1F242E]">J2</div>
            <div className="absolute left-[58%] top-[64%] transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono bg-black/90 text-gray-400 px-1.5 py-0.5 rounded border border-[#1F242E]">J3</div>
            <div className="absolute left-[82%] top-[44%] transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono bg-black/90 text-gray-400 px-1.5 py-0.5 rounded border border-[#1F242E]">J4</div>
            <div className="absolute left-[35%] top-[78%] transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono bg-black/90 text-gray-400 px-1.5 py-0.5 rounded border border-[#1F242E]">J5</div>
            <div className="absolute left-[92%] top-[78%] transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono bg-red-950 text-red-200 px-1.5 py-0.5 rounded border border-red-500/30">H1</div>

            {/* Animated Ambulance avatar moving based on slider progress */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none"
              style={{ left: `${ambulanceReplayCoords.x}%`, top: `${ambulanceReplayCoords.y}%` }}
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-red-600 shadow-xl border border-white text-white">
                <Navigation className="w-4 h-4 rotate-90" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9EF92] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D9EF92]"></span>
                </span>
              </div>
              <span className="mt-1 bg-black text-[#D9EF92] border border-[#1F242E] px-1.5 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap">
                REPLAY BUS (GPS)
              </span>
            </div>

            {/* Approaching node alert overlay */}
            <div className="absolute bottom-3 left-3 bg-[#0A0C11]/90 border border-[#1F242E] px-3 py-1.5 rounded-lg text-left font-mono text-[10px]">
              <div className="text-gray-500">APPROACHING NODE:</div>
              <strong className="text-white">Junction {ambulanceReplayCoords.approachingNode}</strong>
              <div className="text-[#D9EF92] font-semibold mt-0.5">Automated signal cleared</div>
            </div>

          </div>

          {/* TIMELINE SLIDER AND TRIGGER CONTROLS */}
          <div className="bg-[#0A0C11] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3.5 text-left">
            
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Replay Progress Slider</span>
              <strong className="text-[#D9EF92]">{replayProgress}% Complete</strong>
            </div>

            <input 
              type="range"
              min="0"
              max="100"
              value={replayProgress}
              onChange={(e) => {
                setReplayProgress(parseInt(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full h-1.5 bg-[#1F242E] rounded-lg appearance-none cursor-pointer accent-[#D9EF92] focus:outline-none"
            />

            {/* Controller row button groups */}
            <div className="flex items-center gap-3 justify-between">
              
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-[#D9EF92] hover:bg-[#cbf544] text-black px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider cursor-pointer uppercase flex items-center gap-1.5 transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  {isPlaying ? 'PAUSE' : 'PLAY REPLAY'}
                </button>

                <button
                  onClick={() => {
                    setReplayProgress(0);
                    setIsPlaying(false);
                  }}
                  className="bg-[#1F242E] border border-[#1fa354]/10 text-gray-300 hover:text-white px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  title="Reset Replay"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[10px] font-mono text-gray-500">
                TIME ELAPSED: ~{Math.floor((replayProgress / 100) * 8)}m {Math.round((replayProgress % 20) * 3)}s
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
