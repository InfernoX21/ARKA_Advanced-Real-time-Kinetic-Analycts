import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  HeartPulse, 
  Heart, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Navigation,
  Info,
  Sparkles,
  AlertCircle,
  Crosshair,
  Zap
} from 'lucide-react';
import { Hospital, Ambulance } from '../types';
import GisMap from './GisMap';

interface HospitalStatusTabProps {
  hospitals: Hospital[];
  ambulances: Ambulance[];
  onAlertHospital: (id: string, alerted: boolean) => void;
  junctions: any;
  roads: any;
  layers: any;
  setLayers: any;
  onDispatchAmbulance?: (id: string, customRoute: string[]) => void;
}

// -----------------------------------------------------------------------------
// [PATH PLANNER] BFS GRAPH SHORTEST-PATH MATRIX BFS
// -----------------------------------------------------------------------------
// Helper to determine cost/weight of traversing a road segment
function getRoadWeight(road: any): number {
  let baseWeight = 10; // Baseline cost of a typical segment

  // 1. Prioritize road type and classes
  if (road.isFlyover) {
    baseWeight = 1.5; // Highly preferred elevated flyover (bypass traffic)
  } else if (road.type === 'highway') {
    baseWeight = 3; // National Highway preferred
  } else if (road.type === 'primary' || road.type === 'secondary') {
    baseWeight = 6; // Major Roads
  } else {
    baseWeight = 15; // Local roads have higher cost
  }

  // 2. Adjust for congestion (heavy penalty if congested)
  let congestionMultiplier = 1.0;
  if (road.congestion === 'critical') congestionMultiplier = 6.0;
  else if (road.congestion === 'heavy') congestionMultiplier = 3.2;
  else if (road.congestion === 'moderate') congestionMultiplier = 1.4;
  else if (road.congestion === 'free') congestionMultiplier = 0.75;

  return baseWeight * congestionMultiplier;
}

function computeBfsPath(startNodeId: string, endNodeId: string, roads: any[]): string[] {
  // Dijkstra's algorithm for prioritized route planning
  const adj: Record<string, Array<{ to: string; weight: number }>> = {};
  
  roads.forEach(road => {
    const from = road.fromNode;
    const to = road.toNode;
    const wt = getRoadWeight(road);

    if (!adj[from]) adj[from] = [];
    if (!adj[to]) adj[to] = [];

    adj[from].push({ to, weight: wt });
    if (road.direction !== 'unidirectional') {
      adj[to].push({ to: from, weight: wt });
    }
  });

  // Verify elements are connected
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const nodes = new Set<string>();

  for (const node in adj) {
    distances[node] = Infinity;
    previous[node] = null;
    nodes.add(node);
  }
  
  if (nodes.has(startNodeId)) {
    distances[startNodeId] = 0;
  } else {
    return [startNodeId, endNodeId];
  }

  while (nodes.size > 0) {
    // Find node in unvisited set with minimum distance
    let minNode: string | null = null;
    nodes.forEach(node => {
      if (minNode === null || distances[node] < distances[minNode]) {
        minNode = node;
      }
    });

    if (minNode === null || distances[minNode] === Infinity) {
      break;
    }

    if (minNode === endNodeId) {
      break;
    }

    nodes.delete(minNode);

    const neighbors = adj[minNode] || [];
    for (const neighbor of neighbors) {
      if (nodes.has(neighbor.to)) {
        const alt = distances[minNode] + neighbor.weight;
        if (alt < distances[neighbor.to]) {
          distances[neighbor.to] = alt;
          previous[neighbor.to] = minNode;
        }
      }
    }
  }

  // Path reconstruction
  const path: string[] = [];
  let current: string | null = endNodeId;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  if (path[0] === startNodeId) {
    return path;
  }

  // Fallback to BFS
  const simpleAdj: Record<string, string[]> = {};
  roads.forEach(road => {
    const from = road.fromNode;
    const to = road.toNode;
    if (!simpleAdj[from]) simpleAdj[from] = [];
    if (!simpleAdj[to]) simpleAdj[to] = [];
    simpleAdj[from].push(to);
    if (road.direction !== 'unidirectional') {
      simpleAdj[to].push(from);
    }
  });

  const queue: string[][] = [[startNodeId]];
  const visited = new Set<string>([startNodeId]);

  while (queue.length > 0) {
    const p = queue.shift()!;
    const lastNode = p[p.length - 1];
    if (lastNode === endNodeId) return p;

    const neighbors = simpleAdj[lastNode] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...p, neighbor]);
      }
    }
  }

  return [startNodeId, endNodeId];
}

// -----------------------------------------------------------------------------
// [REALTIME DIGITAL MATRIX] INTERACTIVE AI SCORE GENERATOR FACTOR ENGINE
// -----------------------------------------------------------------------------
interface RecommendationResult {
  hospital: Hospital;
  score: number;
  etaMinutes: number;
  distanceKm: number;
  factors: string[];
}

function calculateRecommendations(
  startJuncId: string,
  emergencyType: string,
  icuRequired: boolean,
  junctions: any[],
  roads: any[],
  hospitals: Hospital[]
): RecommendationResult[] {
  const startJunc = junctions.find(j => j.id === startJuncId);
  if (!startJunc) return [];

  return hospitals.map(h => {
    const factors: string[] = [];
    let score = 75; // baseline index

    // 1. Calculate distance (1 deg ~ 111 km)
    const latDiff = h.lat - startJunc.lat;
    const lngDiff = h.lng - startJunc.lng;
    const distanceKm = Number((Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111).toFixed(1));

    // Distance multiplier
    const distDeduction = distanceKm * 7;
    score -= distDeduction;
    factors.push(`Proximity: ${distanceKm} km away (-${Math.round(distDeduction)} pts)`);

    // 2. Specialty matching and capabilities check
    if (emergencyType === 'Cardiac Emergency') {
      if (h.iconType === 'Cardiac Emergency') {
        score += 25;
        factors.push("Specialist cardiac care facilities matches incident (+25 pts)");
      } else if (h.hospitalType === 'Multispeciality') {
        score += 12;
        factors.push("Multispeciality care available (+12 pts)");
      } else {
        score -= 15;
        factors.push("No dedicated cardiac unit available (-15 pts)");
      }
    } else if (emergencyType === 'Severe Trauma') {
      if (h.hospitalType === 'Medical College' || h.iconType === 'Trauma Center' || h.name.includes('Trauma') || h.name.includes('SUM') || h.name.includes('AIIMS') || h.name.includes('Kaling')) {
        score += 25;
        factors.push("High-speed Level-1 Trauma response module active (+25 pts)");
      } else {
        score -= 8;
        factors.push("No trauma surgical unit (-8 pts)");
      }
    } else if (emergencyType === 'Government Specialty') {
      if (h.hospitalType === 'Government') {
        score += 25;
        factors.push("Optimized State-Care pricing & government corridor target (+25 pts)");
      } else {
        score -= 10;
        factors.push("Corporate rate tier (-10 pts)");
      }
    } else {
      if (h.hospitalType === 'Multispeciality' || h.hospitalType === 'Medical College') {
        score += 15;
        factors.push("Standard triage treatment module available (+15 pts)");
      }
    }

    // 3. Bed capacity & emergency state
    if (h.emergencyStatus === 'Diverting') {
      score -= 40;
      factors.push("CRITICAL ALERT: Hospital is diverting ambulances (-40 pts)");
    } else if (h.emergencyStatus === 'High Load') {
      score -= 15;
      factors.push("ER Congestion: Backlog queue waiting times warning (-15 pts)");
    } else {
      score += 10;
      factors.push("Hospital standby rating: Optimal bed capacity (+10 pts)");
    }

    // Available ICU beds check
    const icuRatio = h.availableBeds / h.totalBeds;
    if (icuRequired && icuRatio < 0.15) {
      score -= 22;
      factors.push("Limited unoccupied ICU beds (-22 pts)");
    } else if (icuRatio > 0.3) {
      score += 15;
      factors.push("Excellent standby ICU capabilities (+15 pts)");
    }

    // Road Congestion to target hospital
    const matchRoad = roads.find(r => r.fromNode === h.id || r.toNode === h.id);
    if (matchRoad) {
      if (matchRoad.congestion === 'heavy') {
        score -= 10;
        factors.push(`Transit highway ${matchRoad.name} has heavy traffic (-10 pts)`);
      } else if (matchRoad.congestion === 'critical') {
        score -= 20;
        factors.push(`Transit corridor is critically congested (-20 pts)`);
      } else {
        score += 5;
        factors.push("Access highway is smooth flowing (+5 pts)");
      }
    }

    // Calculate approximate ETA minutes
    const averageSpeedKmh = matchRoad && matchRoad.congestion === 'critical' ? 22 : matchRoad && matchRoad.congestion === 'heavy' ? 35 : 55;
    const etaMinutes = Number(((distanceKm / averageSpeedKmh) * 60 + 1.2).toFixed(1));

    score = Math.max(10, Math.min(99, Math.round(score)));

    return {
      hospital: h,
      score,
      etaMinutes,
      distanceKm,
      factors
    };
  }).sort((a, b) => b.score - a.score);
}

export default function HospitalStatusTab({
  hospitals,
  ambulances,
  onAlertHospital,
  junctions,
  roads,
  layers,
  setLayers,
  onDispatchAmbulance
}: HospitalStatusTabProps) {

  const [selectedHosId, setSelectedHosId] = useState<string>('APOLLO');
  const [startJuncId, setStartJuncId] = useState<string>('JV');
  const [emergencyType, setEmergencyType] = useState<string>('Severe Trauma');
  const [icuRequired, setIcuRequired] = useState<boolean>(false);

  // Find active selected hospital
  const selectedHos = hospitals.find(h => h.id === selectedHosId) || hospitals[0];

  // Count incoming ambulances to this specific hospital
  const incomingAmbs = ambulances.filter(a => 
    a.route[a.route.length - 1] === selectedHos.id && 
    (a.status === 'Green Corridor Active' || a.status === 'En Route')
  );

  // Compute live AI recommendations list
  const recommendations = useMemo(() => {
    return calculateRecommendations(startJuncId, emergencyType, icuRequired, junctions, roads, hospitals);
  }, [startJuncId, emergencyType, icuRequired, junctions, roads, hospitals]);

  const topRecommendations = recommendations.slice(0, 3);

  // Deploy corridor dispatcher with Dijkstra shortest path
  const handleAiDispatch = (hosId: string) => {
    if (!onDispatchAmbulance) return;
    
    // Grab standby EMS units
    const standbyAmbs = ambulances.filter(a => a.status === 'Available');
    const assignedAmb = standbyAmbs.find(a => {
      if (emergencyType === 'Cardiac Emergency') return a.type.toLowerCase().includes('cardiac');
      if (emergencyType === 'Severe Trauma') return a.type.toLowerCase().includes('trauma');
      return !a.type.toLowerCase().includes('cardiac') && !a.type.toLowerCase().includes('trauma');
    }) || standbyAmbs[0] || ambulances[0];

    if (!assignedAmb) return;

    // Calculate BFS route
    const customRoutePath = computeBfsPath(startJuncId, hosId, roads);
    
    // Call dispatch
    onDispatchAmbulance(assignedAmb.id, customRoutePath);
    setSelectedHosId(hosId);
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Bhubaneswar V2X Hospital & AI Digital Twin Hub</h2>
          <p className="text-xs text-gray-400">
            Real-time digital synchronization of emergency rooms, cardiac units, available ICU beds, and live 5G dispatch.
          </p>
        </div>
      </div>

      {/* Primary Split: Hospital Card grid / Detailed Panel details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column (8 cols): Large Grid cards representing tracked hospitals */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hospitals.map((hos) => {
              const livesIncoming = ambulances.filter(a => 
                a.route[a.route.length - 1] === hos.id && 
                (a.status === 'Green Corridor Active' || a.status === 'En Route')
              ).length;

              const isSelected = hos.id === selectedHosId;

              // Customize emoji and borders based on type
              let hosBorders = 'border-[#1F242E]';
              let typeIconColor = 'text-cyan-400 bg-cyan-400/5';
              let hEmoji = '🏥';

              if (hos.iconType === 'Trauma Center') {
                hosBorders = isSelected ? 'border-red-500 shadow-xl' : 'border-[#1F242E]';
                typeIconColor = 'text-red-500 bg-red-400/5';
                hEmoji = '🚑';
              } else if (hos.iconType === 'Cardiac Emergency') {
                hosBorders = isSelected ? 'border-[#EC4899] shadow-xl' : 'border-[#1F242E]';
                typeIconColor = 'text-[#EC4899] bg-[#EC4899]/5';
                hEmoji = '❤️';
              } else if (hos.iconType === 'Government Hospital') {
                hosBorders = isSelected ? 'border-[#F59E0B] shadow-xl' : 'border-[#1F242E]';
                typeIconColor = 'text-[#F59E0B] bg-[#F59E0B]/5';
                hEmoji = '🏛';
              } else {
                hosBorders = isSelected ? 'border-[#06B6D4] shadow-xl' : 'border-[#1F242E]';
              }

              return (
                <div 
                  key={hos.id}
                  onClick={() => setSelectedHosId(hos.id)}
                  className={`p-5 rounded-xl border select-none cursor-pointer transition-all duration-300 flex flex-col gap-4 justify-between relative overflow-hidden ${
                    isSelected 
                      ? 'bg-[#1C2029]/80 shadow-xl' 
                      : 'bg-[#0F1115] hover:border-[#1F242E]/75 hover:translate-y-[-2px]'
                  } ${hosBorders}`}
                >
                  {/* Top line header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${typeIconColor}`}>
                        <span className="text-base">{hEmoji}</span>
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="font-sans font-extrabold text-white text-sm uppercase tracking-tight truncate leading-tight">{hos.name}</span>
                        <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">{hos.hospitalType}</span>
                      </div>
                    </div>

                    {hos.alerted ? (
                      <span className="text-[8px] font-mono font-extrabold tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase animate-pulse shrink-0">
                        TRAUMA INBOUND
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded-sm uppercase tracking-wider shrink-0">
                        {hos.emergencyStatus}
                      </span>
                    )}
                  </div>

                  <div className="h-px bg-[#1F242E]/70" />

                  {/* Bed capacities rows */}
                  <div className="grid grid-cols-2 gap-3 text-[10.5px] font-mono text-gray-400">
                    <div className="flex flex-col">
                      <span>Available General Beds:</span>
                      <strong className="text-white text-xs font-sans mt-0.5">{hos.availableBeds} / {hos.totalBeds} Beds</strong>
                    </div>
                    <div className="flex flex-col">
                      <span>Expected Ambulance ETAs:</span>
                      <strong className="text-[#D9EF92] text-xs font-sans mt-0.5">{livesIncoming} Dispatch</strong>
                    </div>
                  </div>

                  {/* ICU Occupancy bar */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex justify-between text-[9px] font-mono text-gray-500">
                      <span>ICU Occupancy Ratio:</span>
                      <span className="text-white font-mono">{hos.icuOccupancy}% occupied</span>
                    </div>
                    <div className="h-1.5 bg-black rounded overflow-hidden p-0.5 border border-[#1F242E]">
                      <div 
                        className={`h-full rounded-sm transition-all duration-300 ${
                          hos.icuOccupancy > 80 ? 'bg-red-500' : 'bg-[#D9EF92]'
                        }`}
                        style={{ width: `${hos.icuOccupancy}%` }}
                      />
                    </div>
                  </div>

                  {/* Expected arrivals indicators */}
                  {livesIncoming > 0 ? (
                    <div className="p-2.5 bg-red-950/40 border border-red-500/20 rounded-lg flex items-center justify-between text-[10px] font-mono text-red-200 mt-1 animate-pulse">
                      <div className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-red-500 animate-spin" />
                        <span>Active Transit Corridor locked:</span>
                      </div>
                      <span className="font-extrabold text-white">{livesIncoming} incoming</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-black/60 border border-gray-900 rounded-lg text-center text-[10px] text-gray-500 font-mono">
                      No active incoming ambulance routes currently targeted
                    </div>
                  )}

                  {/* Corner shadow decoration */}
                  <div className="absolute top-0 right-0 h-10 w-10 bg-white/[0.01] rounded-bl-full pointer-events-none" />
                </div>
              );
            })}
          </div>

          {/* Interactive Hospital Layout coordinates on a mini map layout */}
          <div className="bg-[#0F1115] border border-[#1F242E] rounded-xl p-4 mt-2">
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Bhubaneswar Coverage Heatmap & Service Rings
            </h3>
            <div className="h-[280px] rounded-lg overflow-hidden border border-[#1F242E]">
              <GisMap
                junctions={junctions}
                roads={roads}
                hospitals={hospitals}
                ambulances={ambulances}
                activeJunctionId={null}
                onSelectJunction={() => {}}
                activeAmbulanceId={null}
                onSelectAmbulance={() => {}}
                layers={{ ...layers, signals: false, density: true, weather: false }}
                setLayers={setLayers}
                simulationTicking={true}
              />
            </div>
          </div>

        </div>

        {/* Right column: 4 columns for SELECTED HOSPITAL details */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {selectedHos && (
            <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 text-left select-none shadow-xl relative overflow-hidden">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#D9EF92] bg-[#D9EF92]/5 border border-[#D9EF92]/10 px-2 py-0.5 rounded w-fit uppercase font-bold tracking-wider">
                  Trauma Specs: {selectedHos.id}
                </span>
                <h3 className="font-sans font-extrabold text-base text-white mt-2 uppercase">{selectedHos.name}</h3>
                <p className="text-[10.5px] font-sans text-gray-400 mt-1 italic leading-snug">📍 {selectedHos.address}</p>
              </div>

              <div className="h-px bg-[#1F242E]" />

              {/* Status Spec table */}
              <div className="flex flex-col gap-3 font-mono text-[11px] text-gray-400">
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>Duty ER Doctors:</span>
                  <strong className="text-white">{selectedHos.doctorsAvailable} Specialists</strong>
                </div>
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>Active Capacity:</span>
                  <strong className="text-white">{selectedHos.availableBeds} / {selectedHos.totalBeds} Beds</strong>
                </div>
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>ICU Vent Status:</span>
                  <strong className="text-emerald-400">{selectedHos.equipmentStatus}</strong>
                </div>
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>Avg Dispatch Delay:</span>
                  <strong className="text-cyan-400">{selectedHos.averageResponseTime}</strong>
                </div>
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>Sector Camera:</span>
                  <strong className="text-white font-mono">{selectedHos.nearestCameraNode}</strong>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Sector Safe Zone:</span>
                  <strong className="text-white truncate max-w-[100px]">{selectedHos.coverageZone}</strong>
                </div>
              </div>

              {/* Toggles Bay Alert triggers */}
              <div className="bg-black/40 border border-[#1F242E] p-3.5 rounded-lg flex flex-col gap-2">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">
                  ER Pre-allocation Action Commands
                </span>
                <p className="text-[10px] text-gray-400 leading-normal mb-1">
                  Alert clinical trauma teams to clear code-red surgery wings and lock standby ventilators before and ahead of ambulance arriving.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => onAlertHospital(selectedHos.id, !selectedHos.alerted)}
                    className={`flex-1 py-1.5 text-xs font-bold font-mono rounded cursor-pointer transition-colors uppercase tracking-wider ${
                      selectedHos.alerted 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-[#D9EF92] text-black hover:bg-[#bce045]'
                    }`}
                  >
                    {selectedHos.alerted ? '🚨 CANCEL TRAUMA BAY ALERT' : '⚠️ INITIATE CODE-RED ER PRE-EMPTION'}
                  </button>
                </div>
              </div>

              {/* Expected incoming ambulances with ETA list */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold pl-0.5">
                  Pre-empting EMS Vehicles en-route
                </span>

                {incomingAmbs.length > 0 ? (
                  <div className="flex flex-col gap-2 font-mono text-[10.5px]">
                    {incomingAmbs.map((amb) => (
                      <div key={amb.id} className="bg-black/60 p-3 rounded-lg border border-red-500/20 text-left flex items-start justify-between gap-3 animate-pulse">
                        <div className="flex flex-col gap-0.5">
                          <strong className="text-red-400 text-xs font-mono">{amb.id} • {amb.driver}</strong>
                          <span className="text-gray-400 text-[10px] font-normal leading-tight">SPECIALTY: {amb.type}</span>
                        </div>
                        <span className="text-white bg-red-600/30 border border-red-500/30 px-2 py-0.5 rounded text-xs shrink-0">
                          {Math.floor(amb.etaToHospital / 60)}m {amb.etaToHospital % 60}s ETA
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 text-center font-mono py-4 border border-dashed border-[#1F242E] rounded-lg">
                    No en-route ambulance is currently targeted at {selectedHos.name}.
                  </p>
                )}
              </div>

            </div>
          )}

          {/* -------------------------------------------------------------------
              [AI RECOMMENDATION & DISPATCH MATRIX CONTROLLER]
              ------------------------------------------------------------------- */}
          <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 text-left shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-sans font-extrabold text-sm text-white uppercase tracking-tight">AI Tactical dispatch tower</h3>
                <span className="text-[9px] font-mono text-[#D9EF92] uppercase">5G mmWave Coordinated Routing</span>
              </div>
            </div>

            <div className="h-px bg-[#1F242E]" />

            {/* Selector Options form */}
            <div className="flex flex-col gap-3 font-mono text-[10.5px]">
              
              {/* Incident Intersection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  Select Starting Intersection:
                </span>
                <select 
                  value={startJuncId} 
                  onChange={(e) => setStartJuncId(e.target.value)}
                  className="bg-black text-white p-2 rounded border border-[#1F242E] focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {junctions.map((j: any) => (
                    <option key={j.id} value={j.id} className="bg-[#0F1115]">
                      {j.name} ({j.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Case Emergency Specialization */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-400">Emergency Type:</span>
                  <select 
                    value={emergencyType} 
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className="bg-black text-white p-2 rounded border border-[#1F242E] focus:outline-none focus:border-red-500 cursor-pointer text-[9.5px]"
                  >
                    <option value="Severe Trauma" className="bg-[#0F1115]">Trauma Accident 🚑</option>
                    <option value="Cardiac Emergency" className="bg-[#0F1115]">Cardiac Arrest ❤️</option>
                    <option value="Government Specialty" className="bg-[#0F1115]">Govt Specialty 🏛</option>
                    <option value="General Pediatric" className="bg-[#0F1115]">General Treatment 🏥</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-400">Ambulance Beds:</span>
                  <div className="flex items-center h-full">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] text-gray-300">
                      <input 
                        type="checkbox" 
                        checked={icuRequired} 
                        onChange={(e) => setIcuRequired(e.target.checked)}
                        className="rounded bg-black border border-[#1F242E] text-[#D9EF92] focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <span>Require ICU Bed</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#1F242E]/70" />

            {/* AI Ranked Recommendations results list */}
            <div className="flex flex-col gap-2">
              <span className="text-[9.5px] font-mono text-gray-500 uppercase tracking-widest block font-bold pl-0.5">
                AI Recommendation matches
              </span>

              <div className="flex flex-col gap-2.5">
                {topRecommendations.map((rec, idx) => {
                  const isTopOne = idx === 0;
                  
                  // Color codes for recommendation ranks
                  const scoreColor = rec.score > 85 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : rec.score > 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20';
                  
                  return (
                    <div 
                      key={rec.hospital.id} 
                      className={`p-3 rounded-lg border text-left flex flex-col gap-2 ${
                        isTopOne 
                          ? 'bg-black/80 border-[#D9EF92]/30 border-l-4 border-l-[#D9EF92]' 
                          : 'bg-black/40 border-[#1F242E]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                          <strong className="text-white text-xs truncate leading-snug">{rec.hospital.name}</strong>
                          <span className="text-[9px] text-gray-400 font-mono mt-0.5 leading-none">
                            📏 {rec.distanceKm} km • ⏱️ ~{rec.etaMinutes} min transit
                          </span>
                        </div>

                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${scoreColor} shrink-0`}>
                          {rec.score}% MATCH
                        </span>
                      </div>

                      {/* Display explain factors for why selected */}
                      <div className="flex flex-col gap-1 pl-1 border-l border-white/[0.04] mt-0.5 text-[8.5px] font-mono text-gray-400">
                        {rec.factors.slice(0, 2).map((fac, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-1">
                            <span className="text-gray-500">•</span>
                            <span className="leading-tight">{fac}</span>
                          </div>
                        ))}
                      </div>

                      {/* Dispatch Action button */}
                      <button 
                        onClick={() => handleAiDispatch(rec.hospital.id)}
                        className="w-full mt-1.5 py-1.5 bg-[#D9EF92] text-black rounded text-[10px] font-mono font-bold tracking-wider hover:bg-[#bce045] transition-colors cursor-pointer text-center uppercase"
                      >
                        ⚡ LOCK {rec.hospital.id} & DISPATCH AI PATH
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
