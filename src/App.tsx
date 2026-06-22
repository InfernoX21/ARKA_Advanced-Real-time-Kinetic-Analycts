import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import OverviewTab from './components/OverviewTab';
import LiveOperationsTab from './components/LiveOperationsTab';
import EmergencyVehiclesTab from './components/EmergencyVehiclesTab';
import TrafficNetworkTab from './components/TrafficNetworkTab';
import GisMapLayersTab from './components/GisMapLayersTab';
import GoldenHourAnalyticsTab from './components/GoldenHourAnalyticsTab';
import HistoricalEventsTab from './components/HistoricalEventsTab';
import HospitalStatusTab from './components/HospitalStatusTab';
import TrafficSignalsTab from './components/TrafficSignalsTab';
import SettingsTab from './components/SettingsTab';
import { 
  INITIAL_JUNCTIONS, 
  INITIAL_HOSPITALS, 
  INITIAL_ROADS, 
  INITIAL_AMBULANCES, 
  RECENT_LOGS, 
  CAMERAS,
  INITIAL_SIMULATED_VEHICLES
} from './data';
import { Junction, RoadSegment, Hospital, Ambulance, LogEvent, DigitalTwinVehicle } from './types';
import { Radio } from 'lucide-react';

export default function App() {
  // Master visual application state
  const [junctions, setJunctions] = useState<Junction[]>(INITIAL_JUNCTIONS);
  const [roads, setRoads] = useState<RoadSegment[]>(INITIAL_ROADS);
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(INITIAL_AMBULANCES);
  const [logs, setLogs] = useState<LogEvent[]>(RECENT_LOGS);
  
  // Real-time YOLO Camera Digital Twin Vehicles
  const [detectedVehicles, setDetectedVehicles] = useState<DigitalTwinVehicle[]>(INITIAL_SIMULATED_VEHICLES);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  // Selector state
  const [activeJunctionId, setActiveJunctionId] = useState<string | null>(null);
  const [activeAmbulanceId, setActiveAmbulanceId] = useState<string | null>('A-102');
  const [currentTab, setCurrentTab] = useState<string>('live-operations');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulator speed parameters
  const [simulationTicking, setSimulationTicking] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  // Layers state toggles
  const [layers, setLayers] = useState({
    ambulances: true,
    density: true,
    signals: true,
    hospitals: true,
    cameras: true,
    weather: false,
    accidents: true,
    constructions: false,
    corridors: true
  });

  // Coordinate resolver helper inside simulation interval context
  const EN_ROUTE_COORD_RESOLVER = (targetNodeId: string) => {
    const j = junctions.find(item => item.id === targetNodeId);
    if (j) return { x: j.x, y: j.y, lat: j.lat, lng: j.lng };
    const h = hospitals.find(item => item.id === targetNodeId);
    if (h) return { x: h.x, y: h.y, lat: h.lat, lng: h.lng };
    return { x: 50, y: 50, lat: 20.2961, lng: 85.8245 };
  };

  // Simulator interval tick effect
  useEffect(() => {
    if (!simulationTicking) return;

    const interval = setInterval(() => {
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

      // 1. First, compute next vehicle positions
      let nextVehiclesLocal: DigitalTwinVehicle[] = [];
      setDetectedVehicles(prevVehicles => {
        const pathA = ['CAM-CS', 'CAM-JV', 'CAM-AV', 'CAM-VV', 'CAM-RS'];
        const pathB = ['CAM-RS', 'CAM-VV', 'CAM-AV', 'CAM-JV', 'CAM-CS'];

        const updated = prevVehicles.map(v => {
          let speedFactor = (v.speed / 10) * simulationSpeed;
          let nextX = v.x + speedFactor;
          let nextCamId = v.cameraId;
          let updatedHistory = [...v.history];

          if (nextX > 100) {
            nextX = 0;
            if (v.direction === 'Eastbound') {
              const currentIdx = pathA.indexOf(v.cameraId);
              if (currentIdx !== -1 && currentIdx < pathA.length - 1) {
                nextCamId = pathA[currentIdx + 1];
                updatedHistory.push({
                  timestamp: currentTime,
                  camera: nextCamId,
                  event: `TRACKING TRANSFER: Handed over from ${v.cameraId} ➔ ${nextCamId}`
                });
                setLogs(prev => [
                  {
                    id: `TF-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${v.id.replace(/[^a-zA-Z0-9]/g, '')}`,
                    timestamp: currentTime,
                    message: `TRACKING HANDOVER: ${v.id} successfully transferred from ${v.cameraId} to ${nextCamId}.`,
                    type: 'prediction'
                  },
                  ...prev
                ]);
              } else {
                nextCamId = 'CAM-CS';
                updatedHistory.push({
                  timestamp: currentTime,
                  camera: nextCamId,
                  event: `LOOP RESET: Returned to CAM-CS`
                });
              }
            } else {
              const currentIdx = pathB.indexOf(v.cameraId);
              if (currentIdx !== -1 && currentIdx < pathB.length - 1) {
                nextCamId = pathB[currentIdx + 1];
                updatedHistory.push({
                  timestamp: currentTime,
                  camera: nextCamId,
                  event: `TRACKING TRANSFER: Handed over from ${v.cameraId} ➔ ${nextCamId}`
                });
                setLogs(prev => [
                  {
                    id: `TF-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${v.id.replace(/[^a-zA-Z0-9]/g, '')}`,
                    timestamp: currentTime,
                    message: `TRACKING HANDOVER: ${v.id} successfully transferred from ${v.cameraId} to ${nextCamId}.`,
                    type: 'prediction'
                  },
                  ...prev
                ]);
              } else {
                nextCamId = 'CAM-RS';
                updatedHistory.push({
                  timestamp: currentTime,
                  camera: nextCamId,
                  event: `LOOP RESET: Returned to CAM-RS`
                });
              }
            }
          }

          const jId = nextCamId.replace('CAM-', '');
          const jObj = junctions.find(item => item.id === jId);
          let nextLat = v.lat;
          let nextLng = v.lng;

          if (jObj) {
            const camLat = jObj.lat + 0.0016;
            const camLng = jObj.lng - 0.0014;
            const coverageAngle = jId === 'JV' ? 45 : jId === 'AV' ? 120 : jId === 'VV' ? 220 : 310;
            const angleRad = coverageAngle * Math.PI / 180;
            const pRadius = 0.0035;

            const sweepHalfWidthRad = 25 * Math.PI / 180;
            const vehicleAngle = angleRad - sweepHalfWidthRad + (nextX / 100) * (2 * sweepHalfWidthRad);
            const ratio = 0.15 + (v.y / 100) * 0.8;
            const vehicleDist = ratio * pRadius;

            nextLat = camLat + vehicleDist * Math.sin(vehicleAngle);
            nextLng = camLng + vehicleDist * Math.cos(vehicleAngle);
          }

          if (v.type === 'Ambulance' && nextCamId !== v.cameraId) {
            const jName = junctions.find(j => j.id === nextCamId.replace('CAM-', ''))?.name || nextCamId;
            setLogs(prev => [
              {
                id: `EAMB-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                timestamp: currentTime,
                message: `ALERT: Emergency vehicle detected at ${jName} (${nextCamId})! Traffic signal pre-emption active.`,
                type: 'alert'
              },
              ...prev
            ]);
          }

          return {
            ...v,
            x: nextX,
            cameraId: nextCamId,
            lat: nextLat,
            lng: nextLng,
            timestamp: currentTime,
            history: updatedHistory
          };
        });

        nextVehiclesLocal = updated;
        return updated;
      });

      // Simple container to pass local closure updates
      let nextVehArr = nextVehiclesLocal.length > 0 ? nextVehiclesLocal : INITIAL_SIMULATED_VEHICLES;

      // 2. Oscillate Junction wait timings and queue density, checking for pre-emption rules
      setJunctions(prevJuncs => 
        prevJuncs.map(j => {
          let updatedWait = j.waitSec - 1;
          let nextPhase = j.phase;
          let nextStatus = j.status;

          if (updatedWait <= 0) {
            updatedWait = Math.floor(Math.random() * 25) + 30;
            nextPhase = j.phase === 'N-S Bound' ? 'E-W Bound' : 'N-S Bound';
            nextStatus = j.status === 'GREEN' ? 'RED' : 'GREEN';
          }

          let forcedOverride = false;
          let isQueueClearing = false;
          let isActiveCorridor = false;

          // Check main active V2X corridors for A-102
          const activeAmb = ambulances.find(a => a.status === 'Green Corridor Active');
          if (activeAmb) {
            const nodeIdx = activeAmb.route.indexOf(j.id);
            const currentIdx = activeAmb.routeIndex;
            if (nodeIdx !== -1) {
              if (nodeIdx === currentIdx) {
                forcedOverride = true;
                isActiveCorridor = true;
              } else if (nodeIdx === currentIdx + 1) {
                forcedOverride = true;
                isQueueClearing = true;
              }
            }
          }

          // Check camera detected ambulances
          const camAmb = nextVehArr.find(v => v.type === 'Ambulance' && v.cameraId === `CAM-${j.id}`);
          if (camAmb) {
            forcedOverride = true;
            if (camAmb.x < 35) {
              isQueueClearing = true;
            } else {
              isActiveCorridor = true;
            }
          }

          let nextQueue = j.queueLength;
          if (!forcedOverride) {
            const flux = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            nextQueue = Math.max(2, j.queueLength + flux);
          } else {
            const drainRate = Math.floor(Math.random() * 3) + 2; 
            nextQueue = Math.max(0, j.queueLength - drainRate);
          }

          const nextDensity = Math.min(100, Math.max(5, Math.round((nextQueue / 50) * 100)));

          return {
            ...j,
            waitSec: updatedWait,
            phase: forcedOverride ? 'Emergency Override' : nextPhase,
            status: forcedOverride ? 'OVERRIDE' : nextStatus,
            queueLength: nextQueue,
            density: nextDensity
          };
        })
      );

      // 3. Drive Ambulances along pre-mapped V2X corridors
      setAmbulances(prevAmbs => 
        prevAmbs.map(amb => {
          if (amb.status === 'Green Corridor Active') {
            let nextProgress = amb.progress + 0.04 * simulationSpeed;
            let nextRouteIndex = amb.routeIndex;
            let nextStatus = amb.status;
            let nextSpeed = amb.speed;
            let nextEta = amb.etaToHospital;

            const fromNodeId = amb.route[nextRouteIndex];
            const toNodeId = amb.route[nextRouteIndex + 1];

            let fromCoords = { x: 50, y: 50, lat: 20.2961, lng: 85.8245 };
            let toCoords = { x: 50, y: 50, lat: 20.2961, lng: 85.8245 };

            const fromNodeJ = junctions.find(item => item.id === fromNodeId) || hospitals.find(item => item.id === fromNodeId);
            const toNodeJ = EN_ROUTE_COORD_RESOLVER(toNodeId);

            if (fromNodeJ) fromCoords = { x: fromNodeJ.x, y: fromNodeJ.y, lat: fromNodeJ.lat, lng: fromNodeJ.lng };
            if (toNodeJ) toCoords = toNodeJ;

            const nextX = fromCoords.x + (toCoords.x - fromCoords.x) * nextProgress;
            const nextY = fromCoords.y + (toCoords.y - fromCoords.y) * nextProgress;
            const nextLat = fromCoords.lat + (toCoords.lat - fromCoords.lat) * nextProgress;
            const nextLng = fromCoords.lng + (toCoords.lng - fromCoords.lng) * nextProgress;

            nextSpeed = 74 + Math.sin(nextProgress * Math.PI) * 14;
            nextEta = Math.max(0, amb.etaToHospital - Math.round(2 * simulationSpeed));

            if (nextProgress >= 1.0) {
              nextProgress = 0;
              nextRouteIndex += 1;

              if (nextRouteIndex >= amb.route.length - 1) {
                nextStatus = 'At Hospital';
                nextSpeed = 0;
                nextEta = 0;

                const destHospitalId = amb.route[amb.route.length - 1];
                const hospitalName = hospitals.find(h => h.id === destHospitalId)?.name || destHospitalId;

                setLogs(prev => [
                  {
                    id: `S-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                    timestamp: currentTime,
                    message: `SUCCESS: ${amb.name} safely docked at ${hospitalName} trauma bay. Medical transit completed.`,
                    type: 'success'
                  },
                  ...prev
                ]);

                setHospitals(prevHos => 
                  prevHos.map(h => h.id === destHospitalId ? { ...h, availableBeds: Math.max(0, h.availableBeds - 1), alerted: false } : h)
                );

              } else {
                const checkpointName = amb.route[nextRouteIndex];
                const junctionObj = junctions.find(j => j.id === checkpointName);
                const nodeNameText = junctionObj ? junctionObj.name : checkpointName;
                
                setLogs(prev => [
                  {
                    id: `I-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                    timestamp: currentTime,
                    message: `${amb.name} registered passage at V2X Node: ${nodeNameText}. Green safety override handshaking...`,
                    type: 'corridor'
                  },
                  ...prev
                ]);
              }
            }

            return {
              ...amb,
              progress: nextProgress,
              routeIndex: nextRouteIndex,
              status: nextStatus,
              speed: nextSpeed,
              currentPosition: { x: nextX, y: nextY, lat: nextLat, lng: nextLng },
              etaToHospital: nextEta
            };
          }
          return amb;
        })
      );

    }, 1000);

    return () => clearInterval(interval);
  }, [simulationTicking, simulationSpeed, ambulances, junctions, hospitals]);

  // Dispatch global custom green corridor simulation
  const handleDispatchAmbulance = (ambulanceId?: string, customRoute?: string[]) => {
    const targetId = typeof ambulanceId === 'string' ? ambulanceId : activeAmbulanceId || 'A-102';
    const selectedAmb = ambulances.find(a => a.id === targetId);
    if (!selectedAmb) return;

    const routerPath = customRoute && customRoute.length > 0 ? customRoute : selectedAmb.route;

    setAmbulances(prev => 
      prev.map(amb => {
        if (amb.id === targetId) {
          const startNodeId = routerPath[0];
          const initialCoords = EN_ROUTE_COORD_RESOLVER(startNodeId);
          return {
            ...amb,
            route: routerPath,
            status: 'Green Corridor Active',
            progress: 0,
            routeIndex: 0,
            speed: 72,
            currentPosition: { ...initialCoords },
            etaToHospital: routerPath.length * 85
          };
        }
        return amb;
      })
    );

    // Sync hospitals alerts
    const destHospitalId = routerPath[routerPath.length - 1];
    setHospitals(prev => prev.map(h => h.id === destHospitalId ? { ...h, alerted: true } : h));

    // Audit initial dispatch timeline logs
    setLogs(prev => [
      {
        id: `D-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: `GREEN CORRIDOR ACTIVE: Segment route ${routerPath.join(' ➔ ')} locked in 5G MmWave Slice.`,
        type: 'corridor'
      },
      {
        id: `D2-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: `DISPATCH_SIGNAL: Severe emergency case assigned. ${selectedAmb.name} (${selectedAmb.type}) en route.`,
        type: 'alert'
      },
      ...prev
    ]);
  };

  // Reset entire simulator parameters back to static baseline defaults
  const handleResetSimulation = () => {
    setJunctions(INITIAL_JUNCTIONS);
    setRoads(INITIAL_ROADS);
    setHospitals(INITIAL_HOSPITALS);
    setAmbulances(INITIAL_AMBULANCES);
    setLogs(RECENT_LOGS);
    setSimulationTicking(true);
    setSimulationSpeed(1);
    setActiveJunctionId(null);
    setActiveAmbulanceId('A-102');
  };

  // Force peak-hour congestion gridlocks to test responsive dynamic route prediction curves
  const handleForceCongestion = () => {
    setJunctions(prev => prev.map(j => ({ ...j, queueLength: Math.min(50, j.queueLength + 15), density: 95, status: 'RED' })));
    setRoads(prev => prev.map(r => ({ ...r, congestion: 'critical', vehicleCount: r.vehicleCount + 30, avgSpeed: 8 })));
    setLogs(prev => [
      {
        id: `C-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: 'GRIDLOCK ALERT: Major peak-hour traffic surge detected on Ring expressway link. Sector queue lengths spiked.',
        type: 'alert'
      },
      ...prev
    ]);
  };

  // Search input change state filter handler
  const handleQueryChange = (q: string) => {
    setSearchQuery(q);
  };

  // Open camera feed dialog
  const handleOpenFeed = (junctionId: string) => {
    // Select specific junction node matching camerId and focus viewer
    setActiveJunctionId(junctionId);
  };

  // Active emergency count (ambulances en-route under test)
  const activeEmergencies = ambulances.filter(a => a.status === 'Green Corridor Active').length;
  const currentAmbulance = ambulances.find(a => a.id === activeAmbulanceId) || ambulances.find(a => a.id === 'A-102') || null;

  return (
    <div className="flex bg-[#07090D] text-gray-100 min-h-screen overflow-x-hidden font-sans antialiased selection:bg-[#D9EF92] selection:text-black">
      
      {/* 1. LEFT SIDEBAR MENU PANEL */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed}
        activeEmergenciesCount={activeEmergencies}
      />

      {/* 2. MAIN APPLICATION CONTENT PORT */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        
        {/* TOP PLATFORM COMMAND BAR */}
        <TopBar
          activeEmergenciesCount={activeEmergencies}
          ambulancesOnline={ambulances.length}
          averageDensity={58}
          responseScore={98.4}
          onSearchChange={handleQueryChange}
          triggerGlobalEmergency={handleDispatchAmbulance}
          recentLogs={logs}
          clearNotifications={() => setLogs([])}
        />

        {/* VIEW CONDITIONAL RENDER PANELS */}
        <div className="p-6 flex-1 flex flex-col gap-6 max-w-[1700px] w-full mx-auto">
          
          {currentTab === 'overview' && (
            <OverviewTab
              junctions={junctions}
              roads={roads}
              hospitals={hospitals}
              ambulances={ambulances}
              logs={logs}
              activeJunctionId={activeJunctionId}
              onSelectJunction={setActiveJunctionId}
              activeAmbulanceId={activeAmbulanceId}
              onSelectAmbulance={setActiveAmbulanceId}
              layers={layers}
              setLayers={setLayers}
            />
          )}

          {currentTab === 'live-operations' && (
            <LiveOperationsTab
              junctions={junctions}
              roads={roads}
              hospitals={hospitals}
              ambulances={ambulances}
              logs={logs}
              activeJunctionId={activeJunctionId}
              onSelectJunction={setActiveJunctionId}
              activeAmbulanceId={activeAmbulanceId}
              onSelectAmbulance={setActiveAmbulanceId}
              layers={layers}
              setLayers={setLayers}
              simulationTicking={simulationTicking}
              setSimulationTicking={setSimulationTicking}
              simulationSpeed={simulationSpeed}
              setSimulationSpeed={setSimulationSpeed}
              onDispatchAmbulance={handleDispatchAmbulance}
              onResetSimulation={handleResetSimulation}
              onForceCongestion={handleForceCongestion}
              onClearLogs={() => setLogs([])}
              detectedVehicles={detectedVehicles}
              activeVehicleId={activeVehicleId}
              onSelectVehicle={setActiveVehicleId}
            />
          )}

          {currentTab === 'emergency-vehicles' && (
            <EmergencyVehiclesTab
              ambulances={ambulances}
              onSelectAmbulance={(id) => {
                setActiveAmbulanceId(id);
                setCurrentTab('live-operations');
              }}
              onDispatchAmbulance={(id) => {
                setActiveAmbulanceId(id);
                handleDispatchAmbulance();
                setCurrentTab('live-operations');
              }}
              junctions={junctions}
              roads={roads}
              hospitals={hospitals}
              layers={layers}
              setLayers={setLayers}
            />
          )}

          {currentTab === 'traffic-network' && (
            <TrafficNetworkTab
              junctions={junctions}
              roads={roads}
            />
          )}

          {currentTab === 'gis-map' && (
            <GisMapLayersTab
              junctions={junctions}
              roads={roads}
              hospitals={hospitals}
              ambulances={ambulances}
              activeJunctionId={activeJunctionId}
              onSelectJunction={setActiveJunctionId}
              activeAmbulanceId={activeAmbulanceId}
              onSelectAmbulance={setActiveAmbulanceId}
              layers={layers}
              setLayers={setLayers}
            />
          )}

          {currentTab === 'analytics' && (
            <GoldenHourAnalyticsTab />
          )}

          {currentTab === 'historical-events' && (
            <HistoricalEventsTab />
          )}

          {currentTab === 'hospitals' && (
            <HospitalStatusTab
              hospitals={hospitals}
              ambulances={ambulances}
              onAlertHospital={(id, alerted) => {
                setHospitals(prev => prev.map(h => h.id === id ? { ...h, alerted } : h));
              }}
              junctions={junctions}
              roads={roads}
              layers={layers}
              setLayers={setLayers}
              onDispatchAmbulance={handleDispatchAmbulance}
            />
          )}

          {currentTab === 'traffic-signals' && (
            <TrafficSignalsTab
              junctions={junctions}
              onSelectJunction={setActiveJunctionId}
              onOverrideJunction={(id, status) => {
                setJunctions(prev => prev.map(j => j.id === id ? { ...j, status } : j));
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsTab
              onResetSimulation={handleResetSimulation}
              simulationSpeed={simulationSpeed}
              setSimulationSpeed={setSimulationSpeed}
            />
          )}

        </div>

        {/* Global Footer */}
        <footer className="mt-auto py-5 border-t border-[#1F242E]/70 bg-[#07090D] px-6 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-gray-500 select-none">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-gray-500" />
            <span>COMMUNICATION FRAMEWORK APPROVED FOR IMC 2026 GENERAL AUDIENCE DEMO</span>
          </div>
          <div>
            <span>© 2026 ARKA CORRIDOR AI // ALL RIGHTS RESERVED SECTOR METRO-4</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
