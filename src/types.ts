export type JunctionPhase = 'N-S Bound' | 'E-W Bound' | 'Turning Phase' | 'Emergency Override';

export interface Junction {
  id: string;
  name: string;
  x: number; // percentage width of map layout (0-100)
  y: number; // percentage height of map layout (0-100)
  lat: number;
  lng: number;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'OVERRIDE';
  queueLength: number; // total vehicles waiting
  phase: JunctionPhase;
  waitSec: number;
  avgWaitTime: number;
  density: number; // percentage (0-100)
  cameraId: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  fromNode: string; // Junction ID or Hospital ID
  toNode: string;
  congestion: 'free' | 'moderate' | 'heavy' | 'critical';
  vehicleCount: number;
  avgSpeed: number; // km/h
  direction: 'unidirectional' | 'bidirectional';
  type: 'primary' | 'secondary' | 'highway' | 'hospital-access';
  isFlyover?: boolean;
  flyoverName?: string;
  length?: string;
  trafficDensity?: number;
  emergencyAccessibilityScore?: number;
}

export type AmbulanceStatus = 
  | 'Available' 
  | 'Dispatched' 
  | 'En Route' 
  | 'Green Corridor Active' 
  | 'At Hospital'
  | 'Maintenance'
  | 'Offline';

export interface HistoricalTrip {
  id: string;
  date: string;
  type: string;
  durationMin: number;
  savedMin: number;
  hospital: string;
}

export interface Ambulance {
  id: string;
  name: string;
  driver: string;
  type: 'Cardiac Rescue' | 'Trauma Transport' | 'Neonatal Intensive' | 'General ICU';
  speed: number; // km/h
  status: AmbulanceStatus;
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  currentPosition: { x: number; y: number; lat: number; lng: number };
  route: string[]; // List of junction IDs leading to the hospital
  routeIndex: number;
  progress: number; // 0 to 1 along current segment
  etaToHospital: number; // seconds
  fuelLevel: number; // %
  networkStatus: '5G Slice Secured' | 'Connected' | 'Poor Cell Coverage' | 'Offline';
  currentMission: string;
  lastMaintenance: string;
  historicalTrips: HistoricalTrip[];
}

export interface Hospital {
  id: string;
  name: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  availableBeds: number;
  totalBeds: number;
  emergencyCapacity: number;
  icuOccupancy: number; // %
  alerted: boolean;
  doctorsAvailable: number;
  emergencyQueue: number;
  equipmentStatus: 'Fully Operational' | 'Operational' | 'Degraded';
  expectedArrivals: number;
  // Extended fields for Bhubaneswar digital twin integration
  address: string;
  hospitalType: 'Multispeciality' | 'Medical College' | 'Government';
  iconType: 'General Hospital' | 'Trauma Center' | 'Cardiac Emergency' | 'Government Hospital';
  emergencyStatus: 'Active' | 'Standby' | 'Diverting' | 'High Load';
  icuBedsAvailable: number;
  icuTotalBeds: number;
  averageResponseTime: string;
  nearestTrafficSignal: string;
  nearestCameraNode: string;
  coverageZone: string;
  serviceRadiusKm: number;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  message: string;
  type: 'system' | 'alert' | 'corridor' | 'prediction' | 'success';
}

export interface CameraFeed {
  id: string;
  name: string;
  junctionId: string;
  fps: number;
}

export interface HistoricalIncident {
  id: string;
  date: string;
  emergencyType: string;
  source: string;
  destination: string;
  travelTime: string;
  timeSaved: string;
  route: string[];
  stats: {
    avgSpeed: number;
    gForcePeaks: number;
    patientStability: string;
    trafficDelaysFoilPct: number;
  };
}

export interface DigitalTwinVehicle {
  id: string;
  type: 'Car' | 'Bus' | 'Truck' | 'Motorcycle' | 'Ambulance';
  speed: number;
  direction: 'Northbound' | 'Southbound' | 'Eastbound' | 'Westbound';
  cameraId: string;
  timestamp: string;
  lat: number;
  lng: number;
  x: number; // 0-100 local x coord
  y: number; // 0-100 local y coord
  confidence: number;
  destination: string;
  history: { timestamp: string; camera: string; event: string }[];
}

