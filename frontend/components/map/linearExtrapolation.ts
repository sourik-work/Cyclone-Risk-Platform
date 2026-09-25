import { TrackPoint } from './types';

export interface ExtrapolatedPoint {
  lead_hours: number;
  lat: number;
  lon: number;
  wind_kmph?: number;
  pressure_hpa?: number;
}

/**
 * Computes a 48-hour forward track via linear extrapolation based on the storm's
 * current heading_degrees and forward_speed_kmph.
 * Used as a fallback when insufficient observed points (< 4) exist for TrackLSTM inference.
 */
export function computeLinearExtrapolation(
  startPoint: TrackPoint,
  maxHours: number = 48,
  stepHours: number = 3
): ExtrapolatedPoint[] {
  const points: ExtrapolatedPoint[] = [];
  const heading = startPoint.heading_degrees ?? 0;
  const speed = startPoint.forward_speed_kmph && startPoint.forward_speed_kmph > 0 ? startPoint.forward_speed_kmph : 15;
  const R = 6371; // Earth radius in km

  const lat1Rad = (startPoint.latitude * Math.PI) / 180;
  const lon1Rad = (startPoint.longitude * Math.PI) / 180;
  const bearingRad = (heading * Math.PI) / 180;

  for (let h = stepHours; h <= maxHours; h += stepHours) {
    const distKm = speed * h;
    const d = distKm / R;

    const lat2Rad = Math.asin(
      Math.sin(lat1Rad) * Math.cos(d) +
      Math.cos(lat1Rad) * Math.sin(d) * Math.cos(bearingRad)
    );
    const lon2Rad =
      lon1Rad +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1Rad),
        Math.cos(d) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
      );

    const lat2 = (lat2Rad * 180) / Math.PI;
    const lon2 = (lon2Rad * 180) / Math.PI;

    points.push({
      lead_hours: h,
      lat: Math.round(lat2 * 1000) / 1000,
      lon: Math.round(lon2 * 1000) / 1000,
      wind_kmph: startPoint.wind_speed_kmph ?? Math.round((startPoint.wind_speed_knots || 0) * 1.852),
      pressure_hpa: startPoint.central_pressure_hpa,
    });
  }

  return points;
}
