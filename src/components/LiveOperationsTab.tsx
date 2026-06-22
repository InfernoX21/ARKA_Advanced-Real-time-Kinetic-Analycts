import React from 'react';
import { 
  Compass, 
  Info,
  ShieldAlert,
  Navigation,
  Clock,
  Radio,
  FileText,
  Activity,
  User,
  HeartPulse,
  Signal
} from 'lucide-react';
import { Junction, RoadSegment, Hospital, Ambulance, LogEvent, DigitalTwinVehicle } from '../types';
import GisMap from './GisMap';
import QuickControls from './QuickControls';
import SignalCoordination from './SignalCoordination';
import CameraGrid from './CameraGrid';

interface LiveOperationsTabProps {
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
  simulationTicking: boolean;
  setSimulationTicking: (val: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (val: number) => void;
  onDispatchAmbulance: () => void;
  onResetSimulation: () => void;
  onForceCongestion: () => void;
  onClearLogs: () => void;
  // Dynamic synchronized vehicle twin values
  detectedVehicles: DigitalTwinVehicle[];
  activeVehicleId: string | null;
  onSelectVehicle: (id: string | null) => void;
}

export default function LiveOperationsTab({
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
  setLayers,
  simulationTicking,
  setSimulationTicking,
  simulationSpeed,
  setSimulationSpeed,
  onDispatchAmbulance,
  onResetSimulation,
  onForceCongestion,
  onClearLogs,
  detectedVehicles,
  activeVehicleId,
  onSelectVehicle
}: LiveOperationsTabProps) {

  const currentAmbulance = ambulances.find(a => a.id === activeAmbulanceId) || ambulances.find(a => a.id === 'A-102') || null;

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Upper Tactical Map Canvas + Right Sidebar control panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: 70% Map canvas block */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-sans font-bold text-white tracking-tight uppercase flex items-center gap-2">
                <span>Tactical V2X Traffic Flow Canvas</span>
                <span className="text-[10px] font-mono font-normal tracking-widest text-[#D9EF92] bg-[#D9EF92]/10 border border-[#D9EF92]/20 px-2.5 py-0.5 rounded uppercase animate-pulse">
                  5G Slice Engaged
                </span>
              </h2>
              <span className="text-xs text-gray-400">
                Live 5G slice triggers instant emergency overrides at intersection junctions. Click node signal markers to zoom.
              </span>
            </div>
          </div>

          <div className="h-[480px]">
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
              onOpenFeed={onSelectJunction}
              simulationTicking={simulationTicking}
              detectedVehicles={detectedVehicles}
              activeVehicleId={activeVehicleId}
              onSelectVehicle={onSelectVehicle}
            />
          </div>
        </div>

        {/* Right Column: 30% Control Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* HUD PANEL: Active Emergency Mission Details */}
          <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 text-left select-none shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#D9EF92]" />
                <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">Active Mission HUD</h3>
              </div>
              <span className="text-[8px] font-mono text-[#D9EF92] border border-[#D9EF92]/20 bg-[#D9EF92]/5 px-2 py-0.5 rounded uppercase font-semibold animate-pulse">
                SYNCED TELEMETRY
              </span>
            </div>

            <div className="h-px bg-[#1F242E]" />

            {currentAmbulance && (currentAmbulance.status === 'Green Corridor Active' || currentAmbulance.status === 'Dispatched' || currentAmbulance.status === 'En Route') ? (
              <div className="flex flex-col gap-4">
                
                {/* Emergency details Grid */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#1F242E]/70 font-mono text-[10.5px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 text-[9px] uppercase">Incident ID</span>
                    <strong className="text-white text-xs">{currentAmbulance.id === 'A-102' ? 'INC-809' : 'INC-492'}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 text-[9px] uppercase">Emergency Severity</span>
                    <strong className="text-red-400 text-xs flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                      {currentAmbulance.priorityLevel}
                    </strong>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 text-[9px] uppercase">Assigned Unit</span>
                    <span className="text-white font-semibold">{currentAmbulance.name}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 text-[9px] uppercase">Paramedic Duty</span>
                    <span className="text-white font-semibold">{currentAmbulance.driver}</span>
                  </div>
                </div>

                {/* Route statistics */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Current GPS Speed:</span>
                    <span className="text-[#D9EF92] font-mono font-bold text-sm">{Math.round(currentAmbulance.speed)} km/h</span>
                  </div>

                  {/* Visual Stepper */}
                  <div className="bg-[#0A0C11] p-3 border border-[#1F242E] rounded-xl flex flex-col gap-2">
                    <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wider">CORRIDOR COORDINATION FLOW</span>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-white mt-1">
                      {currentAmbulance.route.map((node, idx) => {
                        const isPassed = idx < currentAmbulance.routeIndex;
                        const isActive = idx === currentAmbulance.routeIndex;
                        const isHospitalNode = idx === currentAmbulance.route.length - 1;
                        return (
                          <div key={node} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`h-1.5 w-full rounded ${
                              isPassed ? 'bg-emerald-500' : isActive ? 'bg-[#D9EF92] animate-pulse' : 'bg-[#1F242E]'
                            }`} />
                            <span className={`text-[9px] ${isActive ? 'text-[#D9EF92] font-bold' : isPassed ? 'text-emerald-500' : 'text-gray-500'}`}>
                              {node}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-[#0A0C11] p-2 rounded border border-[#1F242E]">
                      <span className="text-gray-500 block uppercase text-[8px]">ETA General</span>
                      <span className="text-[#D9EF92] font-semibold text-xs mt-0.5 block">
                        {Math.floor(currentAmbulance.etaToHospital / 60)}m {currentAmbulance.etaToHospital % 60}s
                      </span>
                    </div>
                    <div className="bg-[#0A0C11] p-2 rounded border border-[#1F242E]">
                      <span className="text-gray-500 block uppercase text-[8px]">Network Status</span>
                      <span className="text-emerald-400 font-semibold text-xs mt-0.5 block">
                        {currentAmbulance.networkStatus}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Info className="w-8 h-8 text-gray-600 stroke-1 animate-bounce mb-3" />
                <span className="text-xs font-semibold text-white">No active emergency vehicle en-route.</span>
                <p className="text-[10px] text-gray-500 font-mono mt-2 max-w-[210px] uppercase">
                  Click dispatch corridor trigger below to initiate real-time pre-emption wave.
                </p>
              </div>
            )}
          </div>

          {/* Quick simulator inputs */}
          <QuickControls 
            onDispatchAmbulance={onDispatchAmbulance}
            onResetSimulation={onResetSimulation}
            simulationTicking={simulationTicking}
            setSimulationTicking={setSimulationTicking}
            simulationSpeed={simulationSpeed}
            setSimulationSpeed={setSimulationSpeed}
            onTriggerTrafficGridlock={onForceCongestion}
            activeAmbulance={currentAmbulance}
          />

        </div>

      </div>

      {/* Signal status row and real-time live video camera inputs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* 5G Signal communication pre-emption flow (7 cols) */}
        <div className="xl:col-span-7">
          <SignalCoordination
            junctions={junctions}
            activeAmbulance={currentAmbulance}
          />
        </div>

        {/* Real-time cameras feed (5 cols) */}
        <div className="xl:col-span-5">
          <CameraGrid 
            activeJunctionId={activeJunctionId || 'J1'} 
            onSelectJunction={onSelectJunction}
            detectedVehicles={detectedVehicles}
            activeVehicleId={activeVehicleId}
            onSelectVehicle={onSelectVehicle}
            junctions={junctions}
          />
        </div>

      </div>

      {/* Bottom section: Real-time event log timeline audit trail */}
      <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl text-left select-none shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D9EF92]" />
            <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
              Smart-City Operations Live Event Log
            </h3>
          </div>
          <button
            onClick={onClearLogs}
            className="text-[10px] font-mono text-gray-400 hover:text-white transition-colors cursor-pointer border border-[#1F242E] px-2.5 py-1 rounded bg-[#0A0C11]"
          >
            CLEAR DISPATCH TIMELINE
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Audit telemetry trail. Event milestones log autonomously upon V2X sensor proximity triggers.
        </p>

        {/* Horizontal or Vertical audit list of logs */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { tag: '11:42', label: 'Ambulance Detected', desc: 'Siren acoustics + GPS ping trigger 5G slice.' },
            { tag: '11:43', label: 'Route Generated', desc: 'Optimum path: J1 ➔ J2 ➔ J3 ➔ J4 ➔ Hospital H1.' },
            { tag: '11:44', label: 'Junction B Cleared', desc: 'Standard queues pre-emptively drained.' },
            { tag: '11:45', label: 'Corridor Activated', desc: 'Green wave locked down via cell control.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#0A0C11] border border-[#1F242E] p-3 rounded-lg relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#D9EF92]">{item.tag}</span>
                <span className="text-[8px] font-mono text-gray-500">STAGE {idx + 1}</span>
              </div>
              <strong className="text-xs text-white uppercase font-sans mt-2">{item.label}</strong>
              <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
              <div className="absolute right-0 bottom-0 text-[32px] font-extrabold text-white/[0.01] leading-none select-none font-mono pointer-events-none">
                0{idx + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed audit logs */}
        <div className="bg-[#0A0C11] border border-[#1F242E] p-3.5 rounded-xl font-mono text-[10.5px] mt-4 max-h-[160px] overflow-y-auto flex flex-col gap-2">
          {logs.map((log) => (
            <div key={log.id} className="flex justify-between items-start gap-4 hover:bg-white/[0.01] p-1 rounded transition-colors">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  log.type === 'corridor' ? 'bg-[#D9EF92]' : log.type === 'success' ? 'bg-emerald-400' : 'bg-red-500'
                }`} />
                <span className="text-gray-300">{log.message}</span>
              </div>
              <span className="text-gray-500 shrink-0">{log.timestamp}</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
