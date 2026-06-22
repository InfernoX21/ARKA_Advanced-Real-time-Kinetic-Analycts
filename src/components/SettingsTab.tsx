import React, { useState } from 'react';
import { 
  Settings, 
  Sliders, 
  Radio, 
  Cpu, 
  FileLock2, 
  RefreshCcw, 
  Sparkles,
  Info,
  CheckCircle,
  HelpCircle,
  Wifi,
  Database,
  Save
} from 'lucide-react';

interface SettingsTabProps {
  onResetSimulation: () => void;
  simulationSpeed: number;
  setSimulationSpeed: (val: number) => void;
}

export default function SettingsTab({
  onResetSimulation,
  simulationSpeed,
  setSimulationSpeed
}: SettingsTabProps) {

  // Form State
  const [algoEngine, setAlgoEngine] = useState<'Fuzzy V2X' | 'Dijkstra' | 'A* Heuristic'>('Fuzzy V2X');
  const [sliceSecurityMode, setSliceSecurityMode] = useState<string>('AES-256 GCM');
  const [topSpeedCap, setTopSpeedCap] = useState<number>(90);
  const [signalOverrideWindow, setSignalOverrideWindow] = useState<number>(35);
  const [priorityCritical, setPriorityCritical] = useState<number>(100);
  const [priorityStandard, setPriorityStandard] = useState<number>(75);
  
  // States representing interactive popups/notifiers
  const [showSaveNotice, setShowSaveNotice] = useState(false);

  const handleSaveCalibration = () => {
    setShowSaveNotice(true);
    setTimeout(() => {
      setShowSaveNotice(false);
    }, 2800);
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl">
      
      {/* Header Info */}
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Platform System Settings & V2X Calibration</h2>
        <p className="text-xs text-gray-400">
          Configure shortest-route algorithms, adjust ambulance maximum travel speeds, modify 5G slicing protocols, and reset baseline datasets.
        </p>
      </div>

      {showSaveNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 p-4 rounded-xl flex items-center justify-between text-xs font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>CALIBRATION COEFFICIENTS SAVED! V2X routing logic and 5G slices updated successfully.</span>
          </div>
        </div>
      )}

      {/* Grid: 2 columns layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Shortest path engine + coefficients sliders */}
        <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#D9EF92]" />
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
              V2X Core Optimization Algorithms
            </h3>
          </div>

          <p className="text-xs text-gray-400">
            Select the dynamic heuristic engine responsible for calculating active corridor intersections.
          </p>

          <div className="flex bg-[#0A0C11] p-1 rounded-lg border border-[#1F242E] gap-1 self-start">
            {['Fuzzy V2X', 'Dijkstra', 'A* Heuristic'].map((engine) => (
              <button
                key={engine}
                onClick={() => setAlgoEngine(engine as any)}
                className={`px-3 py-1 text-[10px] font-bold font-mono rounded cursor-pointer transition-colors ${
                  algoEngine === engine ? 'bg-[#D9EF92] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {engine.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="h-px bg-[#1F242E]/75" />

          {/* Sliders for Simulation Coefficients */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-1">
              Ambulance Transit Coefficients
            </span>

            {/* Top Speed cap slider */}
            <div className="flex flex-col gap-2 bg-[#0A0C11] p-3 rounded-lg border border-[#1F242E]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Max Top Speed Cap (Emergency)</span>
                <strong className="text-[#D9EF92]">{topSpeedCap} km/h</strong>
              </div>
              <input
                type="range"
                min="50"
                max="120"
                value={topSpeedCap}
                onChange={(e) => setTopSpeedCap(parseInt(e.target.value))}
                className="w-full h-1 bg-[#1F242E] rounded-lg appearance-none cursor-pointer accent-[#D9EF92]"
              />
            </div>

            {/* Pre-emption window length */}
            <div className="flex flex-col gap-2 bg-[#0A0C11] p-3 rounded-lg border border-[#1F242E]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Pre-emption Phase Windows length</span>
                <strong className="text-[#D9EF92]">{signalOverrideWindow} Seconds</strong>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                value={signalOverrideWindow}
                onChange={(e) => setSignalOverrideWindow(parseInt(e.target.value))}
                className="w-full h-1 bg-[#1F242E] rounded-lg appearance-none cursor-pointer accent-[#D9EF92]"
              />
            </div>

            {/* Simulation speed multiplier */}
            <div className="flex flex-col gap-2 bg-[#0A0C11] p-3 rounded-lg border border-[#1F242E]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Digital Twin Sim Ticker Rate</span>
                <strong className="text-[#D9EF92]">{simulationSpeed}x Multiplier</strong>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                className="w-full h-1 bg-[#1F242E] rounded-lg appearance-none cursor-pointer accent-[#D9EF92]"
              />
            </div>
          </div>

        </div>

        {/* 5G slicing security + prioritization weights */}
        <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-5">
          
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#D9EF92]" />
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
              5G Slice Encryption & Priorities
            </h3>
          </div>

          <p className="text-xs text-gray-400">
            Define security keyhanding protocols and prioritization weights based on severity triggers.
          </p>

          <div className="bg-[#0A0C11] p-3 border border-[#1F242E] rounded-lg flex flex-col gap-1.5 text-xs font-mono">
            <span className="text-gray-500 uppercase text-[9px]">Slice security algorithms</span>
            <select
              value={sliceSecurityMode}
              onChange={(e) => setSliceSecurityMode(e.target.value)}
              className="bg-black text-[11px] text-white border border-[#1F242E] p-2 focus:outline-none focus:border-[#D9EF92] rounded cursor-pointer uppercase"
            >
              <option value="AES-256 GCM">AES-256 GCM (SLA high security)</option>
              <option value="CHACHA20-POLY1305">ChaCha20-Poly1305 (Low latency)</option>
              <option value="5G-AKA TLS 1.3">5G-AKA (Standard cellular bearer)</option>
            </select>
          </div>

          <div className="h-px bg-[#1F242E]/75" />

          {/* Slider Weights */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-1">
              Priority Weightings Coefficient
            </span>

            {/* Critical weight */}
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Critical Incident Trigger Priority</span>
                <strong className="text-red-400">{priorityCritical}%</strong>
              </div>
              <div className="h-3 bg-black rounded overflow-hidden p-0.5 border border-[#1F242E]">
                <div className="h-full rounded bg-red-600" style={{ width: `${priorityCritical}%` }} />
              </div>
            </div>

            {/* Standard weight */}
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Standard Incident Trigger Priority</span>
                <strong className="text-[#D9EF92]">{priorityStandard}%</strong>
              </div>
              <div className="h-3 bg-black rounded overflow-hidden p-0.5 border border-[#1F242E]">
                <div className="h-full rounded bg-[#D9EF92]" style={{ width: `${priorityStandard}%` }} />
              </div>
            </div>
          </div>

          {/* Reset simulation parameters */}
          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-center justify-between mt-1">
            <div className="flex flex-col gap-0.5 select-none text-left">
              <strong className="text-sm font-sans font-extrabold text-white">RESET DIGITAL TWIN DATA</strong>
              <span className="text-[10px] text-red-200 leading-normal">Repopulate initial grid states and clear logging trails.</span>
            </div>
            
            <button
              onClick={() => {
                onResetSimulation();
                alert('All data reset to defaults.');
              }}
              className="bg-red-600 hover:bg-red-700 text-white border border-red-500/20 py-2 px-3 text-[10.5px] font-extrabold font-mono rounded cursor-pointer uppercase flex items-center gap-1.5 transition-colors shrink-0"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Reset Data
            </button>
          </div>

        </div>

      </div>

      {/* Footer trigger */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={handleSaveCalibration}
          className="bg-[#D9EF92] hover:bg-[#cbf44c] text-black px-6 py-2.5 text-xs font-bold font-mono rounded-lg cursor-pointer uppercase flex items-center gap-1.5 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Platform Calibration Config
        </button>
      </div>

    </div>
  );
}
