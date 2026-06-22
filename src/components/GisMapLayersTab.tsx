import React, { useState } from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Sliders, 
  MapPin, 
  Radio, 
  CloudSun, 
  Camera, 
  Compass,
  Tv,
  HelpCircle,
  Plus, 
  Minus,
  RotateCcw,
  Check
} from 'lucide-react';
import { Junction, RoadSegment, Hospital, Ambulance } from '../types';
import GisMap from './GisMap';

interface GisMapLayersTabProps {
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
}

export default function GisMapLayersTab({
  junctions,
  roads,
  hospitals,
  ambulances,
  activeJunctionId,
  onSelectJunction,
  activeAmbulanceId,
  onSelectAmbulance,
  layers,
  setLayers
}: GisMapLayersTabProps) {

  // Advanced Map Layers State variables
  const [opacity, setOpacity] = useState<number>(85); // out of 100
  const [enableClustering, setEnableClustering] = useState<boolean>(true);
  const [mapTheme, setMapTheme] = useState<'cyber-dark' | 'satellite' | 'terrain'>('cyber-dark');

  // Multi layer checklist mapping
  const layerMeta = [
    { key: 'roads', name: 'Road Network', desc: 'Structural Bhubaneswar motorways and link roads', icon: Compass, color: 'text-indigo-400' },
    { key: 'signals', name: 'Traffic Signals Nodes', desc: 'Intelligent pre-emption enabled intersections', icon: Tv, color: 'text-[#D9EF92]' },
    { key: 'hospitals', name: 'Hospitals Status', desc: 'Surgical and ICU trauma bed networks', icon: HeartCheckIcon, color: 'text-rose-400' },
    { key: 'ambulances', name: 'Live Ambulances', desc: 'Active en-route medical responder assets', icon: MapPin, color: 'text-red-400' },
    { key: 'cameras', name: 'Sensors / Cameras', desc: 'YOLOv11 AI acoustic/volume vision cameras', icon: Camera, color: 'text-blue-400' },
    { key: 'weather', name: 'Weather Layer Overlay', desc: 'Microclimate, humidity and wet road friction ratios', icon: CloudSun, color: 'text-sky-400' },
    { key: 'corridors', name: 'Emergency 5G Corridors', desc: 'MmWave high priority slice routes', icon: Radio, color: 'text-[#D9EF92]' },
    { key: 'density', name: 'Traffic Density Cells', desc: 'Dynamic lane vehicle counts heatmap', icon: Layers, color: 'text-amber-400 animate-pulse' },
    { key: 'accidents', name: 'Historical Accident Zones', desc: 'Hotspots prone to high-speed severe collision risk', icon: InfoIcon, color: 'text-red-500' }
  ];

  // Helper toggle
  const toggleLayerField = (key: string) => {
    setLayers((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Advanced GIS Map Layers Dashboard</h2>
          <p className="text-xs text-gray-400">
            Control spatial layers, overlay alphas, grid densities, and telemetry clusters centered on Bhubaneswar City.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Side Controls / Right Side large interactive Gis Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Layout Config (4 columns) */}
        <div className="lg:col-span-4 bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-5">
          
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#D9EF92]" />
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
              GIS Shader & Layer Controls
            </h3>
          </div>

          <div className="h-px bg-[#1F242E]" />

          {/* Opacity slider */}
          <div className="flex flex-col gap-2 bg-[#0A0C11] p-3 rounded-lg border border-[#1F242E]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Map Alpha / Opacity</span>
              <strong className="text-[#D9EF92]">{opacity}%</strong>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#1F242E] rounded-lg appearance-none cursor-pointer accent-[#D9EF92] focus:outline-none"
            />
          </div>

          {/* Theme select & Marker clustering */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0A0C11] p-3 rounded-lg border border-[#1F242E] flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-gray-500 uppercase">Map Theme</span>
              <select
                value={mapTheme}
                onChange={(e) => setMapTheme(e.target.value as any)}
                className="bg-black text-xs font-mono text-white border border-[#1F242E] p-1.5 focus:outline-none focus:border-[#D9EF92] rounded cursor-pointer"
              >
                <option value="cyber-dark">Cyber Command</option>
                <option value="satellite">Satellite Earth</option>
                <option value="terrain">GIS Topography</option>
              </select>
            </div>

            <div className="bg-[#0A0C11] p-3 rounded-lg border border-[#1F242E] flex flex-col justify-between">
              <span className="text-[9px] font-mono text-gray-500 uppercase">Marker Clustering</span>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-mono text-gray-300">Enabled</span>
                <button
                  type="button"
                  onClick={() => setEnableClustering(!enableClustering)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${enableClustering ? 'bg-[#D9EF92]' : 'bg-gray-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 ${enableClustering ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#1F242E]" />

          {/* Layers Selection Checklist */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-1">
              Toggle Overlay GIS Vectors
            </span>

            <div className="flex flex-col gap-2">
              {layerMeta.map((layer) => {
                const LayerIcon = layer.icon;
                const isSelected = (layers as any)[layer.key];

                return (
                  <button
                    key={layer.key}
                    onClick={() => toggleLayerField(layer.key)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer group ${
                      isSelected 
                        ? 'bg-[#1C2029]/35 border-[#D9EF92]/30 text-white' 
                        : 'bg-black/20 border-[#1F242E] text-gray-400 hover:border-white/10'
                    }`}
                  >
                    <div className={`p-1.5 rounded bg-[#0A0C11] ${layer.color} border border-[#1F242E] group-hover:scale-105 transition-all shrink-0`}>
                      <LayerIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 flex flex-col text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-sans tracking-wide">{layer.name}</span>
                        {isSelected ? (
                          <span className="p-0.5 rounded bg-[#D9EF92]/10 text-[#D9EF92]">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <EyeOff className="w-3 h-3 text-gray-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 leading-normal font-mono mt-0.5">{layer.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Gigantic interactive GIS Map board (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div 
            className="border border-[#1F242E] rounded-xl overflow-hidden shadow-2xl h-[610px]"
            style={{ opacity: opacity / 100 }}
          >
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
              simulationTicking={true}
            />
          </div>

          {/* Quick HUD controls help strip */}
          <div className="bg-[#0F1115] border border-[#1F242E] p-3 rounded-xl flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span className="uppercase">Coordinates Focus: Centered on Bhubaneswar city grid link 20.2961° N, 85.8245° E</span>
            <span>Clustering Engine: {enableClustering ? 'DBSCAN Enabled' : 'Disabled'}</span>
          </div>
        </div>

      </div>

    </div>
  );
}

// Minimal helper inline icons to safeguard lucide exports
function HeartCheckIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function InfoIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
