import React, { useState, useMemo } from 'react';
import { 
  Route, 
  Settings, 
  Activity, 
  Signal, 
  TrendingUp, 
  ChevronRight, 
  RefreshCw, 
  Sliders, 
  Sparkles,
  Award,
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';
import { Junction, RoadSegment } from '../types';

interface TrafficNetworkProp {
  junctions: Junction[];
  roads: RoadSegment[];
}

export default function TrafficNetworkTab({ junctions, roads }: TrafficNetworkProp) {
  
  // Interactive Simulation variables
  const [propagationStep, setPropagationStep] = useState<number>(0);
  const [isSimulatingPropagation, setIsSimulatingPropagation] = useState(false);
  const [forecastHorizon, setForecastHorizon] = useState<15 | 30 | 60>(15);

  // Stats computed from junctions and roads
  const totalJunctions = junctions.length;
  const activeSignals = junctions.filter(j => j.status !== 'RED').length;
  const severeCongestionRoads = roads.filter(r => r.congestion === 'critical').length;
  const averageWaitTime = `${Math.round(junctions.reduce((acc, j) => acc + j.avgWaitTime, 0) / junctions.length)}s`;

  // AI predictions for 15m, 30m, 60m
  const predictions = useMemo(() => {
    return {
      15: [
        { name: 'J1 (Central Plaza)', status: 'Moderate', flow: '74%', queue: 24 },
        { name: 'J2 (Ring Expressway)', status: 'Free Flow', flow: '94%', queue: 10 },
        { name: 'J3 (Metro Interchange)', status: 'Severe Heat', flow: '41%', queue: 52 },
        { name: 'J4 (Innovation District)', status: 'Moderate', flow: '82%', queue: 19 }
      ],
      30: [
        { name: 'J1 (Central Plaza)', status: 'Severe Heat', flow: '48%', queue: 45 },
        { name: 'J2 (Ring Expressway)', status: 'Moderate', flow: '81%', queue: 26 },
        { name: 'J3 (Metro Interchange)', status: 'Critical Gridlock', flow: '18%', queue: 74 },
        { name: 'J4 (Innovation District)', status: 'Severe Heat', flow: '54%', queue: 38 }
      ],
      60: [
        { name: 'J1 (Central Plaza)', status: 'Free Flow', flow: '96%', queue: 8 },
        { name: 'J2 (Ring Expressway)', status: 'Free Flow', flow: '98%', queue: 4 },
        { name: 'J3 (Metro Interchange)', status: 'Moderate', flow: '78%', queue: 20 },
        { name: 'J4 (Innovation District)', status: 'Free Flow', flow: '95%', queue: 6 }
      ]
    }[forecastHorizon];
  }, [forecastHorizon]);

  // Congestion propagation model based on propagation step (0 to 3)
  const propagationModel = useMemo(() => {
    if (propagationStep === 0) {
      return {
        focusNode: 'J3',
        description: 'Baseline rush-hour density concentrated near Metro Interchange (J3). Primary overflow risk on Ring Expressway link (R2).',
        heatNodes: ['J3'],
        impactedLinks: ['R2']
      };
    } else if (propagationStep === 1) {
      return {
        focusNode: 'R2',
        description: 'Surge propagates northward. Ring Expressway link (R2) speed collapses to 14 km/h. Junction B queue accumulates rapidly.',
        heatNodes: ['J3', 'J2'],
        impactedLinks: ['R2', 'R1']
      };
    } else if (propagationStep === 2) {
      return {
        focusNode: 'J2',
        description: 'Junction B gridlocks (+140% wait times). Traffic backs up on Central Boulevard (R1) and metro overpass. Major peak saturation.',
        heatNodes: ['J3', 'J2', 'J1'],
        impactedLinks: ['R2', 'R1', 'R3']
      };
    } else {
      return {
        focusNode: 'J1',
        description: 'Systemic cascading gridlock. Sector 4 traffic flow collapses by 65%. Dynamic ARKA pre-emption required to sustain corridors.',
        heatNodes: ['J1', 'J2', 'J3', 'J4'],
        impactedLinks: ['R1', 'R2', 'R3', 'R6']
      };
    }
  }, [propagationStep]);

  // Play next step simulation
  const handleNextStep = () => {
    setPropagationStep(prev => (prev + 1) % 4);
  };

  // Congestion color translator
  const getCongestionColorObj = (congestion: string) => {
    switch (congestion) {
      case 'critical': return { bg: 'bg-red-500', text: 'text-red-400', stroke: '#EF4444' };
      case 'heavy': return { bg: 'bg-amber-500', text: 'text-amber-400', stroke: '#F59E0B' };
      case 'moderate': return { bg: 'bg-yellow-500', text: 'text-yellow-400', stroke: '#FBBF24' };
      default: return { bg: 'bg-green-500', text: 'text-green-400', stroke: '#10B981' };
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header Overview */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Traffic Infrastructure & Network Analytics</h2>
          <p className="text-xs text-gray-400">
            Real-time digital twin mapping signal delays, queue lengths, road link heatmaps, and prognostic projections.
          </p>
        </div>
      </div>

      {/* Top Counters Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Tracked Junctions</span>
          <div className="text-2xl font-bold text-white font-sans mt-1">{totalJunctions} Units</div>
          <span className="text-[9px] font-mono text-[#D9EF92]">100% 5G Node Connected</span>
        </div>
        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Active Signals</span>
          <div className="text-2xl font-bold text-[#D9EF92] font-sans mt-1">{activeSignals} Nodes</div>
          <span className="text-[9px] font-mono text-emerald-400">Dynamic phase control</span>
        </div>
        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Active Road Gridlocks</span>
          <div className="text-2xl font-bold text-red-400 font-sans mt-1">{severeCongestionRoads} Links</div>
          <span className="text-[8.5px] font-mono text-red-500">Delay Warning Active</span>
        </div>
        <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Average Node Wait</span>
          <div className="text-2xl font-bold text-white font-sans mt-1">{averageWaitTime}</div>
          <span className="text-[8.5px] font-mono text-emerald-400">▼ 21% Saved this hour</span>
        </div>
      </div>

      {/* Middle Section: Structural Graph vs AI prognosis panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left block (8 columns): Topological Map Graph Canvas */}
        <div className="lg:col-span-8 bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-[#D9EF92]" />
              <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
                V2X Infrastructure Topological Topology
              </h3>
            </div>
            <span className="text-[8px] font-mono font-bold tracking-widest text-[#D9EF92] bg-[#D9EF92]/10 border border-[#D9EF92]/20 px-2 py-0.5 rounded uppercase font-semibold">
              Heat Mode Active
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Render of signal intersections and connecting route nodes in Bhubaneswar. Colors indicate live queue accumulation.
          </p>

          {/* Topological Graph representation using SVG vector */}
          <div className="bg-black border border-[#1F242E] rounded-xl h-[340px] relative overflow-hidden flex items-center justify-center">
            
            {/* SVG Canvas overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
              </defs>
              
              {/* Draw road linkages heatmaps and direction arrows */}
              {roads.map((road) => {
                const nodeFrom = junctions.find(j => j.id === road.fromNode) || { x: 92, y: 78 };
                const nodeTo = junctions.find(j => j.id === road.toNode) || { x: 10, y: 72 };
                const flowColor = getCongestionColorObj(road.congestion);

                // Convert map percentage to SVG coordinates scaled to size
                // Map layout coordinates are 0-100%
                return (
                  <g key={road.id} className="opacity-95">
                    {/* Road background link */}
                    <line 
                      x1={`${nodeFrom.x}%`} 
                      y1={`${nodeFrom.y}%`} 
                      x2={`${nodeTo.x}%`} 
                      y2={`${nodeTo.y}%`} 
                      style={{ 
                        stroke: flowColor.stroke, 
                        strokeWidth: road.congestion === 'critical' ? '4px' : '2.5px',
                        strokeDasharray: road.congestion === 'critical' ? '4 2' : 'none' 
                      }} 
                    />
                    {/* Pulsing glow if critical */}
                    {road.congestion === 'critical' && (
                      <line 
                        x1={`${nodeFrom.x}%`} 
                        y1={`${nodeFrom.y}%`} 
                        x2={`${nodeTo.x}%`} 
                        y2={`${nodeTo.y}%`}
                        style={{ stroke: '#EF4444', strokeWidth: '10px', opacity: 0.15, strokeLinecap: 'round' }}
                        className="animate-pulse"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Junction Node Markers overlay */}
            {junctions.map((j) => {
              const isPropagationHeat = propagationModel.heatNodes.includes(j.id);
              return (
                <div 
                  key={j.id} 
                  className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none"
                  style={{ left: `${j.x}%`, top: `${j.y}%` }}
                >
                  <div 
                    className={`h-7 w-7 rounded-full flex items-center justify-center font-mono text-[9px] font-bold border transition-all duration-300 ${
                      isPropagationHeat ? 'border-red-500 bg-red-950/95 text-red-200 shadow-lg shadow-red-900/40 scale-110 animate-bounce' :
                      j.status === 'RED' ? 'border-red-500 text-red-400 bg-black/90' :
                      j.status === 'OVERRIDE' ? 'border-[#D9EF92] text-[#D9EF92] bg-emerald-950' :
                      'border-emerald-500 text-emerald-400 bg-black/90'
                    }`}
                  >
                    {j.id}
                  </div>
                  <span className="text-[8px] font-mono bg-black/80 text-gray-300 px-1.5 py-0.5 rounded border border-[#1F242E] whitespace-nowrap mt-1">
                    {j.name.split(' - ')[1]} ({j.density}%)
                  </span>
                </div>
              );
            })}

          </div>

          {/* Legends */}
          <div className="flex items-center gap-5 justify-center font-mono text-[10px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-green-500 rounded" />
              <span>Free Flow (&lt;25 km/h limit)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-yellow-500 rounded" />
              <span>Moderate delay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-amber-500 rounded" />
              <span>Heavy congestion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-red-500 rounded" style={{ borderBottom: '1px dashed #EF4444' }} />
              <span>Severe gridlock warning</span>
            </div>
          </div>

        </div>

        {/* Right column: 4 columns for AI Predictions and congestion propagation simulation */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* AI TRAFFIC FORECAST CARD */}
          <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D9EF92]" />
              <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">AI Traffic Forecast Panel</h3>
            </div>
            <p className="text-[10px] text-gray-400">
              Prognostic predictions estimating average delays and lane density ahead of schedule.
            </p>

            {/* Select Predict Horizon */}
            <div className="flex bg-[#0A0C11] p-1 rounded-lg border border-[#1F242E] gap-1 self-start">
              {[15, 30, 60].map((t) => (
                <button
                  key={t}
                  onClick={() => setForecastHorizon(t as any)}
                  className={`px-3 py-1 text-[10px] font-bold font-mono rounded cursor-pointer transition-colors ${
                    forecastHorizon === t ? 'bg-[#D9EF92] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  +{t} MIN
                </button>
              ))}
            </div>

            {/* Prediction list */}
            <div className="flex flex-col gap-2.5 mt-1 font-mono text-[11px]">
              {predictions.map((p, idx) => (
                <div key={idx} className="bg-[#0A0C11] p-3 rounded-lg border border-[#1F242E] flex justify-between items-center text-left">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{p.name}</span>
                    <span className={`text-[9px] mt-0.5 ${
                      p.status.includes('Critical') || p.status.includes('Severe') ? 'text-red-400 font-bold' : 'text-gray-400'
                    }`}>
                      Estimate: {p.status}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[#D9EF92]">{p.flow} Capacity</span>
                    <span className="text-gray-500 text-[9px] mt-0.5">{p.queue} enqueued</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CONGESTION PROPAGATION SIMULATOR PANEL */}
          <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">Cascading Congestion Model</h3>
            </div>
            
            <p className="text-[10.5px] text-gray-400 leading-relaxed font-sans">
              Play step-by-step systemic congestion cascade projections starting from central junctions.
            </p>

            {/* Model stats block */}
            <div className="bg-[#1A1112] p-3 border border-red-500/20 rounded-lg text-left">
              <div className="flex items-center justify-between text-[10px] font-mono text-red-400 font-bold">
                <span>SIMULATED SECTOR COLLAPSE</span>
                <span>STEP {propagationStep + 1} / 4</span>
              </div>
              <strong className="text-xs text-white uppercase font-sans mt-1.5 block">Focus: Node {propagationModel.focusNode}</strong>
              <p className="text-[10.5px] text-red-200/90 leading-relaxed mt-1">{propagationModel.description}</p>
            </div>

            {/* Simulation triggers */}
            <div className="flex gap-2.5">
              <button
                onClick={handleNextStep}
                className="flex-1 bg-[#1F242E] hover:bg-[#D9EF92] hover:text-black border border-[#1F242E] text-white py-2 text-xs font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase"
              >
                <Play className="w-3.5 h-3.5" />
                Trigger Next Step
              </button>
              
              <button
                onClick={() => setPropagationStep(0)}
                className="bg-[#0A0C11] border border-[#1F242E] text-gray-400 hover:text-white p-2 rounded-lg cursor-pointer transition-colors"
                title="Reset Propagation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
