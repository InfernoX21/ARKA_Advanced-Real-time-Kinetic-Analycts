import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  Zap, 
  TrafficCone,
  AlertOctagon,
  Gauge,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { Ambulance } from '../types';

interface QuickControlsProps {
  onDispatchAmbulance: () => void;
  onResetSimulation: () => void;
  simulationTicking: boolean;
  setSimulationTicking: (tick: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  onTriggerTrafficGridlock: () => void;
  activeAmbulance: Ambulance | null;
}

export default function QuickControls({
  onDispatchAmbulance,
  onResetSimulation,
  simulationTicking,
  setSimulationTicking,
  simulationSpeed,
  setSimulationSpeed,
  onTriggerTrafficGridlock,
  activeAmbulance
}: QuickControlsProps) {

  const isCorridorActive = activeAmbulance && (activeAmbulance.status === 'Green Corridor Active' || activeAmbulance.status === 'En Route');

  return (
    <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 select-none h-full">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-[#D9EF92]" />
        <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
          TACTICAL CONTROL & SIMULATOR CONSOLE
        </h3>
      </div>

      <p className="text-xs text-gray-400">
        Initiate tactical mock scenarios, control digital-twin ticker speed, or trigger peak hour congestion surges to test V2X system response.
      </p>

      {/* Simulator buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5 flex-1 justify-center">
        
        {/* Trigger corridor dispatch */}
        <button
          onClick={onDispatchAmbulance}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-mono text-xs font-bold uppercase transition-all tracking-wider cursor-pointer border ${
            isCorridorActive 
              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
              : 'bg-[#D9EF92] text-black hover:bg-[#c9df82] border-[#D9EF92]/20 shadow-md shadow-[#D9EF92]/10 active:scale-95'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{isCorridorActive ? 'EMS IN MOTION ➔ MONITOR' : 'INITIATE GREEN CORRIDOR'}</span>
        </button>

        {/* Reset */}
        <button
          onClick={onResetSimulation}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#10141E] border border-[#1F242E] text-gray-400 hover:text-white rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Simulation</span>
        </button>

      </div>

      {/* Splicing speeds and Tick Play/Pause */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 bg-[#0A0C11] p-3.5 border border-[#1F242E] rounded-xl">
        {/* Toggle play pause */}
        <div className="flex flex-col gap-1.5 justify-center">
          <span className="text-[10px] font-mono text-gray-500 uppercase">TELEMETRY SIMULATOR STATUS</span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSimulationTicking(!simulationTicking)}
              className={`p-2 rounded-lg cursor-pointer flex items-center justify-center transition-colors ${
                simulationTicking ? 'bg-[#D9EF92]/10 text-[#D9EF92] border border-[#D9EF92]/30' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {simulationTicking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex flex-col text-left">
              <span className="text-xs text-white font-bold font-sans">
                {simulationTicking ? 'SIMULATOR: SPEED ACTIVE' : 'SIMULATOR: PAUSED'}
              </span>
              <span className="text-[9px] font-mono text-gray-500">
                {simulationTicking ? 'Processing 50 V2X updates/sec' : 'Telemetry pipeline frozen'}
              </span>
            </div>
          </div>
        </div>

        {/* Speed Adjustment sliders */}
        <div className="flex flex-col gap-1.5 justify-center">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-gray-500 uppercase">MULTIPLIER: {simulationSpeed}X</span>
            <span className="text-[#D9EF92]">{Math.round(1000 / simulationSpeed)}ms refresh</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <Gauge className="w-4 h-4 text-gray-500" />
            <input 
              type="range"
              min="1"
              max="5"
              step="1"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
              className="flex-1 accent-[#D9EF92] h-1.5 bg-[#1F242E] rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Extra Grid gridlock simulator */}
      <div className="mt-1">
        <button
          onClick={onTriggerTrafficGridlock}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/5 bg-transparent rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer"
        >
          <TrafficCone className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>FORCE PEAK-HOUR TRAFFIC CONGESTION OVERLOAD</span>
        </button>
      </div>

    </div>
  );
}
