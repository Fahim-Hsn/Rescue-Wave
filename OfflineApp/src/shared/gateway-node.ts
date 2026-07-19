// File Location: OfflineApp/src/shared/gateway-node.ts

export interface NodeTelemetry {
  id: string;
  lat: number;
  lng: number;
  temperature: number;
  humidity: number;
  waterLevel: number;
  battery: number;
  sosStatus: 'SAFE' | 'SOS' | 'HUMAN';
  lastSeen: number; // Timestamp
}

export interface SystemStats {
  totalNodes: number;
  activeNodes: number;
  sosAlerts: number;
  offlineNodes: number;
}

// Alias to match what Cursor generated
export interface GatewayNodePayload extends NodeTelemetry { }

export interface SerialPortSummary {
  path: string;
  manufacturer?: string;
}

// Function to parse the comma-separated string from ESP32
// Format: NodeID,Latitude,Longitude,Temperature,Humidity,WaterLevel,Battery,Status
export function parseGatewayLine(line: string): GatewayNodePayload | null {
  try {
    const parts = line.trim().split(',');

    // We expect at least 8 parts based on our payload format
    if (parts.length < 8) return null;

    const statusMap: Record<string, 'SAFE' | 'SOS' | 'HUMAN'> = {
      'SAFE': 'SAFE',
      'SOS': 'SOS',
      'HUMAN': 'HUMAN'
    };

    const parsedStatus = parts[7].trim().toUpperCase();
    const sosStatus = statusMap[parsedStatus] || 'SAFE';

    return {
      id: parts[0],
      lat: parseFloat(parts[1]),
      lng: parseFloat(parts[2]),
      temperature: parseFloat(parts[3]),
      humidity: parseFloat(parts[4]),
      waterLevel: parseInt(parts[5], 10),
      battery: parseInt(parts[6], 10),
      sosStatus,
      lastSeen: Date.now(),
    };
  } catch (error) {
    console.error("Error parsing Gateway Line:", error);
    return null;
  }
}