export interface TrackableOrder {
  status: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  inTransitAt: Date | null;
  estimatedDurationMinutes: number;
}

export interface SimulatedPosition {
  lat: number;
  lng: number;
  progress: number;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/**
 * Position is derived, never persisted per-tick: elapsed time since `inTransitAt`
 * divided by the estimated duration gives progress along the pickup->dropoff line.
 */
export function computeSimulatedPosition(order: TrackableOrder): SimulatedPosition | null {
  if (order.status === "DELIVERED") {
    return { lat: order.dropoffLat, lng: order.dropoffLng, progress: 1 };
  }

  if (order.status !== "IN_TRANSIT" || !order.inTransitAt) {
    return null;
  }

  const startMs = order.inTransitAt.getTime();
  const etaMs = startMs + order.estimatedDurationMinutes * 60_000;
  const rawProgress = (Date.now() - startMs) / (etaMs - startMs);
  const progress = Math.min(Math.max(rawProgress, 0), 0.98); // stays short of 1 until actually DELIVERED

  return {
    lat: lerp(order.pickupLat, order.dropoffLat, progress),
    lng: lerp(order.pickupLng, order.dropoffLng, progress),
    progress,
  };
}
