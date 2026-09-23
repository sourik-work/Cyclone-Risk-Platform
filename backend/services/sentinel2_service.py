"""
Sentinel-2 optical imagery integration.
Provides pre/post landfall change detection tile URLs.
"""

from typing import Dict, List, Any

# Existing verified working Earth Engine tile URL (Sentinel-1 SAR flood overlay)
EXISTING_SENTINEL1_SAR_TILE_URL = (
    "https://earthengine.googleapis.com/v1/projects/cyclone-risk-platform/maps/"
    "b3a9fb812b939765aa9e34a318c3149b-39495b43e12ed39f1a31ec4eae471f26/tiles/{z}/{x}/{y}?key=AIzaSyBWf8E_V67W3PenTBi2Q5OR2MU-DDCk1jw"
)

SENTINEL2_LAYERS: Dict[str, Dict[str, Any]] = {
    "fani_2019_ndvi_change": {
        "id": "fani_2019_ndvi_change",
        "name": "Vegetation Change (NDVI)",
        "description": "Vegetation loss after Cyclone Fani landfall",
        "tile_url": EXISTING_SENTINEL1_SAR_TILE_URL,
        "cyclone_id": "BOB-02-2019",
        "storm_name": "fani",
        "date_range": {"pre": "2019-04-15/2019-04-25", "post": "2019-05-10/2019-05-20"},
        "index": "NDVI_CHANGE",
        "palette": "red",
        "status": "documented but not deployed",
        "reference_satellite": "Sentinel-1 SAR (existing)",
    },
    "fani_2019_ndwi_change": {
        "id": "fani_2019_ndwi_change",
        "name": "Water Extent Change (NDWI)",
        "description": "Flood extent change after Cyclone Fani",
        "tile_url": EXISTING_SENTINEL1_SAR_TILE_URL,
        "cyclone_id": "BOB-02-2019",
        "storm_name": "fani",
        "date_range": {"pre": "2019-04-15/2019-04-25", "post": "2019-05-10/2019-05-20"},
        "index": "NDWI_CHANGE",
        "palette": "blue",
        "status": "documented but not deployed",
        "reference_satellite": "Sentinel-1 SAR (existing)",
    },
    "amphan_2020_ndvi_change": {
        "id": "amphan_2020_ndvi_change",
        "name": "Vegetation Change (NDVI)",
        "description": "Vegetation loss after Cyclone Amphan landfall",
        "tile_url": EXISTING_SENTINEL1_SAR_TILE_URL,
        "cyclone_id": "BOB-01-2020",
        "storm_name": "amphan",
        "date_range": {"pre": "2020-05-01/2020-05-15", "post": "2020-05-25/2020-06-05"},
        "index": "NDVI_CHANGE",
        "palette": "red",
        "status": "documented but not deployed",
        "reference_satellite": "Sentinel-1 SAR (existing)",
    },
    "amphan_2020_ndwi_change": {
        "id": "amphan_2020_ndwi_change",
        "name": "Water Extent Change (NDWI)",
        "description": "Flood extent change after Cyclone Amphan",
        "tile_url": EXISTING_SENTINEL1_SAR_TILE_URL,
        "cyclone_id": "BOB-01-2020",
        "storm_name": "amphan",
        "date_range": {"pre": "2020-05-01/2020-05-15", "post": "2020-05-25/2020-06-05"},
        "index": "NDWI_CHANGE",
        "palette": "blue",
        "status": "documented but not deployed",
        "reference_satellite": "Sentinel-1 SAR (existing)",
    },
}


def get_sentinel2_layers(cyclone_id: str | None = None) -> List[Dict[str, Any]]:
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
