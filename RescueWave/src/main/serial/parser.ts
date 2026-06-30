import type { NodeTelemetry, SosStatus } from '../../shared/types'

const FIELD_COUNT = 8

export function parseTelemetryLine(line: string): NodeTelemetry | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const parts = trimmed.split(',')
  if (parts.length !== FIELD_COUNT) {
    console.warn('[serial] Invalid field count:', trimmed)
    return null
  }

  const [
    nodeId,
    latitudeRaw,
    longitudeRaw,
    temperatureRaw,
    humidityRaw,
    waterLevelRaw,
    radarMotionRaw,
    sosStatusRaw
  ] = parts

  const latitude = Number(latitudeRaw)
  const longitude = Number(longitudeRaw)
  const temperature = Number(temperatureRaw)
  const humidity = Number(humidityRaw)
  const waterLevel = Number(waterLevelRaw)

  if (
    !nodeId ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    Number.isNaN(temperature) ||
    Number.isNaN(humidity) ||
    Number.isNaN(waterLevel)
  ) {
    console.warn('[serial] Invalid numeric values:', trimmed)
    return null
  }

  const radarMotion = radarMotionRaw === '1' || radarMotionRaw.toLowerCase() === 'true'
  const sosUpper = sosStatusRaw.trim().toUpperCase()
  const sosStatus: SosStatus = sosUpper === 'SOS' ? 'SOS' : 'OK'

  return {
    nodeId: nodeId.trim(),
    latitude,
    longitude,
    temperature,
    humidity,
    waterLevel,
    radarMotion,
    sosStatus,
    timestamp: Date.now()
  }
}
