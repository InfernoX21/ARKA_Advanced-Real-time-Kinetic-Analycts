import React from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  AlertOctagon, 
  RefreshCcw, 
  Radio, 
  Workflow
} from 'lucide-react';
import { Junction, Ambulance } from '../types';

interface SignalCoordinationProps {
  junctions: Junction[];
  activeAmbulance: Ambulance | null;
}

export default function SignalCoordination({
  junctions,
  activeAmbulance
}: SignalCoordinationProps) {
  
  // Arrange signals in order of the ambulance's corridor: e.g. FS -> JV -> AV
  const flowNodes = activeAmbulance 
    ? activeAmbulance.route.filter(nodeId => junctions.some(j => j.id === nodeId))
    : ['JV', 'AV', 'VV', 'RS'];

  const getSignalNodeDetails = (id: string) => {
    const j = junctions.find(item => item.id === id);
    if (!j) return null;

    // Determine coordination state based on ambulance progress
    let coordState: 'Preparing Corridor' | 'Clearing Queue' | 'Emergency Phase Active' | 'Corridor Released' = 'Corridor Released';
    let stateColor = 'text-gray-500 border-gray-800';
    let bgColor = 'bg-gray-950/20';

    if (activeAmbulance && activeAmbulance.status === 'Green Corridor Active') {
      const routeIdxOfNode = activeAmbulance.route.indexOf(id);
      const currentRouteIdx = activeAmbulance.routeIndex;

      if (routeIdxOfNode === currentRouteIdx) {
        coordState = 'Emergency Phase Active';
        stateColor = 'text-[#D9EF92] border-[#D9EF92]/30';
        bgColor = 'bg-[#D9EF92]/5';
      } else if (routeIdxOfNode === currentRouteIdx + 1) {
        coordState = 'Clearing Queue';
        stateColor = 'text-amber-400 border-amber-500/30';
        bgColor = 'bg-amber-500/5';
      } else if (routeIdxOfNode > currentRouteIdx + 1) {
        coordState = 'Preparing Corridor';
        stateColor = 'text-blue-400 border-blue-500/30';
        bgColor = 'bg-blue-500/5';
      } else {
        coordState = 'Corridor Released';
        stateColor = 'text-emerald-500 border-emerald-500/20';
        bgColor = 'bg-emerald-500/5';
      }
    } else {
      // Idle state
      coordState = 'Corridor Released';
      stateColor = 'text-gray-500 border-[#1F242E]';
      bgColor = 'bg-transparent';
    }

    // Clearance and ETA simulation
    let clearanceTime = 0;
    let ambulanceEta = '---';

    if (activeAmbulance) {
      const targetIdx = activeAmbulance.route.indexOf(id);
      const currentIdx = activeAmbulance.routeIndex;
      
      if (targetIdx !== -1) {
        if (targetIdx === currentIdx) {
          clearanceTime = 0;
          ambulanceEta = 'HERE';
        } else if (targetIdx > currentIdx) {
          // simple synthetic ETA based on distance
          const diff = targetIdx - currentIdx;
          const etaSec = diff * 22 - Math.round(activeAmbulance.progress * 22);
          clearanceTime = Math.max(0, etaSec - 6);
          ambulanceEta = `${etaSec}s`;
        } else {
          clearanceTime = 0;
          ambulanceEta = 'PASSED';
        }
      }
    }

    return {
      id,
      name: j.name.split(' - ')[0],
      queue: j.queueLength,
      density: j.density,
      coordState,
      stateColor,
      bgColor,
      clearanceTime,
      ambulanceEta
    };
  };

  const activeNodes = flowNodes.map(id => getSignalNodeDetails(id)).filter(Boolean);

  return (
    <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 select-none h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-[#D9EF92]" />
          <h3 className="font-sans font-bold text-sm text-white tracking-wider uppercase">
            5G Signal-to-Signal Coordination Center
          </h3>
        </div>
        <div className="flex items-center gap-1.5 bg-[#D9EF92]/5 border border-[#D9EF92]/20 px-2.5 py-1 rounded-full">
          <Radio className="w-3 h-3 text-[#D9EF92] animate-pulse" />
          <span className="font-mono text-[9px] text-[#D9EF92] tracking-wider uppercase font-semibold">
            V2X INTER-SIGNAL TUNNEL ACTIVE
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Active 5G-Slicing network automates peer-to-peer queue clearance alerts and wave scheduling protocols.
      </p>

      {/* Coordination Flow Horizontal Chain */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-1 relative">
        {activeNodes.map((node, idx) => {
          if (!node) return null;
          return (
            <div key={node.id} className="relative flex flex-col">
              {/* Outer coordinated panel */}
              <div className={`border p-4 rounded-xl flex flex-col gap-2.5 transition-all duration-300 ${node.bgColor} ${node.stateColor}`}>
                
                {/* Header label */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">SIGNAL {node.id}</span>
                  <div className={`p-1 rounded-full ${
                    node.coordState === 'Emergency Phase Active' ? 'bg-[#D9EF92]/10 text-[#D9EF92]' :
                    node.coordState === 'Clearing Queue' ? 'bg-amber-500/10 text-amber-400' :
                    node.coordState === 'Preparing Corridor' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {node.coordState === 'Emergency Phase Active' ? <Zap className="w-3.5 h-3.5 animate-bounce" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Node Name */}
                <span className="text-xs font-sans font-bold text-white truncate">{node.name}</span>

                <div className="h-px bg-[#1F242E]/70" />

                {/* Splicing Telemetry Details */}
                <div className="grid grid-cols-2 gap-y-1 text-[10px] font-mono text-gray-400">
                  <span>Vehicles Enqueued:</span>
                  <span className="text-white text-right">{node.queue} Units</span>

                  <span>Peak Line Density:</span>
                  <span className="text-white text-right">{node.density}%</span>

                  <span>EMS Hub ETA:</span>
                  <span className="text-[#D9EF92] text-right font-bold">{node.ambulanceEta}</span>

                  <span>Clearance Target:</span>
                  <span className="text-white text-right">{node.clearanceTime}s</span>
                </div>

                {/* Splicing state progress status indicator indicator text */}
                <div className="mt-1 text-center py-1 rounded bg-[#0A0C11] border border-[#1F242E]">
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase truncate block">
                    {node.coordState}
                  </span>
                </div>

              </div>

              {/* Connecting Chevron pointing to next node */}
              {idx < activeNodes.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3.5 transform -translate-y-1/2 z-10 p-1 bg-[#10141D] border border-[#1F242E] rounded-full">
                  <ArrowRight className={`w-3.5 h-3.5 ${
                    node.coordState === 'Emergency Phase Active' ? 'text-[#D9EF92] animate-pulse' : 'text-gray-500'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
