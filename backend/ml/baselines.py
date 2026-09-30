"""Baseline forecasting models for cyclone track and intensity.

Implements standard meteorological reference baselines:
1. Persistence Baseline: Linear extrapolation based on recent velocity.
2. Climatology Baseline: Monthly/regional mean track translation vectors.
3. IMD Operational Baseline: Published 2025 operational forecast error benchmarks.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two points in kilometers."""
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


@dataclass
class BaselineMetrics:
    baseline_name: str
    rmse_24h_km: float
    rmse_48h_km: float
    rmse_72h_km: float
    wind_mae_kmph: float
    pressure_mae_hpa: float
    description: str


class PersistenceBaseline:
    """Projects future track using linear extrapolation of the last known velocity."""

    @staticmethod
    def predict(
        recent_points: List[Dict[str, Any]],
        lead_steps: int = 16,
        step_hours: float = 3.0,
    ) -> List[Dict[str, Any]]:
        if len(recent_points) < 2:
            raise ValueError("Persistence baseline requires at least 2 points to compute velocity.")

        p_prev = recent_points[-2]
        p_curr = recent_points[-1]

        # Velocity in degrees per hour (approx)
        time_diff = float(recent_points[-1].get("time_diff_hours", 3.0)) or 3.0
        v_lat = (float(p_curr["lat"]) - float(p_prev["lat"])) / time_diff
        v_lon = (float(p_curr["lon"]) - float(p_prev["lon"])) / time_diff
        curr_wind = float(p_curr.get("wind_kmph", p_curr.get("wind_speed_kmph", 100.0)))
        curr_pres = float(p_curr.get("pressure_hpa", p_curr.get("central_pressure_hpa", 980.0)))

        predictions = []
        for step in range(1, lead_steps + 1):
            dt = step * step_hours
            decay = 0.96 ** step  # Slight velocity decay over time
            pred_lat = float(p_curr["lat"]) + v_lat * dt * decay
            pred_lon = float(p_curr["lon"]) + v_lon * dt * decay
            predictions.append({
                "lead_hours": dt,
                "lat": round(pred_lat, 3),
                "lon": round(pred_lon, 3),
                "wind_kmph": round(curr_wind, 1),
                "pressure_hpa": round(curr_pres, 1),
            })
        return predictions


class ClimatologyBaseline:
    """Climatological mean steering vector by latitude band and season in North Indian Ocean."""

    CLIMATOLOGY_VECTORS: Dict[str, Tuple[float, float]] = {
        # (v_lat_deg_per_h, v_lon_deg_per_h)
        "BOB_LOW_LAT": (0.045, -0.060),    # Lat < 12 N (West-Northwestward)
        "BOB_MID_LAT": (0.075, 0.035),     # 12 N <= Lat < 18 N (Recurving North-Eastward)
        "BOB_HIGH_LAT": (0.085, 0.080),    # Lat >= 18 N (Accelerating North-Eastward)
    }

    @classmethod
    def predict(
        cls,
        recent_points: List[Dict[str, Any]],
        lead_steps: int = 16,
        step_hours: float = 3.0,
    ) -> List[Dict[str, Any]]:
        if not recent_points:
            raise ValueError("Climatology baseline requires at least 1 recent point.")

        p_curr = recent_points[-1]
        lat = float(p_curr["lat"])
        lon = float(p_curr["lon"])
        curr_wind = float(p_curr.get("wind_kmph", 100.0))
        curr_pres = float(p_curr.get("pressure_hpa", 980.0))

        if lat < 12.0:
            v_lat, v_lon = cls.CLIMATOLOGY_VECTORS["BOB_LOW_LAT"]
        elif lat < 18.0:
            v_lat, v_lon = cls.CLIMATOLOGY_VECTORS["BOB_MID_LAT"]
        else:
            v_lat, v_lon = cls.CLIMATOLOGY_VECTORS["BOB_HIGH_LAT"]

        predictions = []
        for step in range(1, lead_steps + 1):
            dt = step * step_hours
            pred_lat = lat + v_lat * dt
            pred_lon = lon + v_lon * dt
            predictions.append({
                "lead_hours": dt,
                "lat": round(pred_lat, 3),
                "lon": round(pred_lon, 3),
                "wind_kmph": round(max(40.0, curr_wind - 0.2 * dt), 1),
                "pressure_hpa": round(min(1010.0, curr_pres + 0.15 * dt), 1),
            })
        return predictions


class IMDOperationalBenchmark:
    """Published IMD Operational 2025 Average Track Forecast Errors."""

    RMSE_24H_KM = 80.0
    RMSE_48H_KM = 120.0
    RMSE_72H_KM = 175.0
    WIND_MAE_KMPH = 5.8
    PRESSURE_MAE_HPA = 2.4

    @classmethod
    def get_benchmark_metrics(cls) -> BaselineMetrics:
        return BaselineMetrics(
            baseline_name="IMD Operational (2025 Published Reference)",
            rmse_24h_km=cls.RMSE_24H_KM,
            rmse_48h_km=cls.RMSE_48H_KM,
            rmse_72h_km=cls.RMSE_72H_KM,
            wind_mae_kmph=cls.WIND_MAE_KMPH,
            pressure_mae_hpa=cls.PRESSURE_MAE_HPA,
            description="Official India Meteorological Department operational track forecast error benchmark (2025 season report).",
        )


def evaluate_forecast_against_ground_truth(
    forecast: List[Dict[str, Any]],
    ground_truth: List[Dict[str, Any]],
) -> Dict[str, float]:
    """Computes error metrics at 24h, 48h, 72h lead times against true points."""
    errors_24: List[float] = []
    errors_48: List[float] = []
    errors_72: List[float] = []
    wind_errors: List[float] = []
    pres_errors: List[float] = []

    # Map ground truth by lead_hours
    gt_map = {int(p.get("lead_hours", 0)): p for p in ground_truth if "lead_hours" in p}

    for f_pt in forecast:
        lh = int(f_pt.get("lead_hours", 0))
        if lh in gt_map:
            gt_pt = gt_map[lh]
            dist = haversine_distance(
                float(f_pt["lat"]), float(f_pt["lon"]),
                float(gt_pt["lat"]), float(gt_pt["lon"]),
            )
            if lh <= 24:
                errors_24.append(dist ** 2)
            if lh <= 48:
                errors_48.append(dist ** 2)
            if lh <= 72:
                errors_72.append(dist ** 2)

            if "wind_kmph" in f_pt and "wind_kmph" in gt_pt:
                wind_errors.append(abs(float(f_pt["wind_kmph"]) - float(gt_pt["wind_kmph"])))
            if "pressure_hpa" in f_pt and "pressure_hpa" in gt_pt:
                pres_errors.append(abs(float(f_pt["pressure_hpa"]) - float(gt_pt["pressure_hpa"])))

    rmse_24 = math.sqrt(sum(errors_24) / len(errors_24)) if errors_24 else 0.0
    rmse_48 = math.sqrt(sum(errors_48) / len(errors_48)) if errors_48 else 0.0
    rmse_72 = math.sqrt(sum(errors_72) / len(errors_72)) if errors_72 else 0.0
    wind_mae = sum(wind_errors) / len(wind_errors) if wind_errors else 0.0
    pres_mae = sum(pres_errors) / len(pres_errors) if pres_errors else 0.0

    return {
        "rmse_24h_km": round(rmse_24, 2),
        "rmse_48h_km": round(rmse_48, 2),
        "rmse_72h_km": round(rmse_72, 2),
        "wind_mae_kmph": round(wind_mae, 2),
        "pressure_mae_hpa": round(pres_mae, 2),
    }
