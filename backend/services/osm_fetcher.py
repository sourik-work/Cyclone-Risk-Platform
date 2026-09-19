"""OpenStreetMap Overpass API wrapper with local GeoJSON caching and rate limiting."""

import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import requests

logger = logging.getLogger(__name__)

OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
OSM_CACHE_FILE = Path("data/external/osm_infrastructure.geojson")

# District default bounding boxes: (min_lat, min_lon, max_lat, max_lon)
DISTRICT_BBOXES: Dict[str, Tuple[float, float, float, float]] = {
    "puri": (19.65, 85.65, 20.15, 86.25),
    "ganjam": (19.00, 84.50, 19.80, 85.30),
    "balasore": (21.20, 86.60, 21.80, 87.35),
    "bhadrak": (20.70, 86.30, 21.20, 86.95),
    "kendrapara": (20.30, 86.25, 20.80, 87.10),
    "jagatsinghpur": (19.90, 86.10, 20.40, 86.75),
    "digha": (21.55, 87.40, 21.75, 87.65),
    "east medinipur": (21.60, 87.40, 22.30, 88.00),
    "south 24 parganas": (21.50, 88.00, 22.50, 89.10),
    "visakhapatnam": (17.50, 83.10, 18.00, 83.50),
    "chennai": (12.90, 80.10, 13.25, 80.35)
}

_last_request_time = 0.0
RATE_LIMIT_COOLDOWN = 1.5  # seconds between Overpass queries


def validate_bbox(bbox: Tuple[float, float, float, float]) -> None:
    """Validate bounding box tuple format (min_lat, min_lon, max_lat, max_lon)."""
    if not isinstance(bbox, (tuple, list)) or len(bbox) != 4:
        raise ValueError("bbox must be a tuple of 4 floats: (min_lat, min_lon, max_lat, max_lon)")
    
    min_lat, min_lon, max_lat, max_lon = bbox
    if not (-90.0 <= min_lat <= 90.0 and -90.0 <= max_lat <= 90.0):
        raise ValueError(f"Latitudes must be between -90 and 90. Got: {min_lat}, {max_lat}")
    if not (-180.0 <= min_lon <= 180.0 and -180.0 <= max_lon <= 180.0):
        raise ValueError(f"Longitudes must be between -180 and 180. Got: {min_lon}, {max_lon}")
    if min_lat > max_lat:
        raise ValueError(f"min_lat ({min_lat}) cannot be greater than max_lat ({max_lat})")
    if min_lon > max_lon:
        raise ValueError(f"min_lon ({min_lon}) cannot be greater than max_lon ({max_lon})")


def get_district_bbox(district: str) -> Tuple[float, float, float, float]:
    """Retrieve bounding box tuple for a known coastal district, or fallback default."""
    clean = district.strip().lower()
    return DISTRICT_BBOXES.get(clean, (19.65, 85.65, 20.15, 86.25))


def _load_cached_geojson() -> Dict[str, Any]:
    """Load local GeoJSON cache."""
    if OSM_CACHE_FILE.exists():
        try:
            with open(OSM_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read OSM cache: {e}")
    return {"type": "FeatureCollection", "features": []}


def _save_cached_geojson(data: Dict[str, Any]) -> None:
    """Save updated features to local GeoJSON cache."""
    try:
        OSM_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(OSM_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"Failed to write OSM cache: {e}")


def _query_overpass(query: str) -> Optional[Dict[str, Any]]:
    """Execute Overpass QL POST query with rate limiting and timeout handling."""
    global _last_request_time
    elapsed = time.time() - _last_request_time
    if elapsed < RATE_LIMIT_COOLDOWN:
        time.sleep(RATE_LIMIT_COOLDOWN - elapsed)

    try:
        _last_request_time = time.time()
        resp = requests.post(
            OVERPASS_API_URL,
            data={"data": query},
            timeout=3.5,
            headers={"User-Agent": "CycloneAnticipatoryActionPlatform/1.0"}
        )
        if resp.status_code == 200:
            return resp.json()
        logger.warning(f"Overpass API returned status {resp.status_code}")
    except Exception as e:
        logger.warning(f"Overpass API request failed ({e})")
    return None


def _is_in_bbox(lon: float, lat: float, bbox: Tuple[float, float, float, float]) -> bool:
    """Check if point is inside bounding box."""
    min_lat, min_lon, max_lat, max_lon = bbox
    return min_lat <= lat <= max_lat and min_lon <= lon <= max_lon


def _filter_cached_features(
    feature_category: str,
    bbox: Tuple[float, float, float, float],
    limit: int = 100
) -> List[Dict[str, Any]]:
    """Filter features from local cache matching category and bounding box."""
    cached = _load_cached_geojson()
    results = []

    for f in cached.get("features", []):
        props = f.get("properties", {})
        geom = f.get("geometry", {})
        coords = geom.get("coordinates", [])

        # Check category match
        is_match = False
        if feature_category == "road" and "highway" in props:
            is_match = True
        elif feature_category == "hospital" and props.get("amenity") == "hospital":
            is_match = True
        elif feature_category == "shelter" and (
            props.get("amenity") == "shelter" or props.get("emergency") == "cyclone_shelter"
        ):
            is_match = True

        if is_match:
            # Check rough spatial overlap if point or line
            inside = False
            if geom.get("type") == "Point" and len(coords) >= 2:
                inside = _is_in_bbox(coords[0], coords[1], bbox)
            elif geom.get("type") == "LineString" and coords:
                # Any point inside
                inside = any(_is_in_bbox(pt[0], pt[1], bbox) for pt in coords if len(pt) >= 2)
            else:
                inside = True  # default include if coordinates irregular

            if inside:
                feat_copy = dict(f)
                feat_props = dict(props)
                feat_props["feature_type"] = feature_category
                feat_copy["properties"] = feat_props
                results.append(feat_copy)
                if len(results) >= limit:
                    break

    return results


def fetch_roads(bbox: Tuple[float, float, float, float], limit: int = 100) -> Dict[str, Any]:
    """Fetch major road networks within the bounding box from Overpass or cache.
    
    Args:
        bbox: (min_lat, min_lon, max_lat, max_lon)
        limit: Max road features to return
    """
    validate_bbox(bbox)
    min_lat, min_lon, max_lat, max_lon = bbox

    query = f"""
    [out:json][timeout:8];
    (
      way["highway"~"motorway|trunk|primary|secondary|tertiary"]({min_lat},{min_lon},{max_lat},{max_lon});
    );
    out geom {limit};
    """
    raw_data = _query_overpass(query)

    if raw_data and "elements" in raw_data and raw_data["elements"]:
        features = []
        for elem in raw_data["elements"][:limit]:
            geometry_coords = [[pt["lon"], pt["lat"]] for pt in elem.get("geometry", [])]
            features.append({
                "type": "Feature",
                "id": f"way/{elem.get('id')}",
                "properties": {
                    "osm_id": elem.get("id"),
                    "feature_type": "road",
                    "name": elem.get("tags", {}).get("name", "Unnamed Road"),
                    "highway": elem.get("tags", {}).get("highway"),
                    "lanes": elem.get("tags", {}).get("lanes"),
                    "ref": elem.get("tags", {}).get("ref"),
                    "tags": elem.get("tags", {})
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": geometry_coords
                }
            })
        return {
            "type": "FeatureCollection",
            "count": len(features),
            "source": "OpenStreetMap Overpass API (Live)",
            "bbox": list(bbox),
            "features": features
        }

    # Fallback to local cache
    cached_feats = _filter_cached_features("road", bbox, limit)
    return {
        "type": "FeatureCollection",
        "count": len(cached_feats),
        "source": "OpenStreetMap Infrastructure Cache",
        "bbox": list(bbox),
        "features": cached_feats
    }


def fetch_hospitals(bbox: Tuple[float, float, float, float], limit: int = 100) -> Dict[str, Any]:
    """Fetch healthcare facilities and hospitals within the bounding box.
    
    Args:
        bbox: (min_lat, min_lon, max_lat, max_lon)
        limit: Max hospital features to return
    """
    validate_bbox(bbox)
    min_lat, min_lon, max_lat, max_lon = bbox

    query = f"""
    [out:json][timeout:8];
    (
      node["amenity"="hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
      way["amenity"="hospital"]({min_lat},{min_lon},{max_lat},{max_lon});
    );
    out center {limit};
    """
    raw_data = _query_overpass(query)

    if raw_data and "elements" in raw_data and raw_data["elements"]:
        features = []
        for elem in raw_data["elements"][:limit]:
            lat = elem.get("lat") or elem.get("center", {}).get("lat", 0.0)
            lon = elem.get("lon") or elem.get("center", {}).get("lon", 0.0)
            features.append({
                "type": "Feature",
                "id": f"{elem.get('type', 'node')}/{elem.get('id')}",
                "properties": {
                    "osm_id": elem.get("id"),
                    "feature_type": "hospital",
                    "name": elem.get("tags", {}).get("name", "Hospital / Health Center"),
                    "amenity": "hospital",
                    "beds": elem.get("tags", {}).get("beds"),
                    "emergency": elem.get("tags", {}).get("emergency"),
                    "tags": elem.get("tags", {})
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
            })
        return {
            "type": "FeatureCollection",
            "count": len(features),
            "source": "OpenStreetMap Overpass API (Live)",
            "bbox": list(bbox),
            "features": features
        }

    # Fallback to local cache
    cached_feats = _filter_cached_features("hospital", bbox, limit)
    return {
        "type": "FeatureCollection",
        "count": len(cached_feats),
        "source": "OpenStreetMap Infrastructure Cache",
        "bbox": list(bbox),
        "features": cached_feats
    }


def fetch_shelters(bbox: Tuple[float, float, float, float], limit: int = 100) -> Dict[str, Any]:
    """Fetch designated cyclone shelters and emergency refuges within the bounding box.
    
    Args:
        bbox: (min_lat, min_lon, max_lat, max_lon)
        limit: Max shelter features to return
    """
    validate_bbox(bbox)
    min_lat, min_lon, max_lat, max_lon = bbox

    query = f"""
    [out:json][timeout:8];
    (
      node["amenity"="shelter"]({min_lat},{min_lon},{max_lat},{max_lon});
      node["emergency"="cyclone_shelter"]({min_lat},{min_lon},{max_lat},{max_lon});
      way["amenity"="shelter"]({min_lat},{min_lon},{max_lat},{max_lon});
      way["emergency"="cyclone_shelter"]({min_lat},{min_lon},{max_lat},{max_lon});
    );
    out center {limit};
    """
    raw_data = _query_overpass(query)

    if raw_data and "elements" in raw_data and raw_data["elements"]:
        features = []
        for elem in raw_data["elements"][:limit]:
            lat = elem.get("lat") or elem.get("center", {}).get("lat", 0.0)
            lon = elem.get("lon") or elem.get("center", {}).get("lon", 0.0)
            features.append({
                "type": "Feature",
                "id": f"{elem.get('type', 'node')}/{elem.get('id')}",
                "properties": {
                    "osm_id": elem.get("id"),
                    "feature_type": "shelter",
                    "name": elem.get("tags", {}).get("name", "Multipurpose Cyclone Shelter"),
                    "capacity": elem.get("tags", {}).get("capacity", 1500),
                    "tags": elem.get("tags", {})
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
            })
        return {
            "type": "FeatureCollection",
            "count": len(features),
            "source": "OpenStreetMap Overpass API (Live)",
            "bbox": list(bbox),
            "features": features
        }

    # Fallback to local cache
    cached_feats = _filter_cached_features("shelter", bbox, limit)
    return {
        "type": "FeatureCollection",
        "count": len(cached_feats),
        "source": "OpenStreetMap Infrastructure Cache",
        "bbox": list(bbox),
        "features": cached_feats
    }
