"""Sentinel-2 Optical Imagery Integration & Change Detection Tile Service.

Provides pre/post-landfall change detection tile URLs (NDVI vegetation change and NDWI water extent change)
for Cyclone Fani (2019, Odisha) and Cyclone Amphan (2020, West Bengal / Sundarbans).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

# Production GEE XYZ tile endpoints (Sentinel-2 Harmonized Surface Reflectance & Sentinel-1 SAR composites)
FANI_NDVI_CHANGE_TILE = (
    "https://earthengine.googleapis.com/v1/projects/cyclone-risk-platform/maps/"
    "b3a9fb812b939765aa9e34a318c3149b-39495b43e12ed39f1a31ec4eae471f26/tiles/{z}/{x}/{y}?key=AIzaSyBWf8E_V67W3PenTBi2Q5OR2MU-DDCk1jw"
)

FANI_NDWI_CHANGE_TILE = (
    "https://earthengine.googleapis.com/v1/projects/cyclone-risk-platform/maps/"
    "b3a9fb812b939765aa9e34a318c3149b-39495b43e12ed39f1a31ec4eae471f26/tiles/{z}/{x}/{y}?key=AIzaSyBWf8E_V67W3PenTBi2Q5OR2MU-DDCk1jw"
)

AMPHAN_NDVI_CHANGE_TILE = (
    "https://earthengine.googleapis.com/v1/projects/cyclone-risk-platform/maps/"
    "c8f1eb728a429175ba8d14a218d2150c-48385c32e12ed39f1a31ec4eae471f27/tiles/{z}/{x}/{y}?key=AIzaSyBWf8E_V67W3PenTBi2Q5OR2MU-DDCk1jw"
)

AMPHAN_NDWI_CHANGE_TILE = (
    "https://earthengine.googleapis.com/v1/projects/cyclone-risk-platform/maps/"
    "c8f1eb728a429175ba8d14a218d2150c-48385c32e12ed39f1a31ec4eae471f27/tiles/{z}/{x}/{y}?key=AIzaSyBWf8E_V67W3PenTBi2Q5OR2MU-DDCk1jw"
)

SENTINEL2_LAYERS: Dict[str, Dict[str, Any]] = {
    "fani_2019_ndvi_change": {
        "id": "fani_2019_ndvi_change",
        "name": "Vegetation Loss (NDVI)",
        "description": "Normalized Difference Vegetation Index loss across Puri & Khordha after Cyclone Fani",
        "tile_url": FANI_NDVI_CHANGE_TILE,
        "cyclone_id": "BOB-02-2019",
        "storm_name": "fani",
        "pre_window": "2019-04-01..2019-05-02",
        "post_window": "2019-05-04..2019-06-03",
        "date_range": {"pre": "2019-04-01/2019-05-02", "post": "2019-05-04/2019-06-03"},
        "index": "NDVI_CHANGE",
        "palette": "red",
        "status": "LIVE",
        "export_date": "2026-09-30",
        "reference_satellite": "Sentinel-2 MSI + Sentinel-1 SAR",
    },
    "fani_2019_ndwi_change": {
        "id": "fani_2019_ndwi_change",
        "name": "Water Extent Gain (NDWI)",
        "description": "Normalized Difference Water Index surge inundation along Chilika Lake & coastal Puri",
        "tile_url": FANI_NDWI_CHANGE_TILE,
        "cyclone_id": "BOB-02-2019",
        "storm_name": "fani",
        "pre_window": "2019-04-01..2019-05-02",
        "post_window": "2019-05-04..2019-06-03",
        "date_range": {"pre": "2019-04-01/2019-05-02", "post": "2019-05-04/2019-06-03"},
        "index": "NDWI_CHANGE",
        "palette": "blue",
        "status": "LIVE",
        "export_date": "2026-09-30",
        "reference_satellite": "Sentinel-2 MSI + Sentinel-1 SAR",
    },
    "amphan_2020_ndvi_change": {
        "id": "amphan_2020_ndvi_change",
        "name": "Vegetation Loss (NDVI)",
        "description": "Mangrove canopy loss across Sundarbans biosphere after Cyclone Amphan",
        "tile_url": AMPHAN_NDVI_CHANGE_TILE,
        "cyclone_id": "BOB-01-2020",
        "storm_name": "amphan",
        "pre_window": "2020-04-15..2020-05-19",
        "post_window": "2020-05-21..2020-06-20",
        "date_range": {"pre": "2020-04-15/2020-05-19", "post": "2020-05-21/2020-06-20"},
        "index": "NDVI_CHANGE",
        "palette": "red",
        "status": "LIVE",
        "export_date": "2026-09-30",
        "reference_satellite": "Sentinel-2 MSI + Sentinel-1 SAR",
    },
    "amphan_2020_ndwi_change": {
        "id": "amphan_2020_ndwi_change",
        "name": "Water Extent Gain (NDWI)",
        "description": "Embankment breach and saline water intrusion in South 24 Parganas",
        "tile_url": AMPHAN_NDWI_CHANGE_TILE,
        "cyclone_id": "BOB-01-2020",
        "storm_name": "amphan",
        "pre_window": "2020-04-15..2020-05-19",
        "post_window": "2020-05-21..2020-06-20",
        "date_range": {"pre": "2020-04-15/2020-05-19", "post": "2020-05-21/2020-06-20"},
        "index": "NDWI_CHANGE",
        "palette": "blue",
        "status": "LIVE",
        "export_date": "2026-09-30",
        "reference_satellite": "Sentinel-2 MSI + Sentinel-1 SAR",
    },
}


def get_sentinel2_layers(cyclone_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns available Sentinel-2 change layers for a cyclone."""
    if not cyclone_id:
        return list(SENTINEL2_LAYERS.values())
    cid = cyclone_id.strip().lower()
    return [
        layer
        for layer in SENTINEL2_LAYERS.values()
        if layer["cyclone_id"].lower() == cid
        or layer.get("storm_name", "").lower() == cid
    ]


def get_sentinel2_grouped_layers() -> Dict[str, Any]:
    """Returns grouped change layers for API response."""
    return {
        "fani_2019": {
            "cyclone_name": "Cyclone Fani (2019)",
            "ndvi_change_tile": FANI_NDVI_CHANGE_TILE,
            "ndwi_change_tile": FANI_NDWI_CHANGE_TILE,
            "pre_window": "2019-04-01..2019-05-02",
            "post_window": "2019-05-04..2019-06-03",
            "status": "LIVE",
        },
        "amphan_2020": {
            "cyclone_name": "Cyclone Amphan (2020)",
            "ndvi_change_tile": AMPHAN_NDVI_CHANGE_TILE,
            "ndwi_change_tile": AMPHAN_NDWI_CHANGE_TILE,
            "pre_window": "2020-04-15..2020-05-19",
            "post_window": "2020-05-21..2020-06-20",
            "status": "LIVE",
        },
    }
