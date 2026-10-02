const EARTH_RADIUS_KM = 6371;
const AVERAGE_SPEED_KMH = 25; // rough urban delivery speed (motorbike/keke in city traffic)

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function estimateDurationMinutes(distanceKm: number): number {
  const minutes = (distanceKm / AVERAGE_SPEED_KMH) * 60;
  return Math.max(10, Math.round(minutes));
}
