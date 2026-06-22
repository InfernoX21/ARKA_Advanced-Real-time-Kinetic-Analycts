import React, { useState, useRef, useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Tv, 
  Activity, 
  AlertTriangle, 
  Navigation, 
  Eye, 
  Camera, 
  Radio, 
  Map as MapIcon,
  ShieldAlert,
  Clock,
  HeartPulse,
  Signal,
  Play,
  Pause,
  FastForward,
  Cpu,
  Wifi,
  Compass,
  Volume2,
  Settings,
  Sliders,
  Maximize2,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Activity as PulseIcon
} from 'lucide-react';
import { Junction, RoadSegment, Hospital, Ambulance, DigitalTwinVehicle } from '../types';

// Mock additional V2X infrastructure types
interface Tower5G {
  id: string;
  name: string;
  lat: number;
  lng: number;
  signalStrength: number; // 0-100
  status: 'ACTIVE' | 'SLICING' | 'OVERLOAD';
}

interface TrafficCamera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  junctionId: string;
  health: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
  coverageAngle: number; // visual direction
  vehiclesDetected: number;
  confidence: number;
}

interface ReplayFrame {
  progress: number;
  routeIndex: number;
  lat: number;
  lng: number;
  speed: number;
  activeJunctionState: string;
  overriddenJunctions: string[];
  logs: string[];
}

interface GisMapProps {
  junctions: Junction[];
  roads: RoadSegment[];
  hospitals: Hospital[];
  ambulances: Ambulance[];
  activeJunctionId: string | null;
  onSelectJunction: (id: string | null) => void;
  activeAmbulanceId: string | null;
  onSelectAmbulance: (id: string | null) => void;
  layers: {
    ambulances: boolean;
    density: boolean;
    signals: boolean;
    hospitals: boolean;
    cameras: boolean;
    weather: boolean;
    accidents: boolean;
    constructions: boolean;
    corridors: boolean;
  };
  setLayers: React.Dispatch<React.SetStateAction<{
    ambulances: boolean;
    density: boolean;
    signals: boolean;
    hospitals: boolean;
    cameras: boolean;
    weather: boolean;
    accidents: boolean;
    constructions: boolean;
    corridors: boolean;
  }>>;
  onOpenFeed?: (junctionId: string) => void;
  simulationTicking: boolean;
  detectedVehicles?: DigitalTwinVehicle[];
  activeVehicleId?: string | null;
  onSelectVehicle?: (id: string | null) => void;
}

export default function GisMap({
  junctions,
  roads,
  hospitals,
  ambulances,
  activeJunctionId,
  onSelectJunction,
  activeAmbulanceId,
  onSelectAmbulance,
  layers,
  setLayers,
  onOpenFeed,
  simulationTicking,
  detectedVehicles = [],
  activeVehicleId = null,
  onSelectVehicle = () => {}
}: GisMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs to hold dynamic overlays
  const roadsGroupRef = useRef<L.LayerGroup | null>(null);
  const junctionsGroupRef = useRef<L.LayerGroup | null>(null);
  const hospitalsGroupRef = useRef<L.LayerGroup | null>(null);
  const ambulancesGroupRef = useRef<L.LayerGroup | null>(null);
  const densityGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentsGroupRef = useRef<L.LayerGroup | null>(null);
  const towers5GGroupRef = useRef<L.LayerGroup | null>(null);
  const camerasGroupRef = useRef<L.LayerGroup | null>(null);
  const linksGroupRef = useRef<L.LayerGroup | null>(null);
  const vehiclesGroupRef = useRef<L.LayerGroup | null>(null);
  const vehiclesMarkersRef = useRef<Record<string, L.Marker>>({});

  // Marker and Polyline Reconciliation caches
  const markersCacheRef = useRef<Record<string, L.Marker>>({});
  const ambulanceSmoothPos = useRef<Record<string, { lat: number; lng: number; rotation: number }>>({});
  const ambulanceMarkersRef = useRef<Record<string, L.Marker>>({});

  // Operational State
  const [followMode, setFollowMode] = useState<boolean>(true);
  const [gNetworkActive, setGNetworkActive] = useState<boolean>(true);
  const [legendOpen, setLegendOpen] = useState<boolean>(true);
  
  // Custom smart view selectors inside map canvas bounds
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);

  // Progressive route generation animation
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeCalcProgress, setRouteCalcProgress] = useState<number>(1.0);
  const prevActiveAmbulanceId = useRef<string | null>(null);

  // Floating notifications overlay list
  const [mapEvents, setMapEvents] = useState<Array<{ id: string; msg: string; type: string }>>([
    { id: 'ev1', msg: 'ARKA Sentinel Command Center Initialized', type: 'system' }
  ]);

  // ---------------------------------------------------------------------------
  // MISSION PLAYBACK REPLAY SYSTEM STATE
  // ---------------------------------------------------------------------------
  const [isReplayMode, setIsReplayMode] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // 1x, 2x, 4x
  const [replayProgress, setReplayProgress] = useState<number>(45); // 0 to 100 timeline slider
  const [replayPlaying, setReplayPlaying] = useState<boolean>(false);
  const replayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedMissionId = "MS-812C"; // Acute Coronary Syndrome
  const selectedMissionTitle = "Trauma Transit: Jaydev Square ➔ Apollo (Code Red)";

  // Generate Replay Frames based on path junctions
  const replayFrames = useMemo<ReplayFrame[]>(() => {
    const totalFrames = 100;
    const startLat = 20.2974; // Jaydev Vihar (JV)
    const endLat = 20.3082; // Apollo Hospital
    const startLng = 85.8230;
    const endLng = 85.8315;
    const intermediateJunctions = ['JV', 'AV', 'APOLLO'];

    const frames: ReplayFrame[] = [];
    for (let i = 0; i < totalFrames; i++) {
      const completionPercentage = i / (totalFrames - 1);
      const lat = startLat + (endLat - startLat) * completionPercentage;
      const lng = startLng + (endLng - startLng) * completionPercentage;
      const currentSpeed = completionPercentage < 0.2 ? 45 : completionPercentage < 0.8 ? 91 : 35;
      
      let activeJunctionState = "Restoring Traffic";
      let overriddenJunctions: string[] = [];
      let logs: string[] = [];

      if (completionPercentage < 0.4) {
        activeJunctionState = "Clearing Queue @ Jaydev Vihar Square";
        overriddenJunctions = ['JV'];
        logs = ["Siren acoustic trigger detected", "JV queue draining: -12 vehicles/min"];
      } else if (completionPercentage < 0.8) {
        activeJunctionState = "Emergency Override @ Acharya Vihar Loop";
        overriddenJunctions = ['JV', 'AV'];
        logs = ["5G cellular slice locked", "Vani corridor holding cross traffic"];
      } else {
        activeJunctionState = "Active Hospital Handshake @ Apollo Bay";
        overriddenJunctions = ['AV', 'APOLLO'];
        logs = ["Apollo Trauma Unit notified", "Life telemetries synchronized"];
      }

      frames.push({
        progress: completionPercentage,
        routeIndex: completionPercentage < 0.5 ? 0 : 1,
        lat,
        lng,
        speed: currentSpeed,
        activeJunctionState,
        overriddenJunctions,
        logs
      });
    }
    return frames;
  }, []);

  const currentReplayFrame = replayFrames[Math.floor((replayProgress / 100) * (replayFrames.length - 1))];

  // Handle Play/Pause for Replay Mode
  useEffect(() => {
    if (isReplayMode && replayPlaying) {
      replayIntervalRef.current = setInterval(() => {
        setReplayProgress(prev => {
          if (prev >= 100) {
            setReplayPlaying(false);
            return 100;
          }
          return Math.min(100, prev + 1 * replaySpeed);
        });
      }, 120);
    } else {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
      }
    }
    return () => {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    };
  }, [isReplayMode, replayPlaying, replaySpeed]);

  // ---------------------------------------------------------------------------
  // V2X INFRASTRUCTURE NODES DEFINITIONS
  // ---------------------------------------------------------------------------
  const TOWER_STATIONS = useMemo<Tower5G[]>(() => [
    { id: 'TW-JV', name: 'Jaydev 5G Macro gNodeB', lat: 20.3015, lng: 85.8205, signalStrength: 98, status: 'SLICING' },
    { id: 'TW-AV', name: 'Acharya V2X Hypercell Unit', lat: 20.2925, lng: 85.8320, signalStrength: 95, status: 'SLICING' },
    { id: 'TW-VV', name: 'Vani Vihar 5G Slice Cluster', lat: 20.2850, lng: 85.8450, signalStrength: 92, status: 'SLICING' },
    { id: 'TW-PT', name: 'Patia Campus SmartCell', lat: 20.3395, lng: 85.8210, signalStrength: 99, status: 'ACTIVE' },
    { id: 'TW-CS', name: 'CRP Sq V2X Node', lat: 20.2810, lng: 85.8030, signalStrength: 88, status: 'ACTIVE' }
  ], []);

  const camerasList = useMemo<TrafficCamera[]>(() => {
    return junctions.map(j => ({
      id: `CAM-${j.id}`,
      name: `V2X CCTV HD - ${j.id}`,
      lat: j.lat + 0.0016,
      lng: j.lng - 0.0014,
      junctionId: j.id,
      health: j.id === 'RS' ? 'DEGRADED' : 'OPERATIONAL',
      coverageAngle: j.id === 'JV' ? 45 : j.id === 'AV' ? 120 : j.id === 'VV' ? 220 : 310,
      vehiclesDetected: Math.max(3, Math.round(j.queueLength * 1.15)),
      confidence: j.status === 'OVERRIDE' ? 99.4 : 0
    }));
  }, [junctions]);

  // Push Map Event Helper
  const pushMapEvent = (msg: string, type = 'system') => {
    setMapEvents(prev => [{ id: `ev-${Date.now()}`, msg, type }, ...prev.slice(0, 4)]);
  };

  // Trigger progressive route animation calculation upon new active emergency ambulance dispatch
  useEffect(() => {
    if (activeAmbulanceId && activeAmbulanceId !== prevActiveAmbulanceId.current) {
      const activeAmb = ambulances.find(a => a.id === activeAmbulanceId);
      if (activeAmb && activeAmb.status === 'Green Corridor Active') {
        setIsCalculatingRoute(true);
        setRouteCalcProgress(0);
        pushMapEvent(`Generating optimal green wave corridor routing for ${activeAmb.name}`, 'corridor');
        
        // Progressively fill progress bar
        let currentP = 0;
        const interval = setInterval(() => {
          currentP += 0.1;
          setRouteCalcProgress(Math.min(1, currentP));
          if (currentP >= 1.0) {
            clearInterval(interval);
            setIsCalculatingRoute(false);
            pushMapEvent(`5G Slice activated successfully. ARKA corridor live.`, 'success');
          }
        }, 150);

        return () => clearInterval(interval);
      }
    }
    prevActiveAmbulanceId.current = activeAmbulanceId;
  }, [activeAmbulanceId, ambulances]);

  // ---------------------------------------------------------------------------
  // INITIALIZE LEAFLET MAP INSTANCE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    const bhuvaneswarCenter: L.LatLngExpression = [20.2961, 85.8245];
    const bbmcBounds = L.latLngBounds([20.210, 85.720], [20.380, 85.900]);
    const map = L.map(mapRef.current, {
      center: bhuvaneswarCenter,
      zoom: 13,
      minZoom: 12.5,
      maxZoom: 18,
      maxBounds: bbmcBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true // Use high-performance canvas rendering for all vector layers
    });

    // Dark sleek high-contrast CartoDB map tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Build the dynamic overlay Layer Groups
    roadsGroupRef.current = L.layerGroup().addTo(map);
    junctionsGroupRef.current = L.layerGroup().addTo(map);
    hospitalsGroupRef.current = L.layerGroup().addTo(map);
    ambulancesGroupRef.current = L.layerGroup().addTo(map);
    densityGroupRef.current = L.layerGroup().addTo(map);
    incidentsGroupRef.current = L.layerGroup().addTo(map);
    towers5GGroupRef.current = L.layerGroup().addTo(map);
    camerasGroupRef.current = L.layerGroup().addTo(map);
    linksGroupRef.current = L.layerGroup().addTo(map);
    vehiclesGroupRef.current = L.layerGroup().addTo(map);

    pushMapEvent('Tactical Map Core successfully mounted with Canvas Acceleration', 'system');

    // Automatic Intelligent Follow Mode suspension upon direct user map manipulation
    const handleUserInteraction = () => {
      setFollowMode(false);
    };

    map.on('dragstart zoomstart mousedown touchstart', handleUserInteraction);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('dragstart zoomstart mousedown touchstart', handleUserInteraction);
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Map Automatic Size Correction
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // ---------------------------------------------------------------------------
  // 60FPS AMBULANCE MOVEMENT LERP INTERPOLATION LOOP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let animId: number;

    const interpolatePositions = () => {
      const lerpFactor = 0.07; // Speed of visual sliding on frames

      ambulances.forEach(a => {
        let targetLat = a.currentPosition.lat;
        let targetLng = a.currentPosition.lng;

        // Override position if we are in REPLAY MODE
        if (isReplayMode && currentReplayFrame && a.id === 'A-102') {
          targetLat = currentReplayFrame.lat;
          targetLng = currentReplayFrame.lng;
        }

        const prev = ambulanceSmoothPos.current[a.id] || { lat: targetLat, lng: targetLng, rotation: 0 };
        
        // Compute delta step
        const newLat = prev.lat + (targetLat - prev.lat) * lerpFactor;
        const newLng = prev.lng + (targetLng - prev.lng) * lerpFactor;

        // Compute rotation angle based on step coordinates
        const dLat = targetLat - prev.lat;
        const dLng = targetLng - prev.lng;
        let rotationStep = prev.rotation;
        if (Math.abs(dLat) > 0.000001 || Math.abs(dLng) > 0.000001) {
          const bearing = Math.atan2(dLat, dLng) * (180 / Math.PI);
          // Standardize heading angle so standard vertical vehicle matches path
          rotationStep = 90 - bearing;
        }

        ambulanceSmoothPos.current[a.id] = {
          lat: newLat,
          lng: newLng,
          rotation: rotationStep
        };
      });

      // RERENDER Map Overlay layers
      renderDynamicLayers();

      // Cinematic Follow mode focus
      if (followMode && mapInstanceRef.current) {
        const activeId = activeAmbulanceId || 'A-102';
        const activePos = ambulanceSmoothPos.current[activeId];
        if (activePos) {
          mapInstanceRef.current.panTo([activePos.lat, activePos.lng], { animate: true, duration: 0.25 });
        }
      }

      animId = requestAnimationFrame(interpolatePositions);
    };

    animId = requestAnimationFrame(interpolatePositions);
    return () => cancelAnimationFrame(animId);
  }, [ambulances, isReplayMode, currentReplayFrame, followMode, activeAmbulanceId]);

  // Congestion colors palette
  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'free': return '#10B981'; // green-vibrant
      case 'moderate': return '#F59E0B'; // yellow-gold
      case 'heavy': return '#EA580C'; // heavy orange
      case 'critical': return '#EF4444'; // critical red
      default: return '#334155';
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER STATIC V2X LAYERS (Hospitals, Signals, Cameras, Towers, roads, density)
  // Redrawn only when state changes (1Hz simulator tick or layer toggles), not 60FPS!
  // ---------------------------------------------------------------------------
  const renderStaticLayers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear static sub-groups to redraw elements fresh. Dynamic layers are cleared separately.
    roadsGroupRef.current?.clearLayers();
    junctionsGroupRef.current?.clearLayers();
    hospitalsGroupRef.current?.clearLayers();
    densityGroupRef.current?.clearLayers();
    incidentsGroupRef.current?.clearLayers();
    towers5GGroupRef.current?.clearLayers();
    camerasGroupRef.current?.clearLayers();

    const activeAmb = isReplayMode 
      ? { id: 'A-102', status: 'Green CorridorActive', route: ['JV', 'AV', 'APOLLO'] }
      : ambulances.find(a => a.status === 'Green Corridor Active');

    // 1. Draw Streets / Roads with flow dashed marching styles
    if (layers.corridors) {
      roads.forEach(road => {
        const fromNode = junctions.find(j => j.id === road.fromNode) || hospitals.find(h => h.id === road.fromNode);
        const toNode = junctions.find(j => j.id === road.toNode) || hospitals.find(h => h.id === road.toNode);

        if (fromNode && toNode) {
          let isCorridorActive = false;
          if (activeAmb) {
            const fIdx = activeAmb.route.indexOf(fromNode.id);
            const tIdx = activeAmb.route.indexOf(toNode.id);
            if (fIdx !== -1 && tIdx !== -1 && Math.abs(fIdx - tIdx) === 1) {
              isCorridorActive = true;
            }
          }

          // 1. Determine classification metrics
          const isFlyover = !!road.isFlyover;
          const nameLower = road.name.toLowerCase();
          const isHighway = road.type === 'highway' || nameLower.includes('nh-16') || nameLower.includes('highway') || nameLower.includes('bypass') || nameLower.includes('expressway');
          const isMajor = road.type === 'primary' || road.type === 'secondary' || nameLower.includes('janpath') || nameLower.includes('road') || nameLower.includes('link') || nameLower.includes('avenue') || nameLower.includes('boulevard') || nameLower.includes('main');

          // 2. Base colors and line widths depending on type
          let baseRoadColor = '#FBBF24'; // default Local Road (Yellow)
          let bgWeight = 3.5;
          let flowWeight = 1.2;

          if (isFlyover) {
            baseRoadColor = '#3B82F6'; // Medium blue elevated style
            bgWeight = 6.5;
            flowWeight = 2.2;
          } else if (isHighway) {
            baseRoadColor = '#00ECFF'; // National Highway (Bright Electric Blue)
            bgWeight = 7.5;
            flowWeight = 3.2;
          } else if (isMajor) {
            baseRoadColor = '#3B82F6'; // Major City Road (Medium Blue)
            bgWeight = 5.0;
            flowWeight = 2.0;
          }

          // Override for congestion or active corridor glow
          let pathGlowColor = baseRoadColor;
          if (isCorridorActive) {
            pathGlowColor = '#D9EF92'; // Active Green Corridor (Light Green)
          } else if (road.congestion === 'critical' || road.congestion === 'heavy') {
            pathGlowColor = getCongestionColor(road.congestion); // Red / Amber
          }

          // --- 3. SPECIAL FLYOVER 3D RENDERING ---
          if (isFlyover) {
            // Draw a bottom dark offset shadow representing the elevated structures
            const shadowOffsetLat = -0.00015;
            const shadowOffsetLng = 0.00015;
            const shadowLine = L.polyline([
              [fromNode.lat + shadowOffsetLat, fromNode.lng + shadowOffsetLng],
              [toNode.lat + shadowOffsetLat, toNode.lng + shadowOffsetLng]
            ], {
              color: '#000000',
              weight: bgWeight + 2.5,
              opacity: 0.55,
              lineJoin: 'round'
            });
            shadowLine.addTo(roadsGroupRef.current!);

            // Draw dark blue physical border of the concrete flyover bridge
            const borderLine = L.polyline([[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]], {
              color: '#0F172A',
              weight: bgWeight + 1,
              opacity: 0.85,
              lineJoin: 'round'
            });
            borderLine.addTo(roadsGroupRef.current!);
          }

          // Render bottom background glow roadway line
          const roadBGLine = L.polyline([[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]], {
            color: pathGlowColor,
            weight: isCorridorActive ? bgWeight + 4 : bgWeight,
            opacity: isCorridorActive ? 0.85 : isFlyover ? 0.95 : 0.45,
            lineJoin: 'round'
          });
          roadBGLine.addTo(roadsGroupRef.current!);

          // Render flow particles using custom dashed stroke animated classes
          const speedClass = isCorridorActive ? 'march-corridor' : `march-${road.congestion}`;
          
          const flowDashLine = L.polyline([[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]], {
            color: isCorridorActive ? '#D9EF92' : isFlyover ? '#93C5FD' : '#ffffff',
            weight: isCorridorActive ? flowWeight + 1.5 : flowWeight,
            opacity: isCorridorActive ? 1.0 : 0.65,
            dashArray: isCorridorActive ? '15, 20' : '8, 25',
            className: speedClass,
            lineJoin: 'round'
          });

          // Dynamic road intelligence hover tooltip
          flowDashLine.bindTooltip(`
            <div class="px-3 py-2 font-mono text-[10.5px] flex flex-col gap-1 min-w-[210px] text-slate-300">
              <strong class="text-yellow-400 text-xs block border-b border-white/[0.08] pb-1 uppercase tracking-tight">${road.name}</strong>
              <div class="flex justify-between items-center mt-1">
                <span class="text-slate-400">Classification:</span> 
                <span class="text-white font-bold">${isFlyover ? '🌉 ELEVATED FLYOVER' : isHighway ? '🔵 NATIONAL HIGHWAY' : isMajor ? '🔷 MAJOR ROAD' : '🟡 LOCAL ROAD'}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Traffic Density:</span> 
                <span class="text-white">${road.trafficDensity || 35}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Avg Speed:</span> 
                <span class="text-[#D9EF92] font-bold">${road.avgSpeed} km/h</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Vehicle Count:</span> 
                <span class="text-white">${road.vehicleCount} units</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Congestion Rate:</span> 
                <span class="capitalize text-red-400 font-bold">${road.congestion}</span>
              </div>
              <div class="flex justify-between items-center border-t border-white/[0.05] pt-1 mt-1">
                <span class="text-slate-400">Emerg Accessibility:</span> 
                <span class="text-cyan-400 font-bold">${road.emergencyAccessibilityScore || 85}/100</span>
              </div>
            </div>
          `, { sticky: true, className: 'custom-map-tooltip' });
          flowDashLine.addTo(roadsGroupRef.current!);

          // --- 4. MAP ROUTE LABELS VISIBLE AT ALL ZOOM LEVELS ---
          if (isFlyover) {
            // Draw secondary invisible line for center tooltip anchoring
            const labelHelper = L.polyline([[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]], {
              opacity: 0,
              weight: 1
            });
            const textL = road.flyoverName || `${road.name} Flyover`;
            labelHelper.bindTooltip(textL, {
              permanent: true,
              direction: 'center',
              className: 'flyover-route-label'
            });
            labelHelper.addTo(roadsGroupRef.current!);
          } else if (isHighway) {
            // Draw permanent National Highway route shield label
            const labelHelper = L.polyline([[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]], {
              opacity: 0,
              weight: 1
            });
            const labelText = road.name.includes('NH-16') ? 'NH-16 Bypass' : 'NH Corridor';
            labelHelper.bindTooltip(labelText, {
              permanent: true,
              direction: 'center',
              className: 'nh-route-label'
            });
            labelHelper.addTo(roadsGroupRef.current!);
          }
        }
      });
    }

    // 1b. Draw prominent active overall routing path trace
    const activeTransits = ambulances.filter(a => a.status === 'Green Corridor Active' || a.status === 'En Route');
    activeTransits.forEach(amb => {
      const coordPath = amb.route.map(nodeId => {
        const node = junctions.find(j => j.id === nodeId) || hospitals.find(h => h.id === nodeId);
        return node ? [node.lat, node.lng] : null;
      }).filter(Boolean) as L.LatLngExpression[];

      if (coordPath.length > 1) {
        // High visibility back glow representing V2X green corridor slice
        const backGlowLine = L.polyline(coordPath, {
          color: '#EF4444',
          weight: 8,
          opacity: 0.35,
          lineJoin: 'round'
        });
        backGlowLine.addTo(roadsGroupRef.current!);

        // Animated neon core
        const coreLine = L.polyline(coordPath, {
          color: '#D9EF92',
          weight: 3,
          dashArray: '8, 12',
          opacity: 0.95,
          className: 'march-corridor',
          lineJoin: 'round'
        });
        coreLine.addTo(roadsGroupRef.current!);
      }
    });

    // 2. Draw Junction Signals & Preparation states
    if (layers.signals) {
      // Draw communication routing channels between intersections
      roads.forEach(road => {
        const fromJunc = junctions.find(j => j.id === road.fromNode);
        const toJunc = junctions.find(j => j.id === road.toNode);

        if (fromJunc && toJunc) {
          let isCoordActive = false;
          if (activeAmb) {
            const fIdx = activeAmb.route.indexOf(fromJunc.id);
            const tIdx = activeAmb.route.indexOf(toJunc.id);
            if (fIdx !== -1 && tIdx !== -1 && Math.abs(fIdx - tIdx) === 1) {
              isCoordActive = true;
            }
          }

          const lineColor = isCoordActive ? '#10B981' : '#06B6D4';
          const lineDash = isCoordActive ? '4, 6' : '3, 10';
          const speedClass = isCoordActive ? 'march-coms' : '';
          const lineWeight = isCoordActive ? 2.5 : 1.2;
          const lineOpacity = isCoordActive ? 0.95 : 0.28;

          const comLine = L.polyline([[fromJunc.lat, fromJunc.lng], [toJunc.lat, toJunc.lng]], {
            color: lineColor,
            weight: lineWeight,
            opacity: lineOpacity,
            dashArray: lineDash,
            className: speedClass,
            lineJoin: 'round'
          });

          // Add interactive V2X communication tooltip
          comLine.bindTooltip(`
            <div class="px-2.5 py-1.5 font-mono text-[9px] text-slate-300">
              <strong class="text-cyan-400 block uppercase border-b border-white/[0.08] pb-0.5 mb-1">V2X INTEGRATION CHANNEL</strong>
              <span>Intersections: <span class="text-white font-bold">${fromJunc.id} ↔ ${toJunc.id}</span></span>
              <span class="block mt-0.5">Link Status: ${isCoordActive ? '🟢 ACTIVE CORRIDOR HANDSHAKE' : '🔵 SYNCHRONIZED STANDBY'}</span>
              <span class="text-slate-500 block text-[8px] mt-0.5">Signal coordination wave latency: &lt; 2.4 ms</span>
            </div>
          `, { sticky: true, className: 'custom-map-tooltip' });
          
          comLine.addTo(junctionsGroupRef.current!);
        }
      });

      junctions.forEach(j => {
        const isSelected = j.id === activeJunctionId;
        
        let signalStatus = j.status;
        let flowBadgeText = j.status === 'OVERRIDE' ? '5G OVERRIDE' : j.phase;

        // Overlay states if green wave corridor is active
        let signalPrepState = 'STANDARD'; // STANDARD, PREPARING, OVERRIDE, RESTORING
        if (activeAmb) {
          const ambulanceIndex = activeAmb.route.indexOf(j.id);
          const currentRouteIndex = isReplayMode && currentReplayFrame ? currentReplayFrame.routeIndex : (ambulances.find(amb => amb.status === 'Green Corridor Active')?.routeIndex || 0);

          if (ambulanceIndex !== -1) {
            if (ambulanceIndex === currentRouteIndex + 1) {
              signalPrepState = 'CLEARING_QUEUE';
              signalStatus = 'OVERRIDE';
              flowBadgeText = 'CLEARING QUEUE';
            } else if (ambulanceIndex === currentRouteIndex) {
              signalPrepState = 'ACTIVE_CORRIDOR';
              signalStatus = 'OVERRIDE';
              flowBadgeText = 'ACTIVE CORRIDOR';
            } else if (ambulanceIndex > currentRouteIndex + 1) {
              signalPrepState = 'PREPARING';
              signalStatus = 'YELLOW';
              flowBadgeText = 'PREPARING SLICE';
            } else {
              signalPrepState = 'RESTORING';
              signalStatus = 'GREEN';
              flowBadgeText = 'RESTORING SYSTEM';
            }
          }
        }

        // Color coding for signals and halos
        const getSignalUiColors = (status: string, state: string) => {
          if (state === 'ACTIVE_CORRIDOR') return { main: '#D9EF92', halo: '#D9EF92', badgeBg: 'bg-[#D9EF92]/20', textCol: 'text-[#D9EF92]' };
          if (state === 'CLEARING_QUEUE') return { main: '#F59E0B', halo: '#F59E0B', badgeBg: 'bg-amber-500/10', textCol: 'text-amber-400' };
          if (state === 'PREPARING') return { main: '#3B82F6', halo: '#3B82F6', badgeBg: 'bg-blue-500/10', textCol: 'text-blue-400' };
          if (state === 'RESTORING') return { main: '#10B981', halo: '#14B8A6', badgeBg: 'bg-teal-500/10', textCol: 'text-teal-400' };
          
          if (status === 'GREEN') return { main: '#10B981', halo: '#10B981', badgeBg: 'bg-emerald-500/15', textCol: 'text-emerald-400' };
          if (status === 'YELLOW') return { main: '#F59E0B', halo: '#F59E0B', badgeBg: 'bg-amber-500/15', textCol: 'text-amber-400' };
          return { main: '#EF4444', halo: '#EF4444', badgeBg: 'bg-red-500/15', textCol: 'text-red-400' };
        };

        const theme = getSignalUiColors(signalStatus, signalPrepState);

        const jIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <!-- Sequential Green Wave pulsing Halo -->
              ${signalPrepState !== 'STANDARD' ? `
                <div class="absolute h-8 w-8 rounded-full animate-ping opacity-30 bg-[#D9EF92]"></div>
              ` : ''}

              <!-- Pulsating light base -->
              <div class="absolute h-7 w-7 rounded-full duration-1000 animate-pulse transition-all" style="background-color: ${theme.main}30; filter: blur(2.5px)"></div>
              
              <!-- Core dot -->
              <div class="h-3 w-3 rounded-full border-2 border-slate-900 transition-all z-10 duration-300" style="background-color: ${theme.main}; box-shadow: 0 0 10px ${theme.main}"></div>

              <!-- HUD floating short badge -->
              ${isSelected || signalPrepState !== 'STANDARD' ? `
                <div class="absolute -top-7 px-1.5 py-0.5 rounded border border-[#222A3A] bg-[#0E1116] flex flex-col items-center shadow-xl select-none text-[8px] font-mono whitespace-nowrap z-40 transform -translate-y-1 scale-90">
                  <span class="font-semibold text-white tracking-tight">${j.id}</span>
                  <span class="${theme.textCol} text-[7px] font-bold tracking-wider">${flowBadgeText}</span>
                </div>
              ` : ''}
            </div>
          `,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const jMarker = L.marker([j.lat, j.lng], { icon: jIcon });
        jMarker.on('click', () => {
          onSelectJunction(j.id);
          setSelectedCameraId(null);
          setSelectedTowerId(null);
        });
        jMarker.addTo(junctionsGroupRef.current!);
      });
    }

    // 3. Draw Hospitals
    if (layers.hospitals) {
      hospitals.forEach(h => {
        const isAlerted = h.alerted;
        
        // Map custom visual icon attributes based on hospital type
        let iconEmoji = '🏥';
        let iconColor = '#06B6D4'; // default cyan for General
        let iconInnerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`; // default cross

        if (h.iconType === 'Trauma Center') {
          iconEmoji = '🚑';
          iconColor = '#EF4444'; // red
          iconInnerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="10" x="2" y="4" rx="2"/><path d="M10 14H2M18 10h4v4h-4zM6 18a2 2 0 1 0 4 0 2 2 0 1 0-4 0M16 18a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/></svg>`;
        } else if (h.iconType === 'Cardiac Emergency') {
          iconEmoji = '❤️';
          iconColor = '#EC4899'; // pink/rose
          iconInnerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
        } else if (h.iconType === 'Government Hospital') {
          iconEmoji = '🏛';
          iconColor = '#F59E0B'; // amber/orange
          iconInnerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 21h19M4 14V9M8 14V9M12 14V9M16 14V9M20 14V9M2 9l10-6 10 6M4 21v-3h16v3"/></svg>`;
        }

        const borderStrokeColor = isAlerted ? '#10B981' : iconColor;

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <!-- Pulsating rescue cross base -->
            ${isAlerted ? `<span class="absolute h-10 w-10 border border-emerald-400 bg-emerald-500/15 rounded animate-ping"></span>` : ''}
            
            <div class="h-9 w-9 rounded bg-[#090C12] border-2 flex flex-col items-center justify-center shadow-2xl transition-all" style="border-color: ${borderStrokeColor}; color: ${borderStrokeColor}">
              ${iconInnerSvg}
            </div>

            <!-- Floating statistics panel and capacity text -->
            <div class="absolute -bottom-3 bg-[#0a0d13] text-[7.5px] px-1.5 rounded-full border border-slate-700 text-gray-300 font-mono tracking-wide whitespace-nowrap">
              BEDS: ${h.availableBeds}/${h.totalBeds}
            </div>

            <!-- Tiny emoji icon flag -->
            <div class="absolute -top-1.5 -right-1.5 text-[9px]">
              ${iconEmoji}
            </div>
          </div>
        `;

        const hIcon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        // 3a. Plot translucent hospital coverage range/service radius circle
        const rangeCircle = L.circle([h.lat, h.lng], {
          radius: (h.serviceRadiusKm || 5) * 1000,
          color: iconColor,
          fillColor: iconColor,
          fillOpacity: 0.03,
          weight: 1.2,
          dashArray: '3, 5'
        });
        rangeCircle.addTo(hospitalsGroupRef.current!);

        // 3b. Create Marker and attach detailed rich Leaflet facts popup
        const hMarker = L.marker([h.lat, h.lng], { icon: hIcon });

        // Count how many ambulances are en-route is this matching destination
        const targetedAmbulancesCount = ambulances.filter(a => 
          a.route[a.route.length - 1] === h.id && 
          (a.status === 'Green Corridor Active' || a.status === 'En Route')
        ).length;

        const popupContent = `
          <div class="popup-container text-white p-3 rounded-lg bg-[#0C1017] min-w-[270px] font-sans border-0 select-none">
            <div class="flex items-center gap-2 pb-2 mb-2 border-b border-white/[0.08]">
              <span class="text-xl shrink-0">${iconEmoji}</span>
              <div class="flex-1 min-w-0">
                <h4 class="font-extrabold text-xs tracking-tight text-white m-0 truncate uppercase">${h.name}</h4>
                <div class="flex gap-1.5 items-center mt-1">
                  <span class="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm text-gray-300 font-mono uppercase tracking-wider">${h.hospitalType}</span>
                  <span class="text-[8px] px-1.5 py-0.5 rounded-sm font-mono uppercase font-extrabold tracking-wider" style="background-color: ${h.emergencyStatus === 'Diverting' ? 'rgba(239, 68, 68, 0.12)' : h.emergencyStatus === 'High Load' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'}; color: ${h.emergencyStatus === 'Diverting' ? '#EF4444' : h.emergencyStatus === 'High Load' ? '#F59E0B' : '#10B981'}; border: 1px solid ${h.emergencyStatus === 'Diverting' ? 'rgba(239, 68, 68, 0.2)' : h.emergencyStatus === 'High Load' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}">
                    ${h.emergencyStatus}
                  </span>
                </div>
              </div>
            </div>
            
            <p class="text-[10px] text-gray-400 font-medium leading-normal mb-2 pb-1.5 border-b border-white/[0.05] m-0">
              📍 <span class="italic text-gray-300 font-sans">${h.address || 'Bhubaneswar, Odisha'}</span>
            </p>
            
            <div class="grid grid-cols-2 gap-x-2.5 gap-y-1.5 font-mono text-[9.5px] text-gray-400 mb-2 border-b border-white/[0.05] pb-2">
              <div>🏥 Beds Available: <strong class="text-[#D9EF92] text-xs">${h.availableBeds}/${h.totalBeds}</strong></div>
              <div>⚡ Queue Backlog: <strong class="text-white">${h.emergencyQueue} Waiting</strong></div>
              <div>🚨 ICU Capacity: <strong class="text-white">${h.icuBedsAvailable || 12}/${h.icuTotalBeds || 40} Beds</strong></div>
              <div>🩺 Doctors Duty: <strong class="text-cyan-400 font-bold">${h.doctorsAvailable} Active</strong></div>
              <div>⏱️ Avg Respond: <strong class="text-white">${h.averageResponseTime}</strong></div>
              <div>📡 Active Inbound: <strong class="text-white ${targetedAmbulancesCount > 0 ? 'text-rose-400 animate-pulse font-bold' : ''}">${targetedAmbulancesCount} EMS</strong></div>
            </div>

            <div class="flex flex-col gap-1 text-[9px] font-mono text-gray-500 bg-black/30 p-2 border border-white/[0.04] rounded-md">
              <div class="flex justify-between">
                <span>🚦 Local Junction:</span>
                <strong class="text-gray-300 font-sans">${h.nearestTrafficSignal}</strong>
              </div>
              <div class="flex justify-between mt-0.5">
                <span>📹 Nearest Camera:</span>
                <strong class="text-[#D9EF92] font-mono">${h.nearestCameraNode}</strong>
              </div>
              <div class="flex justify-between mt-0.5">
                <span>🚨 Sector Zone:</span>
                <strong class="text-gray-300 font-sans truncate max-w-[140px]">${h.coverageZone || 'Central Zone'}</strong>
              </div>
              <div class="flex justify-between mt-0.5">
                <span>🎛️ V2X Radius:</span>
                <strong class="text-[#06B6D4] font-mono">${h.serviceRadiusKm} Kilometers</strong>
              </div>
            </div>
          </div>
        `;

        hMarker.bindPopup(popupContent, { 
          closeButton: true,
          offset: L.point(0, -10),
          minWidth: 270
        });

        hMarker.on('click', () => {
          onSelectJunction(null);
          setSelectedCameraId(null);
          setSelectedTowerId(null);
          // Auto select first match ambulance going to this hospital
          const matchedAmbulance = ambulances.find(a => a.route[a.route.length - 1] === h.id);
          if (matchedAmbulance) onSelectAmbulance(matchedAmbulance.id);
        });
        hMarker.addTo(hospitalsGroupRef.current!);
      });
    }



    // 5. Draw 5G Network Infrastructure Layer (Towers, link lines, slices)
    if (gNetworkActive) {
      TOWER_STATIONS.forEach(t => {
        const isSelected = selectedTowerId === t.id;
        const isSliceSecured = t.status === 'SLICING';

        const tIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <!-- Glowing coverage wave -->
              <span class="absolute h-9 w-9 bg-cyan-500/10 rounded-full animate-pulse transition-all" style="transform: scale(${isSelected ? 1.5 : 1})"></span>
              
              <div class="h-7 w-7 rounded bg-[#091118] border border-cyan-500 flex items-center justify-center shadow-lg" style="box-shadow: 0 0 8px rgba(6, 182, 212, 0.4)">
                <!-- Radio wireless signal transceiver -->
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" stroke-width="2.5"><path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8"/><path d="M8 10a4 4 0 0 1 8 0"/></svg>
              </div>

              <!-- Tower floating ID tag -->
              <div class="absolute -bottom-3 bg-[#0d151c] text-[6.5px] font-mono text-cyan-400 px-1 rounded-full border border-cyan-900 font-bold uppercase truncate max-w-[54px]">
                ${t.name.split(' ')[0]}
              </div>
            </div>
          `,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const tMarker = L.marker([t.lat, t.lng], { icon: tIcon });
        tMarker.on('click', () => {
          setSelectedTowerId(t.id);
          setSelectedCameraId(null);
          onSelectJunction(null);
        });
        tMarker.addTo(towers5GGroupRef.current!);
      });
    }

    // 6. Draw CCTV Digital Cameras Layer (Coverage coning overlay)
    if (layers.cameras) {
      camerasList.forEach(c => {
        const isSelected = selectedCameraId === c.id;
        
        // Draw physical coverage cone sector as semi-transparent yellow polygon
        const pRadius = 0.0035; // sector projection length
        const angleR1 = (c.coverageAngle - 25) * Math.PI / 180;
        const angleR2 = (c.coverageAngle + 25) * Math.PI / 180;
        
        const pt1: L.LatLngExpression = [c.lat, c.lng];
        const pt2: L.LatLngExpression = [c.lat + pRadius * Math.sin(angleR1), c.lng + pRadius * Math.cos(angleR1)];
        const pt3: L.LatLngExpression = [c.lat + pRadius * Math.sin(angleR2), c.lng + pRadius * Math.cos(angleR2)];

        const cameraCone = L.polygon([pt1, pt2, pt3], {
          color: isSelected ? '#F59E0B' : '#E2E8F0',
          fillColor: isSelected ? '#F59E0B' : '#334155',
          fillOpacity: isSelected ? 0.22 : 0.05,
          weight: 0.5,
          stroke: isSelected
        });
        cameraCone.addTo(camerasGroupRef.current!);

        // Draw camera node circle
        const cIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="h-5.5 w-5.5 rounded bg-slate-900 border flex items-center justify-center transition-all ${
                isSelected ? 'border-amber-500 scale-110 shadow-lg' : 'border-slate-600'
              }" style="box-shadow: ${isSelected ? '0 0 6px #F59E0B' : 'none'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="${
                  isSelected ? '#F59E0B' : '#E2E8F0'
                }" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/><path d="M21 9v6L16 12z"/></svg>
              </div>
            </div>
          `,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const cMarker = L.marker([c.lat, c.lng], { icon: cIcon });
        cMarker.on('click', () => {
          setSelectedCameraId(c.id);
          setSelectedTowerId(null);
          onSelectJunction(null);
        });
        cMarker.addTo(camerasGroupRef.current!);
      });
    }

    // 7. Density auric overlay circles
    if (layers.density) {
      junctions.forEach(j => {
        if (j.density > 45) {
          const aColor = j.density > 75 ? '#EF4444' : '#F59E0B';
          const outerAura = L.circle([j.lat, j.lng], {
            radius: j.density * 5.0,
            fillColor: aColor,
            fillOpacity: 0.12,
            stroke: false
          });
          outerAura.addTo(densityGroupRef.current!);
        }
      });
    }

    // 8. Custom Accident Zones and Road blocks
    if (layers.accidents) {
      const mockHaps = [
        { lat: 20.3015, lng: 85.8305, txt: 'Collision Incident INC-82A', severity: 'Critical' },
        { lat: 20.2721, lng: 85.8090, txt: 'Water pipe rupture roadway flood', severity: 'Moderate' }
      ];

      mockHaps.forEach(h => {
        const hazIcon = L.divIcon({
          html: `
            <div class="h-6 w-6 rounded bg-[#2a0e0e] border border-red-500/80 flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          `,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const markerObj = L.marker([h.lat, h.lng], { icon: hazIcon });
        markerObj.bindTooltip(`
          <div class="px-2 py-1 text-[10px] font-mono">
            <strong class="text-red-400 block uppercase">ROAD INCIDENT</strong>
            <span>${h.txt}</span>
          </div>
        `, { sticky: true, className: 'custom-map-tooltip' });
        markerObj.addTo(incidentsGroupRef.current!);
      });
    }
  };

  // Sync static layers rendering on 1Hz data clock updates or config swaps, debounced naturally by React updates
  useEffect(() => {
    renderStaticLayers();
  }, [junctions, roads, hospitals, layers, gNetworkActive, selectedCameraId, selectedTowerId, activeJunctionId, activeAmbulanceId, isReplayMode, currentReplayFrame]);

  // ---------------------------------------------------------------------------
  // RENDER DYNAMIC OVERLAY LAYERS AND SMOOTH VEHICLE MARKERS (60FPS Frame Update)
  // ---------------------------------------------------------------------------
  const renderDynamicLayers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Fast clear dynamic communication link lines
    linksGroupRef.current?.clearLayers();

    const activeAmb = isReplayMode 
      ? { id: 'A-102', status: 'Green CorridorActive', route: ['JV', 'AV', 'APOLLO'] }
      : ambulances.find(a => a.status === 'Green Corridor Active');

    // Draw Ambulances smoothly using cached markers mapping
    if (layers.ambulances) {
      ambulances.forEach(a => {
        const isSelected = a.id === activeAmbulanceId;
        const statePos = ambulanceSmoothPos.current[a.id] || { lat: a.currentPosition.lat, lng: a.currentPosition.lng, rotation: 0 };
        const isDisp = isReplayMode ? (a.id === 'A-102') : (a.status === 'Green Corridor Active');
        
        let displaySpeed = isReplayMode && currentReplayFrame && a.id === 'A-102' ? currentReplayFrame.speed : a.speed;
        const dynamicColor = isDisp ? '#D9EF92' : '#3B82F6';

        // 1. Get or create ambulance marker
        let aMarker = ambulanceMarkersRef.current[a.id];

        if (!aMarker) {
          const rawIconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer font-sans">
              <!-- Pulsating V2X Beacon Ring -->
              ${isDisp ? `
                <div class="absolute h-10 w-10 rounded-full animate-ping border border-[#D9EF92]/40 bg-[#D9EF92]/5"></div>
              ` : ''}

              <!-- Speed indicator ring -->
              <div class="absolute h-9 w-9 rounded-full border-2 border-dashed animate-spin text-[5px] text-gray-400 opacity-60 flex items-center justify-center" style="animation-duration: 6s; border-color: ${dynamicColor}30">
              </div>

              <!-- Direction Pointer & Vector Core ambulance body -->
              <div class="vehicle-rotate h-8.5 w-8.5 rounded-full bg-[#080B11] border-2 flex items-center justify-center shadow-xl transition-all" style="border-color: ${isSelected ? '#D9EF92' : dynamicColor}; transform: rotate(${statePos.rotation}deg)">
                <!-- Siren Icon with forward rotation orientation -->
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${dynamicColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M13 10V4c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1v6"/></svg>
              </div>

              <!-- Holographic Telemetry Label -->
              <div class="speed-label absolute -bottom-4.5 bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-[6.5px] font-mono text-white font-bold whitespace-nowrap z-40 shadow-md">
                ${a.id} • ${Math.round(displaySpeed)} KM/H
              </div>
            </div>
          `;

          const ambIcon = L.divIcon({
            html: rawIconHtml,
            className: '',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          aMarker = L.marker([statePos.lat, statePos.lng], { icon: ambIcon });
          aMarker.on('click', () => {
            onSelectAmbulance(a.id);
            onSelectJunction(null);
            setSelectedCameraId(null);
            setSelectedTowerId(null);
          });
          aMarker.addTo(ambulancesGroupRef.current!);
          ambulanceMarkersRef.current[a.id] = aMarker;
        } else {
          // Update position smoothly inline
          aMarker.setLatLng([statePos.lat, statePos.lng]);

          // Restore to group if missing
          if (ambulancesGroupRef.current && !ambulancesGroupRef.current.hasLayer(aMarker)) {
            aMarker.addTo(ambulancesGroupRef.current);
          }

          // Direct DOM transform updates for 60FPS velocity rotations
          const element = aMarker.getElement();
          if (element) {
            const rotateEl = element.querySelector('.vehicle-rotate') as HTMLElement;
            if (rotateEl) {
              rotateEl.style.transform = `rotate(${statePos.rotation}deg)`;
              rotateEl.style.borderColor = isSelected ? '#D9EF92' : dynamicColor;
            }
            const speedEl = element.querySelector('.speed-label') as HTMLElement;
            if (speedEl) {
              speedEl.innerText = `${a.id} • ${Math.round(displaySpeed)} KM/H`;
            }
          }
        }
      });

      // Clear any cached markers that are no longer part of active ambulances data
      Object.keys(ambulanceMarkersRef.current).forEach(id => {
        if (!ambulances.some(a => a.id === id)) {
          const m = ambulanceMarkersRef.current[id];
          if (m) {
            m.remove();
            delete ambulanceMarkersRef.current[id];
          }
        }
      });
    } else {
      ambulancesGroupRef.current?.clearLayers();
    }

    // 1.5 Draw standard digital twin tracking vehicles (cars, buses, trucks, motorcycles)
    if (layers.ambulances && vehiclesGroupRef.current) {
      if (detectedVehicles && detectedVehicles.length > 0) {
        detectedVehicles.forEach(v => {
          const isSelected = activeVehicleId === v.id;
          
          // Color coding based on vehicle categories
          let themeColor = '#3B82F6'; // default blue
          let typeInit = 'C';
          if (v.type === 'Ambulance') {
            themeColor = '#EF4444';
            typeInit = 'A';
          } else if (v.type === 'Bus') {
            themeColor = '#06B6D4';
            typeInit = 'B';
          } else if (v.type === 'Truck') {
            themeColor = '#F59E0B';
            typeInit = 'T';
          } else if (v.type === 'Motorcycle') {
            themeColor = '#10B981';
            typeInit = 'M';
          }

          let vMarker = vehiclesMarkersRef.current[v.id];

          if (!vMarker) {
            const vehicleHtml = `
              <div class="relative flex items-center justify-center cursor-pointer">
                ${v.type === 'Ambulance' ? `
                  <div class="absolute h-8 w-8 rounded-full animate-ping border border-red-500/40 bg-red-400/10"></div>
                ` : ''}
                <div class="h-6 w-6 rounded-full bg-[#080B11] border-2 flex items-center justify-center shadow-md transition-all ${isSelected ? 'scale-110 ring-2 ring-[#D9EF92]' : ''}" style="border-brand border-color: ${isSelected ? '#D9EF92' : themeColor}">
                  <span class="text-[8px] font-mono font-black" style="color: ${isSelected ? '#D9EF92' : themeColor}">${typeInit}</span>
                </div>
              </div>
            `;

            const iconObj = L.divIcon({
              html: vehicleHtml,
              className: '',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            vMarker = L.marker([v.lat, v.lng], { icon: iconObj });
            
            // Add custom informative tooltips
            vMarker.bindTooltip(`
              <div class="px-2.5 py-1.5 font-mono text-[10px] bg-[#07090D] text-gray-100 border border-[#1F242E] rounded-md shadow-2xl text-left">
                <span class="text-[8px] text-gray-500 block uppercase tracking-wider">VEHICLE TELEMETRY</span>
                <strong class="text-white block mt-0.5">${v.id} <span class="text-[8px] font-normal text-gray-500">(${v.type})</span></strong>
                <div class="h-px bg-gray-800 my-1"></div>
                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px]">
                  <span class="text-gray-400">SPEED:</span> <strong class="text-[#D9EF92]">${v.speed} km/h</strong>
                  <span class="text-gray-400">CONFIDENCE:</span> <strong class="text-white">${v.confidence}%</strong>
                  <span class="text-gray-400">ZONE:</span> <strong class="text-cyan-400">${v.cameraId}</strong>
                  <span class="text-gray-400">DEST:</span> <strong class="text-gray-300 truncate max-w-[80px] block">${v.destination}</strong>
                </div>
              </div>
            `, { sticky: true, className: 'custom-map-tooltip' });

            vMarker.on('click', () => {
              onSelectVehicle(v.id);
              onSelectJunction(v.cameraId.replace('CAM-', ''));
            });

            vMarker.addTo(vehiclesGroupRef.current!);
            vehiclesMarkersRef.current[v.id] = vMarker;
          } else {
            // Update position
            vMarker.setLatLng([v.lat, v.lng]);

            if (!vehiclesGroupRef.current.hasLayer(vMarker)) {
              vMarker.addTo(vehiclesGroupRef.current);
            }

            // Direct style reconciliation
            const el = vMarker.getElement();
            if (el) {
              const bodyEl = el.querySelector('.rounded-full') as HTMLElement;
              const textEl = el.querySelector('span') as HTMLElement;
              if (bodyEl && textEl) {
                if (isSelected) {
                  bodyEl.classList.add('scale-110', 'ring-2', 'ring-[#D9EF92]');
                  bodyEl.style.borderColor = '#D9EF92';
                  textEl.style.color = '#D9EF92';
                } else {
                  bodyEl.classList.remove('scale-110', 'ring-2', 'ring-[#D9EF92]');
                  bodyEl.style.borderColor = themeColor;
                  textEl.style.color = themeColor;
                }
              }
            }
          }
        });
      }

      // Clear obsolete vehicle markers
      Object.keys(vehiclesMarkersRef.current).forEach(id => {
        if (!detectedVehicles || !detectedVehicles.some(v => v.id === id)) {
          const m = vehiclesMarkersRef.current[id];
          if (m) {
            m.remove();
            delete vehiclesMarkersRef.current[id];
          }
        }
      });
    } else {
      vehiclesGroupRef.current?.clearLayers();
    }

    // 2. Draw communication links (fiber lines) in real-time
    if (gNetworkActive) {
      TOWER_STATIONS.forEach(t => {
        const targetAmb = ambulances.find(a => a.status === 'Green Corridor Active' || a.id === 'A-102');
        if (targetAmb) {
          const ambPos = ambulanceSmoothPos.current[targetAmb.id] || targetAmb.currentPosition;
          
          const dist = L.latLng(t.lat, t.lng).distanceTo([ambPos.lat, ambPos.lng]);
          if (dist < 3100) {
            const comLink = L.polyline([[t.lat, t.lng], [ambPos.lat, ambPos.lng]], {
              color: '#22D3EE',
              weight: 0.8,
              opacity: 0.45,
              dashArray: '4, 8',
              className: 'march-coms'
            });
            comLink.addTo(linksGroupRef.current!);
          }
        }
      });
    }
  };

  // ---------------------------------------------------------------------------
  // BUTTONS & ZOOM CONTROLS HANDLERS
  // ---------------------------------------------------------------------------
  const handleMapZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleMapZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleMapReset = () => {
    mapInstanceRef.current?.setView([20.2961, 85.8245], 13);
    pushMapEvent('Recentered Smart City Control Grid', 'system');
  };

  // Find entity dependencies
  const selectedJunction = junctions.find(j => j.id === activeJunctionId);
  const selectedAmbulance = ambulances.find(a => a.id === activeAmbulanceId);
  const selectedCamera = camerasList.find(c => c.id === selectedCameraId);
  const selectedTower = TOWER_STATIONS.find(t => t.id === selectedTowerId);

  return (
    <div ref={containerRef} className="w-full h-full relative rounded-2xl border border-[#1F242E] bg-[#05070a] overflow-hidden select-none shadow-2xl flex flex-col font-sans">
      
      {/* Premium SVG animations stylesheet injection */}
      <style>{`
        /* Dynamic SVG marching/flowing stroke dashes */
        @keyframes flowFree {
          to { stroke-dashoffset: -120; }
        }
        @keyframes flowModerate {
          to { stroke-dashoffset: -75; }
        }
        @keyframes flowHeavy {
          to { stroke-dashoffset: -35; }
        }
        @keyframes flowCritical {
          to { stroke-dashoffset: -10; }
        }
        @keyframes flowCorridor {
          to { stroke-dashoffset: -200; }
        }
        @keyframes flowComs {
          to { stroke-dashoffset: -100; }
        }

        .march-free {
          animation: flowFree 4s linear infinite;
        }
        .march-moderate {
          animation: flowModerate 5s linear infinite;
        }
        .march-heavy {
          animation: flowHeavy 7s linear infinite;
        }
        .march-critical {
          animation: flowCritical 12s linear infinite;
        }
        .march-corridor {
          animation: flowCorridor 2.5s linear infinite;
          stroke: #D9EF92 !important;
          stroke-shadow: 0 0 12px #D9EF92;
        }
        .march-coms {
          animation: flowComs 1.8s linear infinite;
        }

        /* National Highway labels styling visible at all zoom levels */
        .nh-route-label {
          background: rgba(11, 23, 40, 0.95) !important;
          border: 1px solid #00ECFF !important;
          color: #00ECFF !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 8px !important;
          font-weight: 800 !important;
          padding: 1.5px 3.5px !important;
          box-shadow: 0 0 10px rgba(0, 236, 255, 0.45) !important;
          border-radius: 4px !important;
          text-shadow: 0 0 3px rgba(0, 236, 255, 0.4) !important;
          white-space: nowrap !important;
          opacity: 0.92 !important;
        }
        .nh-route-label:before {
          display: none !important;
        }

        /* Elevated Flyover Labels styling */
        .flyover-route-label {
          background: rgba(15, 23, 42, 0.92) !important;
          border: 1px solid #3B82F6 !important;
          color: #e2e8f0 !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 8px !important;
          font-weight: 700 !important;
          padding: 1px 3.5px !important;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
          border-radius: 4px !important;
          white-space: nowrap !important;
          opacity: 0.95 !important;
        }
        .flyover-route-label:before {
          display: none !important;
        }

        /* Leaflet Dark Filter Mode overlay */
        .leaflet-tile-container {
          filter: invert(100%) hue-rotate(185deg) brightness(82%) contrast(125%) saturate(75%);
        }

        /* Popup customization */
        .leaflet-container {
          background: #05070a !important;
          outline: none;
        }
        .custom-map-tooltip {
          background: #090c12e8 !important;
          border: 1px solid #1E293B !important;
          color: #F1F5F9 !important;
          font-family: monospace !important;
          border-radius: 6px !important;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.7) !important;
          backdrop-filter: blur(8px);
        }
        .custom-map-tooltip:before {
          border-right-color: #1E293B !important;
        }
      `}</style>

      {/* Actual Map Canvas DOM Element */}
      <div ref={mapRef} className="flex-1 w-full h-full z-10" />

      {/* -----------------------------------------------------------------------
          [LEFT TOP HUD] REAL-TIME EVENTS FEED
          ----------------------------------------------------------------------- */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none max-w-sm">
        {mapEvents.map(ev => (
          <div key={ev.id} className="pointer-events-auto flex items-center gap-2 px-3 py-2 bg-[#090C12]/95 border border-[#1E293B] rounded-lg shadow-xl backdrop-blur-md animate-slide-in duration-300">
            <span className={`h-1.5 w-1.5 rounded-full ${
              ev.type === 'success' ? 'bg-emerald-400' :
              ev.type === 'corridor' ? 'bg-[#D9EF92]' : 'bg-cyan-400'
            }`} />
            <span className="text-[10px] font-mono font-medium text-slate-300 uppercase leading-none">{ev.msg}</span>
          </div>
        ))}
      </div>

      {/* -----------------------------------------------------------------------
          [RIGHT TOP HUD] OPERATIONAL FLOATING INSTRUMENTS ZOOM CONTROL & STATE
          ----------------------------------------------------------------------- */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 pointer-events-none">
        
        {/* Core Zoom controls */}
        <div className="flex flex-col border border-[#1e2736] bg-[#070b10]/95 p-1.5 rounded-lg backdrop-blur-md gap-1 pointer-events-auto shadow-2xl">
          <button
            onClick={handleMapZoomIn}
            className="w-8 h-8 rounded bg-[#131d2a] hover:bg-[#D9EF92] text-slate-400 hover:text-black hover:scale-105 border border-white/[0.02] flex items-center justify-center transition-all cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleMapZoomOut}
            className="w-8 h-8 rounded bg-[#131d2a] hover:bg-[#D9EF92] text-slate-400 hover:text-black hover:scale-105 border border-white/[0.02] flex items-center justify-center transition-all cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleMapReset}
            className="w-8 h-8 rounded bg-[#131d2a] hover:bg-[#D9EF92] text-slate-400 hover:text-black hover:scale-105 border border-white/[0.02] flex items-center justify-center transition-all cursor-pointer"
            title="Recenter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Global toggles: V2X Slices and Cinematic lock */}
        <div className="flex flex-col border border-[#1e2736] bg-[#070b10]/98 p-2.5 rounded-xl backdrop-blur-md gap-2 pointer-events-auto shadow-2xl w-44">
          <div className="text-[8.5px] font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>OPERATIONS MATRIX</span>
          </div>
          
          <button
            onClick={() => {
              setFollowMode(!followMode);
              pushMapEvent(`Cinematic follow mode ${!followMode ? 'Engaged' : 'Suspended'}`);
            }}
            className={`flex items-center justify-between w-full p-1.5 rounded-lg text-[9px] font-mono tracking-wide transition-all border ${
              followMode 
                ? 'bg-[#D9EF92]/10 text-[#D9EF92] border-[#D9EF92]/20' 
                : 'bg-black/20 text-slate-500 border-slate-800'
            }`}
          >
            <span>CAMERA FOLLOW</span>
            <span className={`h-1.5 w-1.5 rounded-full ${followMode ? 'bg-[#D9EF92]' : 'bg-slate-700'}`} />
          </button>

          <button
            onClick={() => {
              setGNetworkActive(!gNetworkActive);
              pushMapEvent(`5G Slice network ${!gNetworkActive ? 'Routed' : 'Offline'}`);
            }}
            className={`flex items-center justify-between w-full p-1.5 rounded-lg text-[9px] font-mono tracking-wide transition-all border ${
              gNetworkActive 
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                : 'bg-black/20 text-slate-500 border-slate-800'
            }`}
          >
            <span>5G V2X SLICE</span>
            <span className={`h-1.5 w-1.5 rounded-full ${gNetworkActive ? 'bg-cyan-400' : 'bg-slate-700'}`} />
          </button>
        </div>

        {/* --- DYNAMIC COLLAPSIBLE MAP LEGEND OVERLAY --- */}
        <div className="flex flex-col border border-[#1e2736] bg-[#070b10]/98 p-3 rounded-xl backdrop-blur-md gap-2 pointer-events-auto shadow-2xl w-44 transition-all duration-300">
          <button 
            onClick={() => setLegendOpen(!legendOpen)}
            className="text-[8.5px] font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center justify-between w-full cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-[#D9EF92]" />
              <span>MAP LEGEND</span>
            </div>
            <span className="text-[7.5px] text-slate-500 font-bold font-mono">
              {legendOpen ? '▼' : '▲'}
            </span>
          </button>

          {legendOpen && (
            <div className="flex flex-col gap-2 pt-1.5 border-t border-slate-900 text-[8.5px] font-mono leading-none">
              
              {/* Road Classifications */}
              <div className="flex flex-col gap-1.5 pb-2 border-b border-white/[0.04]">
                <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Road Network</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-7 rounded-sm bg-[#3b82f6]" />
                  <span className="text-white">National Highway (NH)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-7 rounded-sm bg-[#60a5fa]" />
                  <span className="text-white">Major City Road</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-7 rounded-sm bg-[#eab308]" />
                  <span className="text-white">Local Street</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-7 rounded-sm border border-[#60a5fa]/40 bg-[#1e293b]" />
                  <span className="text-white">Elevated Flyover</span>
                </div>
              </div>

              {/* Signals and Infrastructure */}
              <div className="flex flex-col gap-1.5 pb-2 border-b border-white/[0.04]">
                <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Signals & V2X</span>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
                  <span className="text-white">Green Phase</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_#f59e0b]" />
                  <span className="text-white">Yellow Transition</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#ef4444]" />
                  <span className="text-white">Red / Override Phase</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 border-t border-dashed border-[#06b6d4]" />
                  <span className="text-cyan-400">V2X Comms Channel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 border-t border-dashed border-[#10b981]" />
                  <span className="text-emerald-400">Active Handshake</span>
                </div>
              </div>

              {/* Emergency assets & nodes */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[7px] text-slate-500 uppercase tracking-widest font-bold">Assets</span>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 bg-red-600/20 border border-red-500/30 text-red-500 flex items-center justify-center font-bold text-[7px] rounded">H</span>
                  <span className="text-white">Hospital Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-[#D9EF92]/20 border border-[#D9EF92]/30 rounded-full flex items-center justify-center text-[7px] font-bold text-[#D9EF92]">●</span>
                  <span className="text-white">Signal Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-purple-400">📷</span>
                  <span className="text-white">Traffic CCTV</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-400">🗼</span>
                  <span className="text-white">5G V2X Tower</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]">🚑</span>
                  <span className="text-white">Ambulance</span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          [CENTRAL MAP OVERLAY] ROUTE CALCULATION SCANNER OVERLAY
          ----------------------------------------------------------------------- */}
      {isCalculatingRoute && (
        <div className="absolute inset-0 bg-[#06090e]/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
          <div className="w-96 p-6 rounded-2xl bg-[#0e141f] border border-[#22334d] flex flex-col gap-4 shadow-3xl text-left">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D9EF92] animate-ping" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">V2X OPTIMIZER MATRIX</span>
                <strong className="text-sm font-sans font-extrabold text-white uppercase tracking-tight">Calculating Corridor Path...</strong>
              </div>
            </div>

            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-[#D9EF92] transition-all duration-300 rounded-full"
                style={{ width: `${routeCalcProgress * 100}%` }}
              />
            </div>
            
            <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider block">
              INITIALIZING SEQUENTIAL JUNCTION HANDSHAKES FOR TRANSIT TRAJECTORY ALPHA
            </span>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          [FLOATING CONTROLLER OVERLAYS] INTERNAL CANVASES & DETAILS PANEL HUD
          ----------------------------------------------------------------------- */}
      <div className="absolute inset-x-4 bottom-4 z-20 pointer-events-none flex flex-col gap-4 justify-end">
        
        {/* Real-time Ambulance Mission & ETA Countdown Dashboard */}
        {(() => {
          const activeRescueAmb = ambulances.find(a => a.status === 'Green Corridor Active' || a.status === 'En Route');
          const destHospital = activeRescueAmb ? hospitals.find(h => h.id === activeRescueAmb.route[activeRescueAmb.route.length - 1]) : null;
          
          if (!activeRescueAmb || !destHospital) return null;
          
          return (
            <div className="pointer-events-auto self-start bg-[#080d15]/95 border border-red-500/30 p-4 rounded-xl shadow-2xl backdrop-blur-md max-w-sm w-full text-left flex flex-col gap-3 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🚑</span>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-red-400 uppercase">ACTIVE TRANSIT CORRIDOR</span>
                    <strong className="text-xs font-sans text-white font-extrabold">{activeRescueAmb.name} ({activeRescueAmb.id})</strong>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-[9px] font-mono text-red-400 rounded-sm uppercase tracking-wide font-bold animate-pulse">
                  Critical Trauma
                </span>
              </div>

              <div className="h-px bg-white/[0.06]" />

              <div className="flex items-center gap-2.5 bg-black/40 p-2 border border-white/[0.04] rounded-lg">
                <span className="text-lg">🏥</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block leading-none">Receiving Trauma Hub</span>
                  <strong className="text-[11px] font-sans text-white font-bold truncate block">{destHospital.name}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-black/30 p-2 border border-white/[0.03] rounded-lg flex flex-col justify-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase">ETA Countdown</span>
                  <strong className="text-[#D9EF92] text-sm font-bold font-mono mt-0.5">
                    {Math.floor(activeRescueAmb.etaToHospital / 60)}m {activeRescueAmb.etaToHospital % 60}s
                  </strong>
                </div>
                <div className="bg-black/30 p-2 border border-white/[0.03] rounded-lg flex flex-col justify-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Current Velocity</span>
                  <strong className="text-white text-sm font-bold font-mono mt-0.5">
                    {Math.round(activeRescueAmb.speed || 68)} KM/H
                  </strong>
                </div>
              </div>

              {/* Simulated Live Route transit bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>Progress: {Math.round(activeRescueAmb.progress * 100)}%</span>
                  <span>5G-Slice Pre-emption Locked</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-[#D9EF92] transition-colors duration-300"
                    style={{ width: `${activeRescueAmb.progress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Dynamic Multi-Inspector Layer (Cameras, Towers, Junctions details in cards) */}
        <div className="flex flex-row flex-wrap items-end justify-between gap-4">
          
          {/* Dynamic Popup HUD (Left Align floating inspector) */}
          {(selectedJunction || selectedCamera || selectedTower) && (
            <div className="pointer-events-auto bg-[#070b10]/95 border border-[#1e2736] p-4 rounded-xl backdrop-blur-md shadow-2xl max-w-sm w-full md:w-85 flex flex-col gap-3 relative text-left">
              <button
                onClick={() => {
                  onSelectJunction(null);
                  setSelectedCameraId(null);
                  setSelectedTowerId(null);
                }}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] font-mono tracking-widest"
              >
                ✕ CLOSE
              </button>

              {/* CAMERA INTERACTIVE DIGITAL LIVE FEED OVERLAY */}
              {selectedCamera && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4.5 h-4.5 text-amber-400" />
                    <div className="flex flex-col">
                      <h4 className="font-sans font-bold text-xs text-white uppercase tracking-tight">{selectedCamera.name}</h4>
                      <span className="text-[7.5px] font-mono text-emerald-400 font-semibold tracking-wider">CCTV FEED READY • V2X FEED ON</span>
                    </div>
                  </div>

                  {/* Simulated Canvas live-feed box */}
                  <div className="relative h-44 rounded-lg bg-black border border-slate-900 overflow-hidden flex items-center justify-center uppercase font-mono text-[9px]">
                    
                    {/* Simulated live video scans */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none animate-pulse"></div>
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-red-400 font-bold tracking-wide">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                      LIVE FEED
                    </div>
                    
                    {/* Simulated Object bounds scanning boxes */}
                    <div className="absolute border border-amber-500/70 p-1 flex flex-col rounded text-[7px] text-amber-400 justify-between bg-amber-500/5" style={{ top: '25%', left: '15%', width: '38px', height: '24px' }}>
                      <span>CAR 98%</span>
                    </div>
                    <div className="absolute border border-emerald-400/80 p-1 flex flex-col rounded text-[7px] text-emerald-400 justify-between bg-emerald-500/5 border-dashed" style={{ top: '40%', right: '20%', width: '42px', height: '28px' }}>
                      <span>CAB 91%</span>
                    </div>

                    {/* Flashing target locator block for active ambulance */}
                    {(activeAmbulanceId || isReplayMode) && (
                      <div className="absolute border-2 border-[#D9EF92] p-1 flex flex-col rounded text-[8px] text-[#D9EF92] font-semibold justify-between bg-[#D9EF92]/10 animate-pulse" style={{ bottom: '15%', left: '38%', width: '74px', height: '42px' }}>
                        <span>AMB LOCKED</span>
                        <span className="text-[6.5px]">CONF: 99.8%</span>
                      </div>
                    )}

                    {/* Gridlines overlay */}
                    <div className="absolute inset-0 border border-white/[0.04] grid grid-cols-4 grid-rows-4 pointer-events-none">
                      {Array.from({ length: 16 }).map((_, idx) => (
                        <div key={idx} className="border border-white/[0.03]"></div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-900">
                    <div>RESOLUTION: <span className="text-white">1080P ARC</span></div>
                    <div>FPS RATE: <span className="text-white">60.2 FPS</span></div>
                    <div>CARS LOGGED: <span className="text-white">{selectedCamera.vehiclesDetected} VEHICLES</span></div>
                    <div>LATENCY: <span className="text-emerald-400">0.9 MS (5G)</span></div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => pushMapEvent(`Operator manually triggered wiper calibration on ${selectedCamera.id}`)}
                      className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[8.5px] font-mono text-white rounded cursor-pointer"
                    >
                      CLEAR OPTICS
                    </button>
                    <button
                      onClick={() => pushMapEvent(`Calibrated automated vehicle analytics counters`)}
                      className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[8.5px] font-mono text-white rounded cursor-pointer"
                    >
                      DYNAMIC CLASSIFY
                    </button>
                  </div>
                </div>
              )}

              {/* 5G TOWER SIGNAL DIAGNOSTIC OVERLAY */}
              {selectedTower && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                    <div className="flex flex-col">
                      <h4 className="font-sans font-bold text-xs text-white uppercase tracking-tight">{selectedTower.name}</h4>
                      <span className="text-[7.5px] font-mono text-cyan-400 font-semibold tracking-wider">5G BEAMFORMD CELL ACTIVE</span>
                    </div>
                  </div>

                  <div className="h-px bg-[#1F242E]" />

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9.5px] font-mono text-slate-400">
                    <span>Power Loadout:</span>
                    <span className="text-white text-right">45.2 dBm</span>
                    
                    <span>Slicing Isolation:</span>
                    <span className="text-[#D9EF92] text-right font-bold">Secured Slice #4</span>

                    <span>Ping Response:</span>
                    <span className="text-emerald-400 text-right">0.8 ms</span>

                    <span>Tower Status:</span>
                    <span className="text-cyan-400 text-right font-bold uppercase">{selectedTower.status}</span>
                  </div>

                  <div className="bg-slate-950 p-2 border border-slate-900 rounded-lg text-[8.5px] font-mono text-slate-400 leading-normal">
                    ACTIVE BEAMS DIRECTIONAL PATH STREAMS LOCKED TO EMERGENCIES SECTOR CHANNELS ON 3.5 GHz MID-BAND FREQUENCY SPECTRUM.
                  </div>

                  <button
                    onClick={() => {
                      pushMapEvent(`Forced telemetry ping request to tower ${selectedTower.id}`, 'system');
                    }}
                    className="w-full py-1.5 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-800 text-[#22D3EE] font-mono text-[9px] rounded font-bold cursor-pointer"
                  >
                    DEPLOY cellular slice ping
                  </button>
                </div>
              )}

              {/* JUNCTION OVERLAY */}
              {selectedJunction && !selectedCamera && (() => {
                // Determine Connected Signals
                const fId = selectedJunction.id;
                const connectedSigs = roads
                  .filter(r => r.fromNode === fId || r.toNode === fId)
                  .map(r => r.fromNode === fId ? r.toNode : r.fromNode)
                  .filter(id => id !== fId && junctions.some(jn => jn.id === id));
                const connectedSigsStr = connectedSigs.length > 0 ? connectedSigs.join(', ') : 'None';

                // Determine Nearest Hospital
                let nearestH = hospitals[0];
                let minD = Infinity;
                hospitals.forEach(h => {
                  const dist = Math.hypot(h.lat - selectedJunction.lat, h.lng - selectedJunction.lng);
                  if (dist < minD) {
                    minD = dist;
                    nearestH = h;
                  }
                });

                // Determine Emergency Status
                const activeAmbulance = ambulances.find(a => a.status === 'Green Corridor Active' || a.status === 'En Route');
                let emergencyStatusText = '🟢 SYNCHRONIZED';
                let isEmergencyWaveOn = false;
                if (activeAmbulance) {
                  const pathIdx = activeAmbulance.route.indexOf(fId);
                  const currIdx = activeAmbulance.routeIndex;
                  if (pathIdx !== -1) {
                    if (pathIdx === currIdx) {
                      emergencyStatusText = '🚑 ACTIVE GREEN CORRIDOR LOCK';
                      isEmergencyWaveOn = true;
                    } else if (pathIdx === currIdx + 1) {
                      emergencyStatusText = '⚡ PRE-EMPTIVE OVERRIDE ACTIVATE';
                      isEmergencyWaveOn = true;
                    } else if (pathIdx > currIdx) {
                      emergencyStatusText = '🟡 PREPARING SECURED SLICE';
                      isEmergencyWaveOn = true;
                    } else {
                      emergencyStatusText = '🟢 RESTORING STANDARD PATTERNS';
                    }
                  }
                }

                return (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Signal className={`w-4.5 h-4.5 ${isEmergencyWaveOn ? 'text-red-500 animate-pulse' : 'text-[#D9EF92]'}`} />
                      <div className="flex flex-col">
                        <h4 className="font-sans font-bold text-xs text-white uppercase tracking-tight">{selectedJunction.name}</h4>
                        <span className="text-[7.5px] font-mono text-emerald-400 font-semibold tracking-wider uppercase">
                          {isEmergencyWaveOn ? 'V2X SLICE LOCK ACTIVE' : 'ARKA COORD NODE SYNCHRONIZED'}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9.5px] font-mono text-slate-400">
                      <span>Signal ID:</span>
                      <span className="text-white text-right font-bold">{selectedJunction.id}</span>

                      <span>Junction Name:</span>
                      <span className="text-white text-right truncate max-w-[120px]" title={selectedJunction.name}>{selectedJunction.name}</span>

                      <span>Coordinates:</span>
                      <span className="text-white text-right">{selectedJunction.lat.toFixed(4)}, {selectedJunction.lng.toFixed(4)}</span>

                      <span>Current Phase:</span>
                      <span className="text-[#D9EF92] text-right font-bold uppercase truncate">{selectedJunction.phase}</span>

                      <span>Queue Length:</span>
                      <span className="text-white text-right">{selectedJunction.queueLength} vehicles waiting</span>
                      
                      <span>Density Rate:</span>
                      <span className="text-white text-right">{selectedJunction.density}%</span>

                      <span>Phase Clock:</span>
                      <span className="text-white text-right">{selectedJunction.waitSec}s remaining</span>

                      <span>Avg Wait Time:</span>
                      <span className="text-white text-right">{selectedJunction.avgWaitTime || 35}s</span>

                      <span>Connected Signals:</span>
                      <span className="text-cyan-400 text-right truncate max-w-[120px]" title={connectedSigsStr}>{connectedSigsStr}</span>

                      <span>Nearest Camera:</span>
                      <span className="text-amber-400 text-right">{selectedJunction.cameraId || `CAM-${selectedJunction.id}`}</span>

                      <span>Nearest Hosp:</span>
                      <span className="text-rose-400 text-right truncate max-w-[120px]" title={nearestH.name}>{nearestH.name}</span>

                      <span>Emerg Status:</span>
                      <span className={`text-right font-bold ${isEmergencyWaveOn ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                        {emergencyStatusText}
                      </span>
                    </div>

                    {/* Flow gauge line bar */}
                    <div className="h-1 bg-slate-900 rounded overflow-hidden mt-1">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          selectedJunction.density > 75 ? 'bg-red-500 animate-pulse' :
                          selectedJunction.density > 45 ? 'bg-amber-500' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${selectedJunction.density}%` }}
                      />
                    </div>

                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => onOpenFeed && onOpenFeed(selectedJunction.id)}
                        className="flex-1 py-1.5 bg-[#D9EF92]/10 hover:bg-[#D9EF92]/20 border border-[#D9EF92]/30 text-[#D9EF92] rounded font-mono text-[8.5px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        CCTV FEED
                      </button>
                      <button
                        onClick={() => {
                          pushMapEvent(`Manual queue drainage triggered at intersection ${selectedJunction.id}`, 'alert');
                        }}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded font-mono text-[8.5px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        DRAIN QUEUE
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Spacer to push layer panel to center bottom */}
          <div></div>

          {/* Floating bottom switches tray (Quick map overlays settings toggles) */}
          <div className="pointer-events-auto bg-[#070b10]/95 border border-[#1e2736] p-1.5 rounded-xl backdrop-blur-md shadow-2xl flex flex-wrap items-center gap-1.5 justify-end">
            <button
              onClick={() => setLayers(l => ({ ...l, ambulances: !l.ambulances }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wide transition-all cursor-pointer border ${
                layers.ambulances 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                  : 'bg-black/20 text-slate-500 border-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>AMBULANCES</span>
            </button>

            <button
              onClick={() => setLayers(l => ({ ...l, density: !l.density }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wide transition-all cursor-pointer border ${
                layers.density 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-black/20 text-slate-500 border-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>DENSITY FLOW</span>
            </button>

            <button
              onClick={() => setLayers(l => ({ ...l, signals: !l.signals }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wide transition-all cursor-pointer border ${
                layers.signals 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-black/20 text-slate-500 border-slate-800'
              }`}
            >
              <Signal className="w-3.5 h-3.5" />
              <span>JUNCTIONS</span>
            </button>

            <button
              onClick={() => setLayers(l => ({ ...l, hospitals: !l.hospitals }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wide transition-all cursor-pointer border ${
                layers.hospitals 
                  ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                  : 'bg-black/20 text-slate-500 border-slate-800'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>HOSPITALS</span>
            </button>

            <button
              onClick={() => setLayers(l => ({ ...l, cameras: !l.cameras }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wide transition-all cursor-pointer border ${
                layers.cameras 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                  : 'bg-black/20 text-slate-500 border-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>CAMERAS</span>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            [INTERACTIVE MISSION REPLAY PANEL] PLAYBACK CONTROLLER TIMELINE SCRUBBER
            --------------------------------------------------------------------- */}
        <div className="pointer-events-auto bg-[#070b10]/98 border border-[#1e2736] p-4 rounded-xl shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center gap-4 text-left select-none">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setIsReplayMode(!isReplayMode);
                setReplayPlaying(false);
                pushMapEvent(`Switched timeline context to ${!isReplayMode ? 'Flight Playback Replay' : 'Simulation Realtime Live'}`);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase border cursor-pointer transition-colors ${
                isReplayMode 
                  ? 'bg-[#D9EF92]/15 text-[#D9EF92] border-[#D9EF92]/30 animate-pulse' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {isReplayMode ? '• REPLAY MODE ON' : 'ENTER REPLAY MODE'}
            </button>

            {isReplayMode && (
              <div className="flex items-center gap-1 bg-black/40 border border-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setReplayPlaying(!replayPlaying)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-900 border border-slate-800 text-[#D9EF92] hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title={replayPlaying ? 'Pause' : 'Play'}
                >
                  {replayPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-[#D9EF92]" />}
                </button>
                <button
                  onClick={() => setReplayProgress(0)}
                  className="w-7 h-7 flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Rewind/Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setReplaySpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
                  className="px-1.5 py-1 text-[8.5px] font-mono font-bold text-[#D9EF92] bg-slate-950 border border-slate-900 rounded transition-all select-none hover:bg-slate-850 shrink-0 cursor-pointer"
                  title="Speed Factor multiplier"
                >
                  {replaySpeed}X speed
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 w-full flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <Sliders className="w-3.5 h-3.5 text-[#D9EF92]" />
                {isReplayMode ? selectedMissionTitle : 'LIVE COORDINATED SIMULATOR CHRONICLE'}
              </span>
              <span className="text-[#D9EF92]">
                {isReplayMode ? `FLIGHT TRACK: ${replayProgress}%` : 'CONNECTED ENGINE IN REAL-TIME'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[8.5px] font-mono text-slate-500 select-none shrink-0">00:00</span>
              <input
                type="range"
                min="0"
                max="100"
                disabled={!isReplayMode}
                value={isReplayMode ? replayProgress : 100}
                onChange={(e) => setReplayProgress(Number(e.target.value))}
                className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-950 outline-none border border-slate-900 accent-[#D9EF92] ${
                  !isReplayMode ? 'opacity-30' : ''
                }`}
                style={{
                  background: `linear-gradient(to right, #D9EF92 0%, #D9EF92 ${isReplayMode ? replayProgress : 100}%, #090e14 ${isReplayMode ? replayProgress : 100}%, #090e14 100%)`
                }}
              />
              <span className="text-[8.5px] font-mono text-slate-500 select-none shrink-0">
                {isReplayMode ? '04:52' : 'INF.'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* -----------------------------------------------------------------------
          [SLIDING RIGHT SIDEBAR] DETAILED CLINICAL TELEMETRY AMBULANCE SIDE PANEL
          ----------------------------------------------------------------------- */}
      <div 
        className={`absolute top-0 right-0 h-full w-85 bg-[#070b10]/98 border-l border-[#1e2736] z-25 shadow-3xl transform transition-transform duration-300 ease-in-out pointer-events-auto flex flex-col text-left ${
          (selectedAmbulance || isReplayMode) ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-[#222F3A] flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-[#D9EF92]" />
            <div className="flex flex-col">
              <h3 className="font-sans font-bold text-xs text-white uppercase tracking-tight">
                {isReplayMode ? 'Ambulance Alpha-102' : (selectedAmbulance?.name || 'POLICING V2X UNIT')}
              </h3>
              <span className="text-[8px] font-mono text-sky-400 font-bold tracking-widest uppercase">
                {isReplayMode ? 'REPLAY FLIGHT ANALYSIS' : 'SECURED TELEMETRY SYSTEM'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onSelectAmbulance(null);
            }}
            className="text-[10px] font-mono text-slate-400 hover:text-white transition-colors uppercase border border-slate-850 px-2 py-0.5 rounded cursor-pointer"
          >
            ✕ RECAL
          </button>
        </div>

        {/* Outer scrolling content */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 custom-scrollbars">
          
          {/* Main Mission Timeline status */}
          <div className="bg-[#0b1016] border border-[#1e2736] p-3.5 rounded-xl flex flex-col gap-2 relative">
            <span className="text-[8px] font-mono text-[#D9EF92] border border-[#D9EF92]/20 bg-[#D9EF92]/5 px-1.5 py-0.5 rounded cursor-default uppercase font-bold tracking-wider absolute top-3 right-3 select-none">
              LEVEL Critical
            </span>
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider font-semibold">MISSION STATUS</span>
            <strong className="text-sm font-sans font-extrabold text-white uppercase leading-none tracking-tight">CORRIDOR WAVE ACTIVE</strong>
            
            <div className="h-px bg-slate-800 my-1" />

            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-slate-300">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-[8px] uppercase">Telemetry Speed</span>
                <strong className="text-[#D9EF92] text-xs">
                  {isReplayMode && currentReplayFrame ? Math.round(currentReplayFrame.speed) : Math.round(selectedAmbulance?.speed || 88)} KM/H
                </strong>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-[8px] uppercase">Estimated ETA</span>
                <strong className="text-white text-xs">
                  {isReplayMode ? '1m 24s' : `${Math.floor((selectedAmbulance?.etaToHospital || 180) / 60)}m ${Math.floor((selectedAmbulance?.etaToHospital || 180) % 60)}s`}
                </strong>
              </div>
              <div className="flex flex-col gap-0.5 col-span-2">
                <span className="text-slate-500 text-[8px] uppercase">Destination Point</span>
                <strong className="text-white text-xs font-semibold truncate uppercase">
                  {isReplayMode ? 'Apollo Hospital Trauma Hub' : (selectedAmbulance?.route[selectedAmbulance.route.length - 1] || 'CAPITAL HOSPITAL')}
                </strong>
              </div>
            </div>
          </div>

          {/* Vitals monitoring sine waves (Simulating ICU patient cardiac telemetry) */}
          <div className="bg-slate-950 border border-[#1e2736] rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider font-semibold">PATIENT CLINICAL VITALS</span>
              <PulseIcon className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>

            {/* Simulated Live ECG wave graph */}
            <div className="relative h-12 bg-[#020509] rounded-lg border border-slate-900 overflow-hidden flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" className="w-full h-full text-emerald-500 stroke-current opacity-85" fill="none" strokeWidth={1.5}>
                <path d="M0,15 L10,15 L15,10 L18,22 L22,4 L26,15 L40,15 L45,15 L50,15 L55,10 L58,22 L62,4 L66,15 L80,15 L100,15" className="animate-pulse" />
              </svg>
              <div className="absolute top-2 right-2 font-mono text-[9px] text-emerald-400 font-bold">HR: 84 BPM</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1 font-semibold uppercase">
                <span className="h-1 w-1 bg-[#22C55E] rounded-full" />
                Blood Ox: <span className="text-white font-bold ml-auto">98.5%</span>
              </span>
              <span className="flex items-center gap-1 font-semibold uppercase">
                <span className="h-1 w-1 bg-[#3B82F6] rounded-full" />
                Oxygen Tank: <span className="text-white font-bold ml-auto">12 BAR</span>
              </span>
            </div>
          </div>

          {/* Strategic Mission Timeline Stepper checkmarks */}
          <div className="flex flex-col gap-3">
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider font-semibold">OPERATIONS DIARY LOG</span>
            <div className="flex flex-col gap-3 pl-1 border-l border-[#1e2736] ml-2">
              {[
                { stage: 'Proximity Dispatch', time: '11:42:01', done: true, desc: 'GPS geo-gimmick registers exit of AIIMS base point.' },
                { stage: '5G Slice secured', time: '11:42:15', done: true, desc: 'Spectrum beamforming locked to sector macrocells.' },
                { stage: 'Green Wave Overrides', time: '11:43:08', done: isReplayMode ? replayProgress > 30 : true, desc: 'Sequentially draining Jaydev Vihar & Acharya junctions.' },
                { stage: 'Docking hospital bay', time: 'ETA 1m', done: isReplayMode ? replayProgress >= 99 : false, desc: 'Auto notified triage nurses of trauma entrance.' }
              ].map((step, sIdx) => (
                <div key={sIdx} className="relative flex flex-col gap-1 pl-4">
                  {/* Stepper Bullet pointer */}
                  <span className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full border border-slate-900 transition-colors ${
                    step.done ? 'bg-[#D9EF92]' : 'bg-[#1e2736]'
                  }`} />
                  <div className="flex items-center justify-between text-[11px] font-sans font-bold text-white uppercase leading-none">
                    <span>{step.stage}</span>
                    <span className="text-[9px] font-mono text-slate-500 font-normal">{step.time}</span>
                  </div>
                  <p className="text-[9.5px] text-gray-400 leading-normal">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Core manual controls actions */}
          <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-[#1e2736]">
            <button
              onClick={() => {
                pushMapEvent(`FORCED EMERGENCY SIREN BYPASS EMITTED FOR ${selectedAmbulance?.id || 'ALPHA-102'}`, 'alert');
              }}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black rounded font-mono text-[9.5px] font-extrabold uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <Volume2 className="w-4 h-4" />
              <span>FORCE SIREN BYPASS</span>
            </button>
            <button
              onClick={() => {
                pushMapEvent(`Alternative route generation matrix evaluated`, 'system');
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded font-mono text-[9.5px] font-bold uppercase tracking-wider cursor-pointer"
            >
              CALIBRATE alternative route
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
