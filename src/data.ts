import { Junction, RoadSegment, Hospital, Ambulance, CameraFeed, LogEvent, DigitalTwinVehicle } from './types';

// Let's declare our bounding box for Bhubaneswar
const minLat = 20.220;
const maxLat = 20.370;
const minLng = 85.740;
const maxLng = 85.880;

export function computeXY(lat: number, lng: number) {
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  // Lat is reversed on Y coords in standard UI screen coordinates (0 at top, 100 at bottom)
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100
  };
}

// Raw Nodes to generate junctions
const RAW_JUNCTIONS = [
  { id: 'JV', name: 'Jaydev Vihar Square', lat: 20.2974, lng: 85.8230, status: 'GREEN', queueLength: 32, density: 45, avgWait: 34, phase: 'N-S Bound' },
  { id: 'AV', name: 'Acharya Vihar Square', lat: 20.2941, lng: 85.8354, status: 'RED', queueLength: 48, density: 78, avgWait: 58, phase: 'E-W Bound' },
  { id: 'VV', name: 'Vani Vihar Square', lat: 20.2882, lng: 85.8430, status: 'YELLOW', queueLength: 21, density: 52, avgWait: 42, phase: 'Turning Phase' },
  { id: 'RS', name: 'Rasulgarh Square', lat: 20.2885, lng: 85.8601, status: 'RED', queueLength: 64, density: 89, avgWait: 72, phase: 'N-S Bound' },
  { id: 'CS', name: 'CRP Square', lat: 20.2861, lng: 85.8080, status: 'GREEN', queueLength: 18, density: 31, avgWait: 22, phase: 'E-W Bound' },
  { id: 'KI', name: 'KIIT Square', lat: 20.3524, lng: 85.8181, status: 'RED', queueLength: 52, density: 82, avgWait: 65, phase: 'N-S Bound' },
  { id: 'PS', name: 'Patia Square', lat: 20.3341, lng: 85.8180, status: 'GREEN', queueLength: 24, density: 40, avgWait: 28, phase: 'E-W Bound' },
  { id: 'DS', name: 'Damana Square', lat: 20.3230, lng: 85.8185, status: 'YELLOW', queueLength: 15, density: 38, avgWait: 31, phase: 'Turning Phase' },
  { id: 'KS', name: 'Khandagiri Square', lat: 20.2605, lng: 85.7865, status: 'RED', queueLength: 40, density: 67, avgWait: 54, phase: 'N-S Bound' },
  { id: 'FS', name: 'Fire Station Square', lat: 20.2764, lng: 85.7972, status: 'GREEN', queueLength: 12, density: 25, avgWait: 19, phase: 'E-W Bound' },
  { id: 'RM', name: 'Rajmahal Square', lat: 20.2635, lng: 85.8390, status: 'RED', queueLength: 58, density: 84, avgWait: 68, phase: 'N-S Bound' },
  { id: 'KL', name: 'Kalpana Square', lat: 20.2541, lng: 85.8391, status: 'GREEN', queueLength: 14, density: 29, avgWait: 24, phase: 'E-W Bound' },
  { id: 'MC', name: 'Master Canteen Square', lat: 20.2730, lng: 85.8436, status: 'YELLOW', queueLength: 29, density: 56, avgWait: 38, phase: 'Turning Phase' },
  { id: 'IC', name: 'Infocity Campus', lat: 20.3550, lng: 85.8100, status: 'GREEN', queueLength: 10, density: 18, avgWait: 15, phase: 'E-W Bound' }
] as const;

export const INITIAL_JUNCTIONS: Junction[] = RAW_JUNCTIONS.map(rj => {
  const xy = computeXY(rj.lat, rj.lng);
  return {
    id: rj.id,
    name: rj.name,
    x: xy.x,
    y: xy.y,
    lat: rj.lat,
    lng: rj.lng,
    status: rj.status as 'GREEN' | 'YELLOW' | 'RED' | 'OVERRIDE',
    queueLength: rj.queueLength,
    phase: rj.phase as any,
    waitSec: rj.status === 'GREEN' ? 15 : rj.status === 'YELLOW' ? 8 : 45,
    avgWaitTime: rj.avgWait,
    density: rj.density,
    cameraId: `CAM-${rj.id}`
  };
});

const RAW_HOSPITALS = [
  {
    id: 'APOLLO',
    name: 'Apollo Hospitals, Gajapati Nagar',
    lat: 20.3082,
    lng: 85.8315,
    availableBeds: 45,
    totalBeds: 350,
    emergencyCapacity: 95,
    icuOccupancy: 68,
    doctorsAvailable: 34,
    emergencyQueue: 2,
    address: 'Sainik School Rd, Gajapati Nagar, Bhubaneswar, Odisha 751005',
    hospitalType: 'Multispeciality' as const,
    iconType: 'Cardiac Emergency' as const,
    emergencyStatus: 'Active' as const,
    icuBedsAvailable: 16,
    icuTotalBeds: 50,
    averageResponseTime: '9.2 mins',
    nearestTrafficSignal: 'Jaydev Vihar Square',
    nearestCameraNode: 'CAM-JV',
    coverageZone: 'Zone Blue (North-East)',
    serviceRadiusKm: 6
  },
  {
    id: 'SUM',
    name: 'SUM Ultimate Medicare, Ghatikia',
    lat: 20.2801,
    lng: 85.7601,
    availableBeds: 38,
    totalBeds: 280,
    emergencyCapacity: 80,
    icuOccupancy: 82,
    doctorsAvailable: 28,
    emergencyQueue: 3,
    address: 'K8 Kalinga Nagar, Ghatikia, Bhubaneswar, Odisha 751003',
    hospitalType: 'Multispeciality' as const,
    iconType: 'Trauma Center' as const,
    emergencyStatus: 'Active' as const,
    icuBedsAvailable: 11,
    icuTotalBeds: 40,
    averageResponseTime: '10.5 mins',
    nearestTrafficSignal: 'Khandagiri Square',
    nearestCameraNode: 'CAM-KS',
    coverageZone: 'Zone Yellow (West-Central)',
    serviceRadiusKm: 7
  },
  {
    id: 'MANIPAL',
    name: 'Manipal Hospital (AMRI), Bhubaneswar',
    lat: 20.2647,
    lng: 85.7905,
    availableBeds: 22,
    totalBeds: 200,
    emergencyCapacity: 65,
    icuOccupancy: 88,
    doctorsAvailable: 18,
    emergencyQueue: 5,
    address: 'Near Khandagiri Hills, Jagamara, Bhubaneswar, Odisha 751030',
    hospitalType: 'Multispeciality' as const,
    iconType: 'Trauma Center' as const,
    emergencyStatus: 'High Load' as const,
    icuBedsAvailable: 6,
    icuTotalBeds: 30,
    averageResponseTime: '12.4 mins',
    nearestTrafficSignal: 'Khandagiri Square',
    nearestCameraNode: 'CAM-KS',
    coverageZone: 'Zone Red (South-West)',
    serviceRadiusKm: 5
  },
  {
    id: 'CARE',
    name: 'CARE Hospitals, Chandrasekharpur',
    lat: 20.3255,
    lng: 85.8202,
    availableBeds: 29,
    totalBeds: 180,
    emergencyCapacity: 70,
    icuOccupancy: 74,
    doctorsAvailable: 21,
    emergencyQueue: 1,
    address: 'Prachi Enclave, Chandrasekharpur, Bhubaneswar, Odisha 751016',
    hospitalType: 'Multispeciality' as const,
    iconType: 'Cardiac Emergency' as const,
    emergencyStatus: 'Active' as const,
    icuBedsAvailable: 12,
    icuTotalBeds: 35,
    averageResponseTime: '10.1 mins',
    nearestTrafficSignal: 'Damana Square',
    nearestCameraNode: 'CAM-DS',
    coverageZone: 'Zone Emerald (North)',
    serviceRadiusKm: 5.5
  },
  {
    id: 'KALINGA',
    name: 'Kalinga Hospital Ltd., Chandrasekharpur',
    lat: 20.3155,
    lng: 85.8210,
    availableBeds: 34,
    totalBeds: 250,
    emergencyCapacity: 85,
    icuOccupancy: 61,
    doctorsAvailable: 25,
    emergencyQueue: 3,
    address: 'Nalco Square, Chandrasekharpur, Bhubaneswar, Odisha 751023',
    hospitalType: 'Multispeciality' as const,
    iconType: 'General Hospital' as const,
    emergencyStatus: 'Standby' as const,
    icuBedsAvailable: 19,
    icuTotalBeds: 45,
    averageResponseTime: '11.8 mins',
    nearestTrafficSignal: 'Damana Square',
    nearestCameraNode: 'CAM-DS',
    coverageZone: 'Zone Emerald (North-East)',
    serviceRadiusKm: 4.8
  },
  {
    id: 'KIMS',
    name: 'KIMS Hospital, Patia',
    lat: 20.3525,
    lng: 85.8160,
    availableBeds: 62,
    totalBeds: 500,
    emergencyCapacity: 150,
    icuOccupancy: 79,
    doctorsAvailable: 45,
    emergencyQueue: 6,
    address: 'KIIT Campus 11, Patia, Bhubaneswar, Odisha 751024',
    hospitalType: 'Medical College' as const,
    iconType: 'Trauma Center' as const,
    emergencyStatus: 'Active' as const,
    icuBedsAvailable: 24,
    icuTotalBeds: 80,
    averageResponseTime: '8.4 mins',
    nearestTrafficSignal: 'KIIT Square',
    nearestCameraNode: 'CAM-KI',
    coverageZone: 'Zone Violet (Extreme North)',
    serviceRadiusKm: 8
  },
  {
    id: 'SUM_IMS',
    name: 'IMS & SUM Hospital, Kalinga Nagar',
    lat: 20.2820,
    lng: 85.7450,
    availableBeds: 50,
    totalBeds: 450,
    emergencyCapacity: 130,
    icuOccupancy: 81,
    doctorsAvailable: 35,
    emergencyQueue: 4,
    address: 'Sector 8, Kalinga Nagar, Ghatikia, Bhubaneswar, Odisha 751003',
    hospitalType: 'Medical College' as const,
    iconType: 'General Hospital' as const,
    emergencyStatus: 'Active' as const,
    icuBedsAvailable: 22,
    icuTotalBeds: 60,
    averageResponseTime: '11.1 mins',
    nearestTrafficSignal: 'Khandagiri Square',
    nearestCameraNode: 'CAM-KS',
    coverageZone: 'Zone Cyan (Far West)',
    serviceRadiusKm: 7.5
  },
  {
    id: 'AIIMS',
    name: 'AIIMS Bhubaneswar, Sijua',
    lat: 20.2470,
    lng: 85.7760,
    availableBeds: 75,
    totalBeds: 600,
    emergencyCapacity: 200,
    icuOccupancy: 85,
    doctorsAvailable: 58,
    emergencyQueue: 5,
    address: 'Sijua, Patrapada, Bhubaneswar, Odisha 751019',
    hospitalType: 'Medical College' as const,
    iconType: 'Trauma Center' as const,
    emergencyStatus: 'Active' as const,
    icuBedsAvailable: 35,
    icuTotalBeds: 100,
    averageResponseTime: '7.8 mins',
    nearestTrafficSignal: 'Fire Station Square',
    nearestCameraNode: 'CAM-FS',
    coverageZone: 'Zone Sijua Command Unit',
    serviceRadiusKm: 9
  },
  {
    id: 'CAPITAL',
    name: 'Capital Hospital, Unit-6',
    lat: 20.2650,
    lng: 85.8270,
    availableBeds: 80,
    totalBeds: 400,
    emergencyCapacity: 140,
    icuOccupancy: 91,
    doctorsAvailable: 32,
    emergencyQueue: 9,
    address: 'Unit 6, Ganga Nagar, Forest Park, Bhubaneswar, Odisha 751009',
    hospitalType: 'Government' as const,
    iconType: 'Government Hospital' as const,
    emergencyStatus: 'High Load' as const,
    icuBedsAvailable: 8,
    icuTotalBeds: 50,
    averageResponseTime: '13.0 mins',
    nearestTrafficSignal: 'Rajmahal Square',
    nearestCameraNode: 'CAM-RM',
    coverageZone: 'Zone Capital (South-Central)',
    serviceRadiusKm: 6.2
  },
  {
    id: 'UNIT4',
    name: 'Unit IV Government Hospital, Unit-4',
    lat: 20.2725,
    lng: 85.8350,
    availableBeds: 25,
    totalBeds: 150,
    emergencyCapacity: 50,
    icuOccupancy: 70,
    doctorsAvailable: 12,
    emergencyQueue: 2,
    address: 'Unit 4, Vidyut Marg, Bhubaneswar, Odisha 751001',
    hospitalType: 'Government' as const,
    iconType: 'Government Hospital' as const,
    emergencyStatus: 'Standby' as const,
    icuBedsAvailable: 8,
    icuTotalBeds: 20,
    averageResponseTime: '14.5 mins',
    nearestTrafficSignal: 'Master Canteen Square',
    nearestCameraNode: 'CAM-MC',
    coverageZone: 'Zone Capital (Central)',
    serviceRadiusKm: 4.0
  },
  {
    id: 'CENTRAL',
    name: 'Central Hospital (East Coast Railway), Mancheswar',
    lat: 20.3115,
    lng: 85.8520,
    availableBeds: 30,
    totalBeds: 160,
    emergencyCapacity: 55,
    icuOccupancy: 62,
    doctorsAvailable: 15,
    emergencyQueue: 1,
    address: 'Mancheswar Railway Colony, Bhubaneswar, Odisha 751017',
    hospitalType: 'Government' as const,
    iconType: 'Government Hospital' as const,
    emergencyStatus: 'Active' as const,
    icuBedsAvailable: 12,
    icuTotalBeds: 25,
    averageResponseTime: '11.5 mins',
    nearestTrafficSignal: 'Rasulgarh Square',
    nearestCameraNode: 'CAM-RS',
    coverageZone: 'Zone Mancheswar (East)',
    serviceRadiusKm: 5.0
  }
];

export const INITIAL_HOSPITALS: Hospital[] = RAW_HOSPITALS.map(rh => {
  const xy = computeXY(rh.lat, rh.lng);
  return {
    ...rh,
    x: xy.x,
    y: xy.y,
    alerted: false,
    equipmentStatus: 'Fully Operational',
    expectedArrivals: 0
  };
});

export const INITIAL_ROADS: RoadSegment[] = [
  // Corridor 1 Connections
  { id: 'RC1-1', name: 'AIIMS Bypass Road', fromNode: 'AIIMS', toNode: 'FS', congestion: 'free', vehicleCount: 16, avgSpeed: 60, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 20, emergencyAccessibilityScore: 95 },
  { id: 'RC1-2', name: 'Fire Station Flyover (NH-16)', fromNode: 'FS', toNode: 'JV', congestion: 'moderate', vehicleCount: 42, avgSpeed: 48, direction: 'bidirectional', type: 'highway', isFlyover: true, flyoverName: "Fire Station Flyover", length: "1.9 km", trafficDensity: 48, emergencyAccessibilityScore: 90 },
  { id: 'RC1-3', name: 'Jaydev Vihar Flyover Link', fromNode: 'JV', toNode: 'AV', congestion: 'heavy', vehicleCount: 58, avgSpeed: 30, direction: 'bidirectional', type: 'primary', isFlyover: true, flyoverName: "Jaydev Vihar Flyover", length: "1.5 km", trafficDensity: 75, emergencyAccessibilityScore: 85 },

  // Corridor 2 Connections
  { id: 'RC2-1', name: 'SUM Hospital Link Road', fromNode: 'SUM', toNode: 'KS', congestion: 'free', vehicleCount: 14, avgSpeed: 55, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 15, emergencyAccessibilityScore: 92 },
  { id: 'RC2-2', name: 'Khandagiri Road to CRP', fromNode: 'KS', toNode: 'CS', congestion: 'moderate', vehicleCount: 38, avgSpeed: 45, direction: 'bidirectional', type: 'primary', trafficDensity: 40, emergencyAccessibilityScore: 88 },
  { id: 'RC2-3', name: 'CRP Square to Patia Link', fromNode: 'CS', toNode: 'PS', congestion: 'heavy', vehicleCount: 72, avgSpeed: 32, direction: 'bidirectional', type: 'secondary', trafficDensity: 70, emergencyAccessibilityScore: 78 },
  { id: 'RC2-4', name: 'Nandan Kanan Road (PS-KI)', fromNode: 'PS', toNode: 'KI', congestion: 'critical', vehicleCount: 91, avgSpeed: 18, direction: 'bidirectional', type: 'highway', trafficDensity: 90, emergencyAccessibilityScore: 65 },

  // Corridor 3 Connections
  { id: 'RC3-1', name: 'Capital Hospital Boulevard', fromNode: 'CAPITAL', toNode: 'RM', congestion: 'moderate', vehicleCount: 22, avgSpeed: 40, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 35, emergencyAccessibilityScore: 85 },
  { id: 'RC3-2', name: 'Rajmahal Railway Overbridge', fromNode: 'RM', toNode: 'MC', congestion: 'free', vehicleCount: 19, avgSpeed: 50, direction: 'bidirectional', type: 'primary', trafficDensity: 25, emergencyAccessibilityScore: 92 },
  { id: 'RC3-3', name: 'Janpath Road (MC-VV)', fromNode: 'MC', toNode: 'VV', congestion: 'heavy', vehicleCount: 61, avgSpeed: 24, direction: 'bidirectional', type: 'primary', trafficDensity: 65, emergencyAccessibilityScore: 72 },

  // Corridor 4 Connections
  { id: 'RC4-1', name: 'Sainik School Road', fromNode: 'APOLLO', toNode: 'DS', congestion: 'free', vehicleCount: 12, avgSpeed: 50, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 18, emergencyAccessibilityScore: 94 },
  { id: 'RC4-2', name: 'Damana - Patia Square Road', fromNode: 'DS', toNode: 'PS', congestion: 'moderate', vehicleCount: 29, avgSpeed: 48, direction: 'bidirectional', type: 'secondary', trafficDensity: 38, emergencyAccessibilityScore: 86 },
  { id: 'RC4-3', name: 'Infocity Avenue', fromNode: 'PS', toNode: 'IC', congestion: 'free', vehicleCount: 18, avgSpeed: 52, direction: 'unidirectional', type: 'secondary', trafficDensity: 15, emergencyAccessibilityScore: 90 },

  // New Hospital Access Connections
  { id: 'RH-MAN-1', name: 'Manipal Access Way', fromNode: 'MANIPAL', toNode: 'KS', congestion: 'free', vehicleCount: 8, avgSpeed: 45, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 10, emergencyAccessibilityScore: 96 },
  { id: 'RH-MAN-2', name: 'Manipal Backhaul Link', fromNode: 'MANIPAL', toNode: 'FS', congestion: 'free', vehicleCount: 5, avgSpeed: 42, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 8, emergencyAccessibilityScore: 93 },
  { id: 'RH-CARE-1', name: 'CARE Boulevard', fromNode: 'CARE', toNode: 'DS', congestion: 'free', vehicleCount: 9, avgSpeed: 40, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 12, emergencyAccessibilityScore: 91 },
  { id: 'RH-CARE-2', name: 'CARE Patia Link', fromNode: 'CARE', toNode: 'PS', congestion: 'free', vehicleCount: 11, avgSpeed: 45, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 14, emergencyAccessibilityScore: 89 },
  { id: 'RH-KAL-1', name: 'Kalinga Hosp Dr. Road', fromNode: 'KALINGA', toNode: 'DS', congestion: 'moderate', vehicleCount: 14, avgSpeed: 38, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 28, emergencyAccessibilityScore: 88 },
  { id: 'RH-KAL-2', name: 'Kalinga-JV Grid Link', fromNode: 'KALINGA', toNode: 'JV', congestion: 'free', vehicleCount: 12, avgSpeed: 40, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 19, emergencyAccessibilityScore: 87 },
  { id: 'RH-KIM-1', name: 'KIMS KIIT Link Road', fromNode: 'KIMS', toNode: 'KI', congestion: 'moderate', vehicleCount: 22, avgSpeed: 35, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 33, emergencyAccessibilityScore: 85 },
  { id: 'RH-KIM-2', name: 'KIMS Patia Avenue', fromNode: 'KIMS', toNode: 'PS', congestion: 'free', vehicleCount: 15, avgSpeed: 40, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 16, emergencyAccessibilityScore: 91 },
  { id: 'RH-SUM-IMS1', name: 'Kalinga Nagar Sector-8 Ring', fromNode: 'SUM_IMS', toNode: 'SUM', congestion: 'free', vehicleCount: 5, avgSpeed: 50, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 9, emergencyAccessibilityScore: 95 },
  { id: 'RH-SUM-IMS2', name: 'SUM-IMS to Khandagiri Express', fromNode: 'SUM_IMS', toNode: 'KS', congestion: 'free', vehicleCount: 7, avgSpeed: 48, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 11, emergencyAccessibilityScore: 92 },
  { id: 'RH-UT4-1', name: 'Unit-IV Vidyut Connector', fromNode: 'UNIT4', toNode: 'MC', congestion: 'moderate', vehicleCount: 16, avgSpeed: 35, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 30, emergencyAccessibilityScore: 82 },
  { id: 'RH-UT4-2', name: 'Unit-IV Acharya Vihar Link', fromNode: 'UNIT4', toNode: 'AV', congestion: 'heavy', vehicleCount: 25, avgSpeed: 28, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 55, emergencyAccessibilityScore: 70 },
  { id: 'RH-CEN-1', name: 'Mancheswar Station Boulevard', fromNode: 'CENTRAL', toNode: 'RS', congestion: 'free', vehicleCount: 10, avgSpeed: 42, direction: 'bidirectional', type: 'hospital-access', trafficDensity: 18, emergencyAccessibilityScore: 89 },

  // Cross Connector Mesh Paths
  { id: 'RM1', name: 'Khandagiri Flyover (NH-16)', fromNode: 'KS', toNode: 'FS', congestion: 'free', vehicleCount: 25, avgSpeed: 58, direction: 'bidirectional', type: 'highway', isFlyover: true, flyoverName: "Khandagiri Flyover", length: "1.2 km", trafficDensity: 15, emergencyAccessibilityScore: 96 },
  { id: 'RM2', name: 'CRP-Jaydev Vihar Link', fromNode: 'CS', toNode: 'JV', congestion: 'moderate', vehicleCount: 33, avgSpeed: 42, direction: 'bidirectional', type: 'secondary', trafficDensity: 38, emergencyAccessibilityScore: 84 },
  { id: 'RM3', name: 'Vani Vihar Flyover (NH-16)', fromNode: 'AV', toNode: 'VV', congestion: 'moderate', vehicleCount: 29, avgSpeed: 40, direction: 'bidirectional', type: 'primary', isFlyover: true, flyoverName: "Vani Vihar Flyover", length: "1.4 km", trafficDensity: 35, emergencyAccessibilityScore: 91 },
  { id: 'RM4', name: 'Rasulgarh Flyover (NH-16)', fromNode: 'VV', toNode: 'RS', congestion: 'critical', vehicleCount: 88, avgSpeed: 15, direction: 'bidirectional', type: 'highway', isFlyover: true, flyoverName: "Rasulgarh Flyover", length: "2.1 km", trafficDensity: 88, emergencyAccessibilityScore: 80 },
  { id: 'RM5', name: 'Cuttack-Puri Road (RM-KL)', fromNode: 'RM', toNode: 'KL', congestion: 'moderate', vehicleCount: 40, avgSpeed: 38, direction: 'bidirectional', type: 'primary', trafficDensity: 52, emergencyAccessibilityScore: 81 },
  { id: 'RM6', name: 'Bidyut Marg (JV-APOLLO)', fromNode: 'JV', toNode: 'APOLLO', congestion: 'free', vehicleCount: 15, avgSpeed: 50, direction: 'bidirectional', type: 'secondary', trafficDensity: 18, emergencyAccessibilityScore: 92 },
  { id: 'RM7', name: 'ARKA Backhaul (VV-APOLLO)', fromNode: 'VV', toNode: 'APOLLO', congestion: 'free', vehicleCount: 21, avgSpeed: 45, direction: 'bidirectional', type: 'secondary', trafficDensity: 24, emergencyAccessibilityScore: 90 }
];

export const INITIAL_AMBULANCES: Ambulance[] = [
  {
    id: 'A-102',
    name: 'Ambulance Alpha-102',
    driver: 'Paramedic R. Sharma',
    type: 'Cardiac Rescue',
    speed: 0,
    status: 'Available',
    priorityLevel: 'CRITICAL',
    currentPosition: { ...computeXY(20.2470, 85.7760), lat: 20.2470, lng: 85.7760 },
    route: ['AIIMS', 'FS', 'JV', 'AV'],
    routeIndex: 0,
    progress: 0,
    etaToHospital: 284,
    fuelLevel: 85,
    networkStatus: '5G Slice Secured',
    currentMission: 'None',
    lastMaintenance: '2026-05-18',
    historicalTrips: [
      { id: 'T1', date: '2026-06-19', type: 'Severe Trauma', durationMin: 11, savedMin: 4.5, hospital: 'AIIMS Bhubaneswar' },
      { id: 'T2', date: '2026-06-20', type: 'AMI Heart Attack', durationMin: 9, savedMin: 3.8, hospital: 'AIIMS Bhubaneswar' }
    ]
  },
  {
    id: 'A-205',
    name: 'Ambulance Beta-205',
    driver: 'Paramedic S. Roy',
    type: 'Trauma Transport',
    speed: 0,
    status: 'Available',
    priorityLevel: 'HIGH',
    currentPosition: { ...computeXY(20.2801, 85.7601), lat: 20.2801, lng: 85.7601 },
    route: ['SUM', 'KS', 'CS', 'PS', 'KI'],
    routeIndex: 0,
    progress: 0,
    etaToHospital: 410,
    fuelLevel: 62,
    networkStatus: 'Connected',
    currentMission: 'None',
    lastMaintenance: '2026-06-02',
    historicalTrips: [
      { id: 'T3', date: '2026-06-18', type: 'Stroke Case', durationMin: 14, savedMin: 5.1, hospital: 'SUM Ultimate Medicare' }
    ]
  },
  {
    id: 'A-301',
    name: 'Ambulance Gamma-301',
    driver: 'Paramedic M. Patnaik',
    type: 'Neonatal Intensive',
    speed: 0,
    status: 'Available',
    priorityLevel: 'MODERATE',
    currentPosition: { ...computeXY(20.2650, 85.8270), lat: 20.2650, lng: 85.8270 },
    route: ['CAPITAL', 'RM', 'MC', 'VV'],
    routeIndex: 0,
    progress: 0,
    etaToHospital: 320,
    fuelLevel: 94,
    networkStatus: 'Connected',
    currentMission: 'None',
    lastMaintenance: '2026-06-11',
    historicalTrips: [
      { id: 'T4', date: '2026-06-15', type: 'Pre-term Labor', durationMin: 15, savedMin: 2.1, hospital: 'Capital Hospital' }
    ]
  },
  {
    id: 'A-420',
    name: 'Ambulance Delta-420',
    driver: 'Paramedic A. Pradhan',
    type: 'General ICU',
    speed: 0,
    status: 'Available',
    priorityLevel: 'MODERATE',
    currentPosition: { ...computeXY(20.3082, 85.8315), lat: 20.3082, lng: 85.8315 },
    route: ['APOLLO', 'DS', 'PS', 'IC'],
    routeIndex: 0,
    progress: 0,
    etaToHospital: 290,
    fuelLevel: 78,
    networkStatus: '5G Slice Secured',
    currentMission: 'None',
    lastMaintenance: '2026-06-21',
    historicalTrips: []
  }
];

export const CAMERAS: CameraFeed[] = [
  { id: 'CAM-JV', name: 'Jaydev Vihar Square CAM-1', junctionId: 'JV', fps: 30 },
  { id: 'CAM-AV', name: 'Acharya Vihar Overpass CAM-2', junctionId: 'AV', fps: 30 },
  { id: 'CAM-VV', name: 'Vani Vihar Square CAM-3', junctionId: 'VV', fps: 24 },
  { id: 'CAM-RS', name: 'Rasulgarh NH-16 Cam', junctionId: 'RS', fps: 30 },
  { id: 'CAM-CS', name: 'CRP Square Cam Feed', junctionId: 'CS', fps: 30 }
];

export const RECENT_LOGS: LogEvent[] = [
  {
    id: 'L1',
    timestamp: '11:42:08',
    message: 'ARKA Corridor V2X Active. Map Center: Bhubaneswar, India [20.2961, 85.8245].',
    type: 'system'
  },
  {
    id: 'L2',
    timestamp: '11:42:11',
    message: 'Geospatial OpenStreetMap vector tile handshakes fully optimized.',
    type: 'prediction'
  }
];

export const INITIAL_SIMULATED_VEHICLES: DigitalTwinVehicle[] = [
  {
    id: 'Car #124',
    type: 'Car',
    speed: 46,
    direction: 'Eastbound',
    cameraId: 'CAM-CS',
    timestamp: '11:42:11',
    lat: 20.2861,
    lng: 85.8080,
    x: 15,
    y: 42,
    confidence: 98,
    destination: 'Vani Vihar Square',
    history: [{ timestamp: '11:42:11', camera: 'CAM-CS', event: 'First Tracking Capture' }]
  },
  {
    id: 'Truck #55',
    type: 'Truck',
    speed: 32,
    direction: 'Eastbound',
    cameraId: 'CAM-JV',
    timestamp: '11:42:11',
    lat: 20.2974,
    lng: 85.8230,
    x: 45,
    y: 58,
    confidence: 94,
    destination: 'Rasulgarh Square',
    history: [{ timestamp: '11:42:11', camera: 'CAM-JV', event: 'First Tracking Capture' }]
  },
  {
    id: 'Bus #402',
    type: 'Bus',
    speed: 24,
    direction: 'Eastbound',
    cameraId: 'CAM-AV',
    timestamp: '11:42:11',
    lat: 20.2941,
    lng: 85.8354,
    x: 65,
    y: 62,
    confidence: 97,
    destination: 'Apollo Hospitals',
    history: [{ timestamp: '11:42:11', camera: 'CAM-AV', event: 'First Tracking Capture' }]
  },
  {
    id: 'Motorcycle #88',
    type: 'Motorcycle',
    speed: 58,
    direction: 'Westbound',
    cameraId: 'CAM-VV',
    timestamp: '11:42:11',
    lat: 20.2882,
    lng: 85.8430,
    x: 25,
    y: 35,
    confidence: 85,
    destination: 'CRP Square',
    history: [{ timestamp: '11:42:11', camera: 'CAM-VV', event: 'First Tracking Capture' }]
  },
  {
    id: 'Car #302',
    type: 'Car',
    speed: 40,
    direction: 'Westbound',
    cameraId: 'CAM-RS',
    timestamp: '11:42:11',
    lat: 20.2885,
    lng: 85.8601,
    x: 55,
    y: 48,
    confidence: 91,
    destination: 'CRP Square',
    history: [{ timestamp: '11:42:11', camera: 'CAM-RS', event: 'First Tracking Capture' }]
  },
  {
    id: 'Ambulance #AMB-02',
    type: 'Ambulance',
    speed: 72,
    direction: 'Eastbound',
    cameraId: 'CAM-CS',
    timestamp: '11:42:11',
    lat: 20.2861,
    lng: 85.8080,
    x: 5,
    y: 50,
    confidence: 99,
    destination: 'SUM Ultimate Medicare',
    history: [{ timestamp: '11:42:11', camera: 'CAM-CS', event: 'Active Dispatch Emergency' }]
  },
  {
    id: 'Car #209',
    type: 'Car',
    speed: 36,
    direction: 'Westbound',
    cameraId: 'CAM-AV',
    timestamp: '11:42:11',
    lat: 20.2941,
    lng: 85.8354,
    x: 80,
    y: 45,
    confidence: 92,
    destination: 'CRP Square',
    history: [{ timestamp: '11:42:11', camera: 'CAM-AV', event: 'First Tracking Capture' }]
  },
  {
    id: 'Motorcycle #15',
    type: 'Motorcycle',
    speed: 50,
    direction: 'Eastbound',
    cameraId: 'CAM-RS',
    timestamp: '11:42:11',
    lat: 20.2885,
    lng: 85.8601,
    x: 35,
    y: 40,
    confidence: 89,
    destination: 'Rasulgarh Square',
    history: [{ timestamp: '11:42:11', camera: 'CAM-RS', event: 'First Tracking Capture' }]
  }
];

