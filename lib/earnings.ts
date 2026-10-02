const BASE_FEE_LEONES = 5000;
const PER_KM_RATE_LEONES = 1500;

export function suggestDeliveryFee(distanceKm: number): number {
  return Math.round(BASE_FEE_LEONES + distanceKm * PER_KM_RATE_LEONES);
}
