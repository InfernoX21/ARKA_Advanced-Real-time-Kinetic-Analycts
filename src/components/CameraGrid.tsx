import React, { useState } from 'react';
import { 
  Camera, 
  Tv, 
  Cpu, 
  AlertTriangle, 
  Activity, 
  Database,
  Navigation,
  CheckCircle,
  X,
  Gauge,
  ArrowRight,
  TrendingUp,
  Sliders,
  Radio
} from 'lucide-react';
import { Junction, DigitalTwinVehicle } from '../types';

interface CameraGridProps {
  activeJunctionId: string | null;
  onSelectJunction: (id: string | null) => void;
  detectedVehicles: DigitalTwinVehicle[];
  activeVehicleId: string | null;
  onSelectVehicle: (id: string | null) => void;
  junctions: Junction[];
}

export default function CameraGrid({
  activeJunctionId,
  onSelectJunction,
  detectedVehicles,
  activeVehicleId,
  onSelectVehicle,
  junctions
}: CameraGridProps) {
  const [activeCamFilter, setActiveCamFilter] = useState<string>('ALL');
  const [expandedCamId, setExpandedCamId] = useState<string | null>(null);

  // Hardcoded coordinate zones & camera listings matching GIS Node placements
  const CAMERAS_META = [
    { id: 'CAM-CS', name: 'CRP Square Cam Feed', junctionId: 'CS', fps: 30, fov: '84° // NH-16 NW' },
    { id: 'CAM-JV', name: 'Jaydev Vihar Square CAM-1', junctionId: 'JV', fps: 30, fov: '90° // Biju Patnaik Rd' },
    { id: 'CAM-AV', name: 'Acharya Vihar Overpass CAM-2', junctionId: 'AV', fps: 30, fov: '110° // Sainik School Rd' },
    { id: 'CAM-VV', name: 'Vani Vihar Square CAM-3', junctionId: 'VV', fps: 24, fov: '78° // Utkal Univ Gate' },
    { id: 'CAM-RS', name: 'Rasulgarh NH-16 Cam', junctionId: 'RS', fps: 30, fov: '95° // Cuttack Link' }
  ];

  const getFilteredCams = () => {
    if (activeCamFilter === 'ALL') {
      return CAMERAS_META;
    }
    return CAMERAS_META.filter(c => c.id === activeCamFilter);
  };

  const getVehicleSize = (type: string) => {
    switch (type) {
      case 'Ambulance': return { width: 44, height: 26 };
      case 'Bus': return { width: 48, height: 28 };
      case 'Truck': return { width: 46, height: 26 };
      case 'Car': return { width: 34, height: 20 };
      default: return { width: 18, height: 14 }; // Motorcycle or default
    }
  };

  // Find camera object for modal details
  const activeExpandedCam = CAMERAS_META.find(c => c.id === expandedCamId);
  const activeExpandedJunction = junctions.find(j => j?.id === activeExpandedCam?.junctionId);
  const activeExpandedVehicles = detectedVehicles.filter(v => v.cameraId === expandedCamId);

  return (
    <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 select-none h-full shadow-2xl relative overflow-hidden">
      
      {/* Decorative backdrop mesh glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#D9EF92]/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#1F242E] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] font-mono text-red-400 font-bold tracking-widest uppercase">LIVE SENSORS</span>
          </div>
          <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
            YOLOv11 5G EDGE MONITORS
          </h3>
        </div>
        
        {/* Filters Panel Selector */}
        <div className="flex items-center gap-1 bg-[#0A0C11] border border-[#1F242E] p-1 rounded-lg">
          <button
            onClick={() => setActiveCamFilter('ALL')}
            className={`px-2 py-0.5 text-[9px] font-mono rounded cursor-pointer transition-colors ${
              activeCamFilter === 'ALL' 
                ? 'bg-[#D9EF92] text-black font-semibold' 
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            ALL
          </button>
          {CAMERAS_META.map(cam => (
            <button
              key={cam.id}
              onClick={() => setActiveCamFilter(cam.id)}
              className={`px-2 py-0.5 text-[9px] font-mono rounded cursor-pointer transition-colors ${
                activeCamFilter === cam.id 
                  ? 'bg-[#D9EF92] text-black font-semibold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              {cam.id.replace('CAM-', '')}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
        Decentralized V2X vision loops processed at Bhubaneswar edge base stations via high-speed hardware accelerators. Clicking cards expands feed matrices.
      </p>

      {/* Grid container */}
      <div className={`grid gap-4 mt-2 overflow-y-auto pr-0.5 max-h-[820px] ${
        activeCamFilter === 'ALL' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
      }`}>
        {getFilteredCams().map((cam) => {
          const objects = detectedVehicles.filter(v => v.cameraId === cam.id);
          const junction = junctions.find(j => j.id === cam.junctionId);
          const isJunctionActive = activeJunctionId === cam.junctionId;

          // Traffic Congestion Color matching
          let densityColor = 'text-emerald-400';
          let densityLabel = 'FREE';
          if (junction) {
            if (junction.density > 80) {
              densityColor = 'text-red-400 animate-pulse';
              densityLabel = 'G-LOCK';
            } else if (junction.density > 50) {
              densityColor = 'text-amber-400';
              densityLabel = 'MODERATE';
            }
          }

          return (
            <div 
              key={cam.id}
              onClick={() => setExpandedCamId(cam.id)}
              className={`relative border rounded-xl overflow-hidden bg-[#0A0C11] flex flex-col group cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:border-[#D9EF92]/60 hover:shadow-xl ${
                isJunctionActive ? 'border-[#D9EF92] shadow-lg shadow-[#D9EF92]/[0.02]' : 'border-[#1F242E]'
              }`}
            >
              {/* Dynamic Camera Feed Canvas */}
              <div className="relative h-44 bg-[#050608] border-b border-[#1F242E] overflow-hidden flex items-center justify-center">
                
                {/* Overlay Lens grid lines scanner display effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(217,239,146,0.02),rgba(0,0,0,0),rgba(217,239,146,0.02))] bg-[length:100%_4px,5px_100%] opacity-70 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 z-10 pointer-events-none" />

                {/* Camera Name & ID */}
                <div className="absolute top-2.5 left-3 z-20 flex flex-col gap-0.5 pointer-events-none">
                  <span className="text-[9.5px] font-bold text-white font-mono flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {cam.name}
                  </span>
                  <span className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest">
                    YOLOv11 CORE // CAPTURE RATE: {cam.fps} FPS
                  </span>
                </div>

                <div className="absolute top-2.5 right-3 z-20 font-mono text-[8px] text-gray-400 tracking-wider">
                  {cam.fov}
                </div>

                {/* Splicing overlay indicator when ambulance is currently in transit */}
                {objects.some(obj => obj.type === 'Ambulance') && (
                  <div className="absolute bottom-2.5 right-3 z-20 bg-red-600/90 border border-red-500 text-[8px] font-semibold font-mono text-white px-2 py-0.5 rounded animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    <span>OVERRIDE ACTIVATED</span>
                  </div>
                )}

                {/* Interactive Dynamic YOLOv11 bounding boxes */}
                {objects.map((obj) => {
                  const size = getVehicleSize(obj.type);
                  const isSelected = activeVehicleId === obj.id;

                  // Box borders based on categorization
                  let boxBorder = 'border-emerald-500 text-emerald-400 bg-emerald-500/5';
                  if (obj.type === 'Ambulance') {
                    boxBorder = 'border-red-500 text-red-400 bg-red-500/10 animate-pulse';
                  } else if (obj.type === 'Truck') {
                    boxBorder = 'border-amber-500 text-amber-400 bg-amber-500/5';
                  } else if (obj.type === 'Bus') {
                    boxBorder = 'border-sky-500 text-sky-400 bg-sky-500/5';
                  }

                  return (
                    <div
                      key={obj.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVehicle(obj.id);
                        onSelectJunction(cam.junctionId);
                      }}
                      className={`absolute border transition-all duration-300 cursor-crosshair select-none z-20 ${boxBorder} ${
                        isSelected ? 'ring-2 ring-[#D9EF92] border-white scale-105' : 'hover:scale-105 hover:border-white'
                      }`}
                      style={{
                        left: `${obj.x}%`,
                        top: `${obj.y}%`,
                        width: `${size.width}px`,
                        height: `${size.height}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {/* Bounding box header */}
                      <span className="absolute -top-3.5 left-0 text-[6.5px] font-mono font-bold uppercase tracking-wide bg-black/90 px-1 py-0.5 whitespace-nowrap rounded border border-[#111] leading-none">
                        {obj.id.split(' ')[0]} [{Math.round(obj.confidence)}%]
                      </span>

                      {/* Micro dot vector layout symbol */}
                      <div className="w-full h-full flex items-center justify-center pointer-events-none opacity-40 text-[8px]">
                        ★
                      </div>
                    </div>
                  );
                })}

                {/* Grid guidelines to reinforce command-center interface */}
                <div className="absolute w-full h-px bg-[#1F242E]/40 top-[40%] left-0" />
                <div className="absolute w-full h-px bg-dashed bg-gray-800/30 top-[60%] left-0" />

              </div>

              {/* Counter details bar */}
              <div className="p-3 bg-[#0F1116] flex items-center justify-between text-[10px] font-mono text-gray-400">
                <div className="flex items-center gap-1 text-gray-500 text-[9px]">
                  <Activity className="w-3 h-3 text-gray-600 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>D-TECT ENGINES</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>CARS: <strong className="text-white">{objects.filter(o => o.type==='Car').length}</strong></span>
                  <span>AMB: <strong className="text-[#D9EF92]">{objects.filter(o => o.type==='Ambulance').length}</strong></span>
                  <span>HEAVY: <strong className="text-white">{objects.filter(o => o.type==='Truck' || o.type==='Bus').length}</strong></span>
                  <span className={`${densityColor} font-bold bg-white/[0.02] border border-[#1F242E] px-1 rounded text-[9px]`}>
                    {densityLabel}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Expanded Camera Deep Telemetry Screen (Rich Modal overlay) */}
      {expandedCamId && activeExpandedCam && (
        <div className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-4 backdrop-blur-md transition-opacity duration-300">
          
          <div 
            className="bg-[#0A0C11] border border-[#1F242E] rounded-xl overflow-hidden w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#1F242E] bg-[#0F1115] flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 rounded bg-[#D9EF92]/10 border border-[#D9EF92]/30 text-[#D9EF92]">
                  <Camera className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{activeExpandedCam.name}</h4>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-normal">
                    ACTIVE 5G BROADCAST NODE: {activeExpandedCam.id} // JUNCTION LOC: {activeExpandedCam.junctionId}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setExpandedCamId(null)}
                className="p-1 px-2.5 rounded bg-[#10141D] hover:bg-white/[0.05] border border-[#1F242E] text-gray-400 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <span>CLOSE PANEL</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content row split: 60% Left Feed / 40% Right Data details table */}
            <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
              
              {/* Left Column: Enlarged interactive YOLOv11 viewport canvas (7 cols) */}
              <div className="md:col-span-7 border-r border-[#1F242E] flex flex-col">
                <div className="relative h-[360px] bg-black overflow-hidden flex items-center justify-center border-b border-[#1F242E]">
                  
                  {/* Scope scanlines design overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%),linear-gradient(90deg,rgba(0,255,255,0.03),rgba(255,0,0,0.01),rgba(0,255,0,0.03))] bg-[length:100%_4px,3px_100%] opacity-90 z-10 pointer-events-none" />
                  
                  {/* Diagnostic vector markers */}
                  <div className="absolute top-4 left-4 z-20 font-mono text-[9px] text-[#D9EF92] uppercase bg-black/85 p-2 rounded-md border border-[#1F242E]">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D9EF92] animate-ping" />
                      <span>HD STREAM TRK_5G: PASSENGERS=819 // LOSS=0.002%</span>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 z-20 font-mono text-[8px] text-gray-500 uppercase tracking-wider flex flex-col gap-0.5">
                    <span>COORDINATES FOCUS: {activeExpandedJunction?.lat.toFixed(6)}° N, {activeExpandedJunction?.lng.toFixed(6)}° E</span>
                    <span>WAVELET BANDWIDTH: V2X SENSORS ACTIVE [77GHZ RADAR]</span>
                  </div>

                  {/* Draw Vehicle Nodes */}
                  {activeExpandedVehicles.map((obj) => {
                    const size = getVehicleSize(obj.type);
                    const isSelected = activeVehicleId === obj.id;

                    let boxBorder = 'border-emerald-500 text-emerald-400 bg-emerald-500/10';
                    if (obj.type === 'Ambulance') {
                      boxBorder = 'border-red-500 text-red-500 bg-red-500/20 animate-pulse';
                    } else if (obj.type === 'Truck') {
                      boxBorder = 'border-amber-500 text-amber-500 bg-amber-500/10';
                    } else if (obj.type === 'Bus') {
                      boxBorder = 'border-sky-500 text-sky-400 bg-sky-500/10';
                    }

                    return (
                      <div
                        key={obj.id}
                        onClick={() => onSelectVehicle(obj.id)}
                        className={`absolute border transition-transform duration-100 cursor-crosshair select-none z-20 ${boxBorder} ${
                          isSelected ? 'ring-4 ring-[#D9EF92] border-white scale-110 shadow-2xl' : 'hover:scale-[1.03] hover:border-white'
                        }`}
                        style={{
                          left: `${obj.x}%`,
                          top: `${obj.y}%`,
                          width: `${size.width * 1.5}px`, // slightly larger on main feed
                          height: `${size.height * 1.5}px`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {/* Bounding box confidence header */}
                        <span className="absolute -top-4 left-0 text-[8px] font-mono font-bold uppercase tracking-widest bg-black px-1.5 py-0.5 whitespace-nowrap rounded border border-[#1F242E] leading-relaxed">
                          {obj.id} [{Math.round(obj.confidence)}%]
                        </span>

                        {/* Visual scanning lines inside expanded boxes */}
                        <div className="absolute inset-x-0 h-0.5 bg-current top-0 animate-bounce opacity-40" />

                        {/* Vector graphic center cross */}
                        <div className="w-full h-full flex items-center justify-center opacity-65 text-[10px] font-bold">
                          ⊹
                        </div>
                      </div>
                    );
                  })}

                  {/* Lane separators */}
                  <div className="absolute w-full h-px bg-[#1F242E] top-[45%] left-0" />
                  <div className="absolute w-full h-[2px] bg-dashed border-b border-dashed border-[#D9EF92]/20 top-[55%] left-0" />

                  {/* Overlay green priority route zone for ambulance pathing */}
                  {activeExpandedVehicles.some(v => v.type === 'Ambulance') && (
                    <div className="absolute inset-x-0 top-[46%] bottom-[44%] bg-[#D9EF92]/5 border-y border-dashed border-[#D9EF92]/30 animate-pulse z-0 pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] font-mono text-[#D9EF92] font-semibold tracking-widest">
                        GREEN CORRIDOR PRIORITY LANE ENGAGED
                      </span>
                    </div>
                  )}

                </div>

                {/* Auxiliary sensors bottom status card */}
                <div className="p-4 bg-[#0F1115] grid grid-cols-3 gap-4 font-mono text-left select-none">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase">CO2 Emission Index</span>
                    <strong className="text-white text-xs mt-0.5">1.24 lb/mi (Optimized)</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase">Passage Frequency</span>
                    <strong className="text-[#D9EF92] text-xs mt-0.5">38 vehicles / min</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase">Friction Coeff</span>
                    <strong className="text-white text-xs mt-0.5">0.82 dry roads</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Telemetry tables, junctions states, target monitors (5 cols) */}
              <div className="md:col-span-5 p-5 flex flex-col gap-5 text-left select-none bg-[#090B0F]">
                
                {/* Section title */}
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#D9EF92]" />
                  <h5 className="text-[10px] font-sans font-bold text-white uppercase tracking-widest">
                    SYSTEM STATUS TELEMETRY INDICES
                  </h5>
                </div>

                {/* Physical stats container */}
                <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#222]">
                    <span className="text-gray-400">Junction Identity:</span>
                    <strong className="text-white">{activeExpandedJunction?.name || activeExpandedCam.junctionId}</strong>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#222]">
                    <span className="text-gray-400">Current Phase:</span>
                    <strong className={`${activeExpandedJunction?.phase === 'Emergency Override' ? 'text-red-400 font-bold animate-pulse' : 'text-white'}`}>
                      {activeExpandedJunction?.phase || 'N-S Bound'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#222]">
                    <span className="text-gray-400">Lamps override countdown:</span>
                    <strong className="text-white">{activeExpandedJunction?.waitSec || 0}s remaining</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Traffic Density cell:</span>
                    <strong className={`flex items-center gap-1 font-sans ${
                      activeExpandedJunction?.density && activeExpandedJunction.density > 80 ? 'text-red-400' : 'text-[#D9EF92]'
                    }`}>
                      <TrendingUp className="w-3.5 h-3.5 text-current animate-bounce" />
                      {activeExpandedJunction?.density || 15}% capacity
                    </strong>
                  </div>
                </div>

                {/* Overridden Light State Visualizer */}
                <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex items-center justify-between font-mono">
                  <div className="flex flex-col text-left gap-0.5">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">NEAREST V2X TRAFFIC SIGNAL</span>
                    {activeExpandedJunction?.phase === 'Emergency Override' ? (
                      <em className="text-red-400 text-xs font-bold uppercase not-italic animate-pulse">EMERGENCY WAVELENGTH ACTIVE</em>
                    ) : (
                      <span className="text-gray-500 text-xs">MONITORING NOMINAL FLOW</span>
                    )}
                  </div>
                  <div className="flex gap-1 bg-black p-1.5 rounded-lg border border-[#1F242E]">
                    <div className={`h-4 w-4 rounded-full ${activeExpandedJunction?.status === 'OVERRIDE' || activeExpandedJunction?.status === 'RED' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-red-950'}`} />
                    <div className="h-4 w-4 rounded-full bg-yellow-950" />
                    <div className={`h-4 w-4 rounded-full ${activeExpandedJunction?.status === 'GREEN' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : activeExpandedJunction?.status === 'OVERRIDE' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-emerald-950'}`} />
                  </div>
                </div>

                {/* Subtitle list of targets */}
                <div className="flex items-center justify-between border-t border-[#1F242E] pt-4 mt-1">
                  <span className="text-[10px] font-sans font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#D9EF92]" />
                    <span>Edge Bounding Target Boxes ({activeExpandedVehicles.length})</span>
                  </span>
                  <span className="text-[9px] font-mono text-gray-500">SORT BY POSITION</span>
                </div>

                {/* Scrollable grid of real-time targets */}
                <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                  {activeExpandedVehicles.length > 0 ? (
                    activeExpandedVehicles.map(v => {
                      const isSelected = activeVehicleId === v.id;
                      return (
                        <div 
                          key={v.id}
                          onClick={() => onSelectVehicle(v.id)}
                          className={`bg-[#0F1115] border p-2 px-3 rounded-lg flex items-center justify-between font-mono text-[10.5px] transition-all cursor-crosshair ${
                            isSelected ? 'border-[#D9EF92] bg-[#D9EF92]/[0.02] text-white' : 'border-[#1F242E] text-gray-300 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              v.type === 'Ambulance' ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                            }`} />
                            <strong className="text-white">{v.id}</strong>
                            <span className="text-[9px] text-gray-500 uppercase bg-black px-1.5 py-0.2 rounded border border-[#222]">
                              {v.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Gauge className="w-3.5 h-3.5 text-gray-500" />
                              {v.speed} km/h
                            </span>
                            <span className="text-gray-500 uppercase text-[9px] flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-gray-600 rotate-45" />
                              {v.direction.substring(0, 5)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-[10px] font-mono text-gray-500 uppercase">
                      No active targets currently within this camera sector cone.
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
