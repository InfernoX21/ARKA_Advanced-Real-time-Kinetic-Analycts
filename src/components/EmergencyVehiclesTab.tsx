import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Search, 
  SlidersHorizontal,
  Compass, 
  MapPin, 
  Heart, 
  Clock, 
  Eye, 
  Wrench, 
  Battery, 
  Wifi, 
  ChevronRight,
  TrendingUp,
  Info,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle,
  Play
} from 'lucide-react';
import { Ambulance, AmbulanceStatus } from '../types';
import GisMap from './GisMap';

interface EmergencyVehiclesProps {
  ambulances: Ambulance[];
  onSelectAmbulance: (id: string) => void;
  onDispatchAmbulance: (id: string) => void;
  junctions: any;
  roads: any;
  hospitals: any;
  layers: any;
  setLayers: any;
}

export default function EmergencyVehiclesTab({
  ambulances,
  onSelectAmbulance,
  onDispatchAmbulance,
  junctions,
  roads,
  hospitals,
  layers,
  setLayers
}: EmergencyVehiclesProps) {

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedVehId, setSelectedVehId] = useState<string>('A-102');
  const [sortBy, setSortBy] = useState<'id' | 'fuel' | 'speed'>('id');

  // Currently selected vehicle for drawer/details card
  const selectedVeh = useMemo(() => {
    return ambulances.find(a => a.id === selectedVehId) || ambulances[0];
  }, [ambulances, selectedVehId]);

  // Filter & sort list
  const filteredAmbulances = useMemo(() => {
    let list = ambulances;
    
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(a => 
        a.id.toLowerCase().includes(s) || 
        a.driver.toLowerCase().includes(s) || 
        a.name.toLowerCase().includes(s) ||
        a.currentMission.toLowerCase().includes(s)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter(a => a.status.toUpperCase() === statusFilter.toUpperCase());
    }

    // Sort list
    return [...list].sort((a, b) => {
      if (sortBy === 'fuel') return b.fuelLevel - a.fuelLevel;
      if (sortBy === 'speed') return b.speed - a.speed;
      return a.id.localeCompare(b.id);
    });

  }, [ambulances, search, statusFilter, sortBy]);

  // Network bars indicator helper
  const getNetworkColor = (status: Ambulance['networkStatus']) => {
    if (status === '5G Slice Secured') return 'text-[#D9EF92]';
    if (status === 'Connected') return 'text-emerald-400';
    if (status === 'Poor Cell Coverage') return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: AmbulanceStatus) => {
    switch (status) {
      case 'Available': 
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">AVAILABLE</span>;
      case 'Dispatched':
      case 'En Route':
      case 'Green Corridor Active':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase animate-pulse">{status}</span>;
      case 'At Hospital':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">AT HOSPITAL</span>;
      case 'Maintenance':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">WRENCH</span>;
      default:
        return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">OFFLINE</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header action controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Active Emergency Fleets Management</h2>
          <p className="text-xs text-gray-400">
            Real-time tracking of trauma ambulance assets, telemetry, and smart network health indexes.
          </p>
        </div>

        {/* Global stats indicators */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="bg-[#0F1115] border border-[#1F242E] px-4 py-2 rounded-xl flex flex-col">
            <span className="text-[8.5px] font-mono text-gray-500 uppercase">Available Units</span>
            <strong className="text-sm text-emerald-400 font-sans font-bold">
              {ambulances.filter(a => a.status === 'Available').length} / {ambulances.length}
            </strong>
          </div>
          <div className="bg-[#0F1115] border border-[#1F242E] px-4 py-2 rounded-xl flex flex-col">
            <span className="text-[8.5px] font-mono text-gray-500 uppercase">Average Fuel level</span>
            <strong className="text-sm text-[#D9EF92] font-sans font-bold">
              {Math.round(ambulances.reduce((acc, a) => acc + a.fuelLevel, 0) / ambulances.length)}%
            </strong>
          </div>
          <div className="bg-[#0F1115] border border-[#1F242E] px-4 py-2 rounded-xl flex flex-col">
            <span className="text-[8.5px] font-mono text-gray-500 uppercase">High Priority Missions</span>
            <strong className="text-sm text-red-400 font-sans font-bold">
              {ambulances.filter(a => a.priorityLevel === 'CRITICAL').length} Units
            </strong>
          </div>
        </div>
      </div>

      {/* Primary Split: Left Table List / Right Mini-Map + Drawer details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Search filters + Table (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <div className="bg-[#0F1115] border border-[#1F242E] p-4 rounded-xl flex flex-col sm:flex-row gap-3.5 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vehicle driver or mission..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#1F242E] bg-black text-[#D9EF92] text-xs focus:outline-none focus:border-[#D9EF92] transition-colors"
              />
            </div>

            {/* Status Tabs and sorting */}
            <div className="flex gap-2.5 items-center flex-wrap w-full sm:w-auto justify-end">
              <div className="flex bg-[#0A0C11] p-1 rounded-lg border border-[#1F242E] gap-1">
                {['ALL', 'AVAILABLE', 'EN ROUTE', 'MAINTENANCE'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-[10px] font-semibold font-mono rounded cursor-pointer uppercase transition-colors ${
                      statusFilter === st ? 'bg-[#D9EF92] text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-black text-[10px] font-mono border border-[#1F242E] text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#D9EF92] cursor-pointer"
              >
                <option value="id">Sort: ID</option>
                <option value="fuel">Sort: Fuel</option>
                <option value="speed">Sort: Speed</option>
              </select>
            </div>
          </div>

          {/* Vehicles list table */}
          <div className="bg-[#0F1115] border border-[#1F242E] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0A0C11] border-b border-[#1F242E] text-gray-400 font-mono text-[10.5px] tracking-wide">
                    <th className="p-4 uppercase">VEHICLE INFO</th>
                    <th className="p-4 uppercase">DRIVER / DEPT</th>
                    <th className="p-4 uppercase">LOCATION STATUS</th>
                    <th className="p-4 uppercase">BATTERY/FUEL</th>
                    <th className="p-4 uppercase">5G SIGNAL</th>
                    <th className="p-4 uppercase text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F242E]/70">
                  {filteredAmbulances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                        No vehicles matching filters registered in Bhubaneswar sectors.
                      </td>
                    </tr>
                  ) : (
                    filteredAmbulances.map((veh) => {
                      const isSelected = veh.id === selectedVehId;
                      return (
                        <tr 
                          key={veh.id}
                          onClick={() => setSelectedVehId(veh.id)}
                          className={`hover:bg-[#1C2029]/30 transition-colors cursor-pointer select-none ${
                            isSelected ? 'bg-[#1C2029]/80 border-l-2 border-[#D9EF92]' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-xs">{veh.id}</span>
                              <span className="text-[10px] text-gray-500 font-mono uppercase">{veh.type}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-semibold text-white">
                            <div className="flex flex-col">
                              <span>{veh.driver}</span>
                              <span className="text-[10px] text-gray-500 font-normal">Trauma Emergency Squad</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(veh.status)}
                              <span className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">
                                {veh.currentMission === 'None' ? 'Standby Sector 4 Yard' : veh.currentMission}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-gray-300">
                            <div className="flex items-center gap-1.5">
                              <Battery className={`w-4 h-4 ${veh.fuelLevel > 30 ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`} />
                              <span>{veh.fuelLevel}%</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono">
                            <div className="flex items-center gap-1 text-[10.5px]">
                              <Wifi className={`w-3.5 h-3.5 ${getNetworkColor(veh.networkStatus)}`} />
                              <span className="text-gray-300">{veh.networkStatus}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            {veh.status === 'Available' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDispatchAmbulance(veh.id);
                                }}
                                className="bg-[#D9EF92]/10 hover:bg-[#D9EF92] text-[#D9EF92] hover:text-black border border-[#D9EF92]/20 px-2.5 py-1 text-[10.5px] font-semibold font-mono rounded cursor-pointer uppercase transition-all flex items-center gap-1 ml-auto"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                DISPATCH
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVehId(veh.id);
                                }}
                                className="border border-[#1F242E] bg-black text-gray-400 hover:text-white px-2 py-1 text-[10px] font-mono rounded inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Telemetry
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Fleet Position Map & Details Side Drawer Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Mini-map Tracing Positions */}
          <div className="bg-[#0F1115] border border-[#1F242E] rounded-xl overflow-hidden p-4">
            <h3 className="text-xs font-sans font-bold text-white uppercase tracking-wider mb-2.5">
              Live Fleet Coordinates
            </h3>
            <div className="h-[210px] relative rounded-lg border border-[#1F242E]">
              <GisMap
                junctions={junctions}
                roads={roads}
                hospitals={hospitals}
                ambulances={ambulances}
                activeJunctionId={null}
                onSelectJunction={() => {}}
                activeAmbulanceId={selectedVehId}
                onSelectAmbulance={setSelectedVehId}
                layers={{ ...layers, density: false, accidents: false, weather: false }}
                setLayers={setLayers}
                simulationTicking={true}
              />
            </div>
          </div>

          {/* VEHICLE DETAILS DRAWER CARD */}
          {selectedVeh && (
            <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 text-left select-none shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#D9EF92] bg-[#D9EF92]/5 border border-[#D9EF92]/10 px-2 py-0.5 rounded">
                    {selectedVeh.id} COMMAND UNIT
                  </span>
                  <h3 className="font-sans font-bold text-base text-white mt-1 uppercase">{selectedVeh.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${selectedVeh.status === 'Available' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">{selectedVeh.status}</span>
                </div>
              </div>

              <div className="h-px bg-[#1F242E]" />

              <div className="flex flex-col gap-3 font-mono text-[11px] text-gray-400">
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>Duty Officer / Driver:</span>
                  <strong className="text-white">{selectedVeh.driver}</strong>
                </div>
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>Department Fleet Specialty:</span>
                  <strong className="text-[#D9EF92]">{selectedVeh.type}</strong>
                </div>
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>Speed telematics:</span>
                  <strong className="text-white">{selectedVeh.speed} km/h (Live GPS)</strong>
                </div>
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>Last maintenance audit:</span>
                  <strong className="text-white">{selectedVeh.lastMaintenance}</strong>
                </div>
                <div className="flex justify-between border-b border-[#1F242E]/50 pb-2">
                  <span>Fuel / Battery:</span>
                  <strong className={selectedVeh.fuelLevel > 50 ? 'text-[#D9EF92]' : 'text-red-400'}>
                    {selectedVeh.fuelLevel}% Charge Left
                  </strong>
                </div>
              </div>

              {/* Historical Trips */}
              <div className="flex flex-col gap-2 mt-1">
                <span className="text-[9.5px] font-mono text-gray-500 uppercase tracking-wider block">
                  Historical Incident Logs (Saved Lives)
                </span>
                
                {selectedVeh.historicalTrips && selectedVeh.historicalTrips.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto bg-black border border-[#1F242E] p-2.5 rounded-lg">
                    {selectedVeh.historicalTrips.map((trip) => (
                      <div key={trip.id} className="border-b border-[#1F242E]/60 pb-2 last:pb-0 last:border-0 text-[10.5px] font-mono text-left flex items-start justify-between gap-2.5">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{trip.type}</span>
                          <span className="text-gray-500 text-[9px] mt-0.5">{trip.date} • {trip.hospital}</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[#D9EF92] font-semibold">-{trip.savedMin}m saved</span>
                          <span className="text-gray-500 text-[9px] mt-0.5">{trip.durationMin}m travel</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 font-mono py-4 text-center border border-dashed border-[#1F242E] rounded-lg">
                    No travel history captured for current maintenance cycle.
                  </p>
                )}
              </div>

              {/* Operations check */}
              {selectedVeh.status === 'Available' && (
                <button
                  onClick={() => onDispatchAmbulance(selectedVeh.id)}
                  className="w-full bg-[#D9EF92] hover:bg-[#c2e47c] text-black py-2 text-xs font-bold font-mono rounded-lg cursor-pointer uppercase transition-colors text-center"
                >
                  DISPATCH TO ACTIVE TRAUMA CORRIDOR
                </button>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
