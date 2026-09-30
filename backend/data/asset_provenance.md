# Infrastructure Asset Provenance & Catalog Documentation

## 1. Overview
The Cyclone Risk & Anticipatory Action Platform integrates a spatial critical infrastructure inventory across coastal India, specifically designed for compound hazard exposure reasoning, power grid fragility analysis, and anticipatory logistics triage.

---

## 2. Data Sources & Provenance Mapping

| Asset Class | Primary Data Sources | Verification Authority | Confidence Tier (1-5) | Provenance Tag |
|-------------|---------------------|------------------------|----------------------|----------------|
| **Grid Substations (132kV - 400kV)** | State Transmission Utilities (OPTCL, WBSETCL, APTRANSCO, TANTRANSCO, GETCO, KSEB) | CEA / State DISCOM Portals | Tier 5 (Operational) | `DISCOM` |
| **Transmission Corridors** | State Transmission Utilities SLDC Single Line Diagrams & OSM Power Grid Overlays | State Load Despatch Centres | Tier 4 (Synthesized) | `DISCOM` / `OSM` |
| **Multipurpose Cyclone Shelters (MPCS)** | National Cyclone Risk Mitigation Project (NCRMP) & State Disaster Management Authorities (OSDMA, WBSDMA, APSDMA, TNSDMA) | NDMA / SDMA | Tier 5 (Government Registry) | `NDMA` |
| **District Hospitals & Medical Colleges** | OpenStreetMap (`amenity=hospital`) cross-referenced with Ministry of Health & Family Welfare (MoHFW) | MoHFW / OSM | Tier 4 (Verified GeoJSON) | `OSM` |
| **Emergency Fire & Marine Police Stations** | State Fire Services & Coastal Security Police registries | State Police / Fire DGs | Tier 5 (Operational Dispatch) | `NDMA` |

---

## 3. Geographic & State Coverage

The platform catalogs **212 coastal critical infrastructure assets** across 6 Indian maritime states:

- **Core Bay of Bengal Coverage (Complete Ingestion):**
  - **Odisha (50 assets):** Puri, Jagatsinghpur (Paradip), Bhadrak (Dhamra), Balasore, Ganjam (Gopalpur), Kendrapara.
  - **West Bengal (48 assets):** Purba Medinipur (Digha, Haldia, Contai), South 24 Parganas (Sagar Island, Kakdwip, Bakkhali, Sundarbans), North 24 Parganas (Basirhat, Hingalganj).
  - **Andhra Pradesh (44 assets):** Visakhapatnam, Kakinada, Dr. B.R. Ambedkar Konaseema, Krishna (Machilipatnam), Bapatla, Prakasam (Ongole), SPSR Nellore, Srikakulam.
  - **Tamil Nadu (40 assets):** Chennai (North/Port), Tiruvallur (Ennore), Cuddalore, Nagapattinam, Ramanathapuram (Rameswaram), Thoothukudi, Kanyakumari.

- **Western Maritime Coverage (Partial / High-Priority Coastal Corridor Ingestion):**
  - **Gujarat (15 assets):** Kutch (Kandla Port, Mundra), Jamnagar, Porbandar, Bhavnagar.
  - **Kerala (15 assets):** Ernakulam (Kochi Port), Thiruvananthapuram (Vizhinjam), Alappuzha, Kozhikode, Kannur.

---

## 4. Ingestion Cadence & Refresh Strategy

1. **State DISCOM & Power Grid Topology:** Refreshed quarterly from published SLDC grid maps and tariff filings.
2. **Disaster Shelters & Emergency Services:** Refreshed semi-annually prior to pre-monsoon (April) and post-monsoon (October) cyclone seasons.
3. **OSM Healthcare & Road Infrastructure:** Ingested via Overpass API queries cached with 30-day TTL during peacetime and real-time bypass during active cyclone bulletins.

---

## 5. Documented Gaps & Known Limitations

- **DISCOM Asset Public Availability:** While Odisha (OPTCL) and West Bengal (WBSETCL) publish GIS single-line diagrams, Andhra Pradesh and Tamil Nadu provide ~70% GIS coverage; remaining distribution feeders are interpolated from substation catchment radii.
- **Micro-Grid & Rural Feeders:** Below 33kV distribution lines (11kV / 415V LT lines) are modeled as aggregate district load polygons rather than discrete line geometries to preserve rendering performance and privacy.
- **Shelter Structural Hardening:** Shelter capacities reflect government design thresholds; actual live surge resistance depends on localized maintenance status logged in SDMA field reports.
