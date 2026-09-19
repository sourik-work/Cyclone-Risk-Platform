"""ISRO Bhuvan Web Map Service (WMS) wrapper for coastal hazard, elevation, and landuse layers."""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

BHUVAN_WMS_BASE = "https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms"

# Catalog of supported Bhuvan geospatial layers with spatial metadata
BHUVAN_LAYERS: Dict[str, Dict[str, Any]] = {
    "coastal_vulnerability": {
        "title": "ISRO Bhuvan Coastal Vulnerability Index (CVI)",
        "wms_layer": "coastal:cvi_india",
        "abstract": "Physical and socio-economic coastal vulnerability classification along the Indian coastline by NRSC/ISRO.",
        "bounds": [68.1, 8.0, 97.4, 22.0],  # [min_lon, min_lat, max_lon, max_lat]
        "crs": "EPSG:4326",
        "resolution": "30m",
        "format": "image/png",
        "default_style": "cvi_severity_style"
    },
    "landuse": {
        "title": "ISRO Bhuvan Land Use / Land Cover (LULC 50K)",
        "wms_layer": "lulc:lulc50k_1516",
        "abstract": "National land use and land cover thematic mapping at 1:50,000 scale capturing agricultural, forest, water bodies, and settlements.",
        "bounds": [68.1, 8.0, 97.4, 37.1],
        "crs": "EPSG:4326",
        "resolution": "50m",
        "format": "image/png",
        "default_style": "lulc_standard"
    },
    "flood_hazard": {
        "title": "ISRO Bhuvan Historic Flood Hazard Zonation",
        "wms_layer": "flood:hazard_zonation",
        "abstract": "Multi-year flood inundation frequency and hazard zonation derived from RISAT-1 and optical satellite archives.",
        "bounds": [80.0, 16.0, 90.0, 24.0],
        "crs": "EPSG:4326",
        "resolution": "30m",
        "format": "image/png",
        "default_style": "flood_hazard_levels"
    },
    "elevation": {
        "title": "ISRO CartoDEM High Resolution Elevation Model",
        "wms_layer": "dem:cartodem_30m",
        "abstract": "Cartosat-1 stereo-pair derived digital elevation model with 30m posting for terrain profiling and storm surge inundation.",
        "bounds": [68.1, 8.0, 97.4, 37.1],
        "crs": "EPSG:4326",
        "resolution": "30m",
        "format": "image/png",
        "default_style": "dem_hypsometric"
    }
}


def get_tile_url_template(layer: str) -> str:
    """Generate the standardized WMS GetMap tile URL template for frontend map clients (Leaflet / MapLibre).
    
    Args:
        layer: Layer key (e.g. 'coastal_vulnerability', 'landuse', 'flood_hazard', 'elevation')
        
    Returns:
        URL string template with bbox parameter placeholder.
    """
    key = layer.strip().lower().replace("-", "_").replace(" ", "_")
    meta = BHUVAN_LAYERS.get(key)
    wms_layer_name = meta["wms_layer"] if meta else f"bhuvan:{key}"

    # Standard WMS 1.1.1 template with Leaflet/MapLibre dynamic bbox substitution
    url_template = (
        f"{BHUVAN_WMS_BASE}?service=WMS&version=1.1.1&request=GetMap"
        f"&layers={wms_layer_name}&styles=&bbox={{bbox-epsg-3857}}"
        f"&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true"
    )
    return url_template


def fetch_layer_metadata(layer: str) -> Dict[str, Any]:
    """Return layer metadata including bounds, projection, resolution, and tile URL template.
    
    Args:
        layer: Layer key name
        
    Returns:
        Dictionary conforming to BhuvanLayer schema
    """
    key = layer.strip().lower().replace("-", "_").replace(" ", "_")
    
    if key in BHUVAN_LAYERS:
        meta = BHUVAN_LAYERS[key]
        return {
            "layer_id": key,
            "title": meta["title"],
            "abstract": meta["abstract"],
            "bounds": meta["bounds"],
            "crs": meta["crs"],
            "resolution": meta["resolution"],
            "tile_url_template": get_tile_url_template(key),
            "source": "ISRO Bhuvan WMS (NRSC)",
            "wms_base": BHUVAN_WMS_BASE
        }

    # Fallback for unrecognized or custom layer requests
    return {
        "layer_id": key,
        "title": f"Bhuvan Custom Layer: {layer}",
        "abstract": f"ISRO Bhuvan WMS layer {layer}",
        "bounds": [68.1, 8.0, 97.4, 37.1],
        "crs": "EPSG:4326",
        "resolution": "30m",
        "tile_url_template": get_tile_url_template(key),
        "source": "ISRO Bhuvan WMS (NRSC)",
        "wms_base": BHUVAN_WMS_BASE
    }


def list_supported_layers() -> List[str]:
    """List all supported layer identifier keys."""
    return list(BHUVAN_LAYERS.keys())
