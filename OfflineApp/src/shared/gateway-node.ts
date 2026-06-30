// File Location: OfflineApp/src/shared/gateway-node.ts

export interface NodeTelemetry {
  id: string;
  lat: number;
  lng: number;
  temperature: number;
  humidity: number;
  waterLevel: number;
  motionDetected: boolean;
  sosStatus: 'OK' | 'SOS';
  lastSeen: number; // Timestamp
}

export interface SystemStats {
  totalNodes: number;
  activeNodes: number;
  sosAlerts: number;
  offlineNodes: number;
}

// --- Added to fix the build error with serial-manager.ts ---

// Alias to match what Cursor generated
export interface GatewayNodePayload extends NodeTelemetry {} 

export interface SerialPortSummary {
  path: string;
  manufacturer?: string;
}

// Function to parse the comma-separated string from ESP32
// Format: NODE_ID,LATITUDE,LONGITUDE,TEMPERATURE,HUMIDITY,WATER_LEVEL,RADAR_MOTION,SOS_STATUS
export function parseGatewayLine(line: string): GatewayNodePayload | null {
  try {
    const parts = line.trim().split(',');
    
    // We expect at least 8 parts based on our payload format
    if (parts.length < 8) return null;

    return {
      id: parts[0],
      lat: parseFloat(parts[1]),
      lng: parseFloat(parts[2]),
      temperature: parseFloat(parts[3]),
      humidity: parseFloat(parts[4]),
      waterLevel: parseInt(parts[5], 10),
      motionDetected: parseInt(parts[6], 10) === 1,
      sosStatus: parts[7].trim() === 'SOS' ? 'SOS' : 'OK',
      lastSeen: Date.now(),
    };
  } catch (error) {
    console.error("Error parsing Gateway Line:", error);
    return null;
  }
}