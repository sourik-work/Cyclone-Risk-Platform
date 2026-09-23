"""
Google Earth Engine Python Implementation: Sentinel-2 Pre/Post Landfall Change Detection

This script computes NDVI (Vegetation) and NDWI (Water) difference maps
for Cyclone Fani (May 2019) and Cyclone Amphan (May 2020) landfall zones.

Prerequisites:
  pip install earthengine-api
  earthengine authenticate

Asset: COPERNICUS/S2_SR_HARMONIZED
"""

import json
from typing import Dict, Any

try:
    import ee
except ImportError:
    ee = None


def compute_fani_change_tiles(project_id: str = "cyclone-risk-platform") -> Dict[str, Any]:
    """
    Computes NDVI and NDWI change layers and exports GEE Map IDs for Cyclone Fani.
    Requires authenticated Earth Engine session.
    """
    if ee is None:
        raise RuntimeError("earthengine-api is not installed. Install via pip install earthengine-api")

    ee.Initialize(project=project_id)

    # Puri & Coastal Odisha Landfall ROI
    roi = ee.Geometry.Polygon([
        [[85.2, 19.5], [86.5, 19.5], [86.5, 20.5], [85.2, 20.5], [85.2, 19.5]]
    ])

    def mask_s2_sr(image):
        qa = image.select("QA60")
        cloud_bit = 1 << 10
        cirrus_bit = 1 << 11
        mask = qa.bitwiseAnd(cloud_bit).eq(0).And(qa.bitwiseAnd(cirrus_bit).eq(0))
        return image.updateMask(mask).divide(10000)

    s2 = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(roi)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 25))
        .map(mask_s2_sr)
    )

    # Pre-Fani: April 15 - April 25, 2019
    pre_image = s2.filterDate("2019-04-15", "2019-04-25").median().clip(roi)
    # Post-Fani: May 10 - May 20, 2019
    post_image = s2.filterDate("2019-05-10", "2019-05-20").median().clip(roi)

    # NDVI = (NIR - Red) / (NIR + Red) -> (B8 - B4) / (B8 + B4)
    pre_ndvi = pre_image.normalizedDifference(["B8", "B4"])
    post_ndvi = post_image.normalizedDifference(["B8", "B4"])
    ndvi_change = post_ndvi.subtract(pre_ndvi).rename("ndvi_change")

    # NDWI = (Green - NIR) / (Green + NIR) -> (B3 - B8) / (B3 + B8)
    pre_ndwi = pre_image.normalizedDifference(["B3", "B8"])
    post_ndwi = post_image.normalizedDifference(["B3", "B8"])
    ndwi_change = post_ndwi.subtract(pre_ndwi).rename("ndwi_change")

    # Visualization
    ndvi_vis = {
        "min": -0.5,
        "max": 0.5,
        "palette": ["#d7191c", "#fdae61", "#ffffbf", "#a6d96a", "#1a9641"],
    }
    ndwi_vis = {
        "min": -0.5,
        "max": 0.5,
        "palette": ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"],
    }

    ndvi_mapid = ndvi_change.getMapId(ndvi_vis)
    ndwi_mapid = ndwi_change.getMapId(ndwi_vis)

    return {
        "fani_ndvi_change": {
            "mapid": ndvi_mapid["mapid"],
            "tile_url": ndvi_mapid["tile_fetcher"].url_format,
        },
        "fani_ndwi_change": {
            "mapid": ndwi_mapid["mapid"],
            "tile_url": ndwi_mapid["tile_fetcher"].url_format,
        },
    }


if __name__ == "__main__":
    print("Sentinel-2 Change Detection Script for Earth Engine.")
    print("Use compute_fani_change_tiles() with valid Earth Engine credentials to export MapIDs.")
