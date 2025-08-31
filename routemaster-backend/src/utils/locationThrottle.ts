interface LocationUpdate {
  driverId: string;
  timestamp: number;
  coordinates: [number, number];
}

class LocationThrottler {
  private updates: Map<string, LocationUpdate> = new Map();
  private readonly MIN_TIME_INTERVAL = 2000; // 2 seconds
  private readonly MIN_DISTANCE = 20; // 20 meters

  shouldUpdate(
    driverId: string,
    lng: number,
    lat: number,
    timestamp: number
  ): boolean {
    const lastUpdate = this.updates.get(driverId);

    if (!lastUpdate) {
      this.updates.set(driverId, {
        driverId,
        timestamp,
        coordinates: [lng, lat],
      });
      return true;
    }

    const timeDiff = timestamp - lastUpdate.timestamp;
    if (timeDiff < this.MIN_TIME_INTERVAL) {
      return false;
    }

    const distance = this.calculateDistance(
      lastUpdate.coordinates[1], // lat1
      lastUpdate.coordinates[0], // lng1
      lat, // lat2
      lng // lng2
    );

    if (distance < this.MIN_DISTANCE) {
      return false;
    }

    // Update the stored location
    this.updates.set(driverId, {
      driverId,
      timestamp,
      coordinates: [lng, lat],
    });
    return true;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  clearDriver(driverId: string): void {
    this.updates.delete(driverId);
  }

  clearAll(): void {
    this.updates.clear();
  }
}

export const locationThrottler = new LocationThrottler();
export default locationThrottler;
