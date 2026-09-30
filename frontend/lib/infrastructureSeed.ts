// Pre-bundled GeoJSON for 4 coastal states infrastructure (power grid, arterial roads, hospitals/shelters)
import { InfrastructureFeatureCollection } from '../components/map/types';

export const SEED_INFRASTRUCTURE_DATA: InfrastructureFeatureCollection = {
  "type": "FeatureCollection",
  "name": "Infrastructure_4States",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          85.83,
          19.81
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-001",
        "name": "Puri 220kV Grid Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Puri",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "OPTCL",
        "latitude": 19.81,
        "longitude": 85.83,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.09,
          19.89
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-002",
        "name": "Konark 132kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Puri",
        "voltage_kv": 132,
        "capacity_mva": 160,
        "operator": "OPTCL",
        "latitude": 19.89,
        "longitude": 86.09,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.64,
          20.29
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-003",
        "name": "Paradeep 400kV Port Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Jagatsinghpur",
        "voltage_kv": 400,
        "capacity_mva": 630,
        "operator": "OPTCL",
        "latitude": 20.29,
        "longitude": 86.64,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.168,
          20.255
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-004",
        "name": "Jagatsinghpur 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Jagatsinghpur",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "OPTCL",
        "latitude": 20.255,
        "longitude": 86.168,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.425,
          20.505
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-005",
        "name": "Kendrapara 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Kendrapara",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "OPTCL",
        "latitude": 20.505,
        "longitude": 86.425,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.565,
          20.575
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-006",
        "name": "Pattamundai 132kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Kendrapara",
        "voltage_kv": 132,
        "capacity_mva": 120,
        "operator": "OPTCL",
        "latitude": 20.575,
        "longitude": 86.565,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.515,
          21.055
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-007",
        "name": "Bhadrak 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Bhadrak",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "OPTCL",
        "latitude": 21.055,
        "longitude": 86.515,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.955,
          20.805
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-008",
        "name": "Dhamra Port 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Bhadrak",
        "voltage_kv": 220,
        "capacity_mva": 240,
        "operator": "OPTCL",
        "latitude": 20.805,
        "longitude": 86.955,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.935,
          21.495
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-009",
        "name": "Balasore 400kV Grid Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Balasore",
        "voltage_kv": 400,
        "capacity_mva": 630,
        "operator": "OPTCL",
        "latitude": 21.495,
        "longitude": 86.935,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          84.795,
          19.315
        ]
      },
      "properties": {
        "asset_id": "OD-SUB-010",
        "name": "Berhampur 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Odisha",
        "district": "Ganjam",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "OPTCL",
        "latitude": 19.315,
        "longitude": 84.795,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.085,
          22.065
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-001",
        "name": "Haldia 400kV Bulk Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "voltage_kv": 400,
        "capacity_mva": 630,
        "operator": "WBSETCL",
        "latitude": 22.065,
        "longitude": 88.085,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          87.525,
          21.625
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-002",
        "name": "Digha 132kV Coastal Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "voltage_kv": 132,
        "capacity_mva": 160,
        "operator": "WBSETCL",
        "latitude": 21.625,
        "longitude": 87.525,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          87.75,
          21.78
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-003",
        "name": "Contai 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "WBSETCL",
        "latitude": 21.78,
        "longitude": 87.75,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          87.87,
          22.42
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-004",
        "name": "Kolaghat 400kV Thermal Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "voltage_kv": 400,
        "capacity_mva": 800,
        "operator": "WBSETCL",
        "latitude": 22.42,
        "longitude": 87.87,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.19,
          22.195
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-005",
        "name": "Diamond Harbour 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "South 24 Parganas",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "WBSETCL",
        "latitude": 22.195,
        "longitude": 88.19,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.185,
          21.875
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-006",
        "name": "Kakdwip 132kV Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "South 24 Parganas",
        "voltage_kv": 132,
        "capacity_mva": 160,
        "operator": "WBSETCL",
        "latitude": 21.875,
        "longitude": 88.185,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.435,
          22.365
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-007",
        "name": "Baruipur 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "South 24 Parganas",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "WBSETCL",
        "latitude": 22.365,
        "longitude": 88.435,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.66,
          22.31
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-008",
        "name": "Canning 132kV Delta Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "South 24 Parganas",
        "voltage_kv": 132,
        "capacity_mva": 120,
        "operator": "WBSETCL",
        "latitude": 22.31,
        "longitude": 88.66,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.48,
          22.72
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-009",
        "name": "Barasat 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "North 24 Parganas",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "WBSETCL",
        "latitude": 22.72,
        "longitude": 88.48,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.865,
          22.655
        ]
      },
      "properties": {
        "asset_id": "WB-SUB-010",
        "name": "Basirhat 132kV Border Substation",
        "asset_type": "SUBSTATION",
        "state": "West Bengal",
        "district": "North 24 Parganas",
        "voltage_kv": 132,
        "capacity_mva": 160,
        "operator": "WBSETCL",
        "latitude": 22.655,
        "longitude": 88.865,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.895,
          18.295
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-001",
        "name": "Srikakulam 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "Srikakulam",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "APTRANSCO",
        "latitude": 18.295,
        "longitude": 83.895,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          84.23,
          18.61
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-002",
        "name": "Tekkali 132kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "Srikakulam",
        "voltage_kv": 132,
        "capacity_mva": 160,
        "operator": "APTRANSCO",
        "latitude": 18.61,
        "longitude": 84.23,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.415,
          18.115
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-003",
        "name": "Vizianagaram 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "Vizianagaram",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "APTRANSCO",
        "latitude": 18.115,
        "longitude": 83.415,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.49,
          18.02
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-004",
        "name": "Bhogapuram 132kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "Vizianagaram",
        "voltage_kv": 132,
        "capacity_mva": 160,
        "operator": "APTRANSCO",
        "latitude": 18.02,
        "longitude": 83.49,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.18,
          17.65
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-005",
        "name": "Visakhapatnam 400kV Kalpaka Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "voltage_kv": 400,
        "capacity_mva": 630,
        "operator": "APTRANSCO",
        "latitude": 17.65,
        "longitude": 83.18,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.215,
          17.695
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-006",
        "name": "Gajuwaka 220kV Industrial Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "APTRANSCO",
        "latitude": 17.695,
        "longitude": 83.215,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.005,
          17.69
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-007",
        "name": "Anakapalle 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "APTRANSCO",
        "latitude": 17.69,
        "longitude": 83.005,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          82.255,
          16.965
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-008",
        "name": "Kakinada 220kV Port Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "APTRANSCO",
        "latitude": 16.965,
        "longitude": 82.255,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          81.785,
          17.005
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-009",
        "name": "Rajahmundry 400kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "voltage_kv": 400,
        "capacity_mva": 630,
        "operator": "APTRANSCO",
        "latitude": 17.005,
        "longitude": 81.785,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          82.005,
          16.575
        ]
      },
      "properties": {
        "asset_id": "AP-SUB-010",
        "name": "Amalapuram 132kV Delta Substation",
        "asset_type": "SUBSTATION",
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "voltage_kv": 132,
        "capacity_mva": 160,
        "operator": "APTRANSCO",
        "latitude": 16.575,
        "longitude": 82.005,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          80.32,
          13.21
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-001",
        "name": "Ennore 400kV Thermal Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "voltage_kv": 400,
        "capacity_mva": 800,
        "operator": "TANTRANSCO",
        "latitude": 13.21,
        "longitude": 80.32,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          80.29,
          13.13
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-002",
        "name": "Tondiarpet 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "TANTRANSCO",
        "latitude": 13.13,
        "longitude": 80.29,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          80.265,
          13.035
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-003",
        "name": "Mylapore 220kV GIS Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "TANTRANSCO",
        "latitude": 13.035,
        "longitude": 80.265,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          80.21,
          13.008
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-004",
        "name": "Guindy 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "TANTRANSCO",
        "latitude": 13.008,
        "longitude": 80.21,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.765,
          11.75
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-005",
        "name": "Cuddalore 220kV SIPCOT Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Cuddalore",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "TANTRANSCO",
        "latitude": 11.75,
        "longitude": 79.765,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.485,
          11.595
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-006",
        "name": "Neyveli 400kV Thermal Grid Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Cuddalore",
        "voltage_kv": 400,
        "capacity_mva": 1000,
        "operator": "TANTRANSCO",
        "latitude": 11.595,
        "longitude": 79.485,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.692,
          11.398
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-007",
        "name": "Chidambaram 132kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Cuddalore",
        "voltage_kv": 132,
        "capacity_mva": 160,
        "operator": "TANTRANSCO",
        "latitude": 11.398,
        "longitude": 79.692,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.845,
          10.765
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-008",
        "name": "Nagapattinam 220kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Nagapattinam",
        "voltage_kv": 220,
        "capacity_mva": 320,
        "operator": "TANTRANSCO",
        "latitude": 10.765,
        "longitude": 79.845,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.84,
          10.68
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-009",
        "name": "Velankanni 132kV Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Nagapattinam",
        "voltage_kv": 132,
        "capacity_mva": 120,
        "operator": "TANTRANSCO",
        "latitude": 10.68,
        "longitude": 79.84,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.855,
          10.375
        ]
      },
      "properties": {
        "asset_id": "TN-SUB-010",
        "name": "Vedaranyam 132kV Coastal Substation",
        "asset_type": "SUBSTATION",
        "state": "Tamil Nadu",
        "district": "Nagapattinam",
        "voltage_kv": 132,
        "capacity_mva": 120,
        "operator": "TANTRANSCO",
        "latitude": 10.375,
        "longitude": 79.855,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            85.83,
            19.81
          ],
          [
            85.82,
            20.0
          ],
          [
            85.8245,
            20.2961
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-LINE-001",
        "name": "Puri-Bhubaneswar 220kV Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Odisha",
        "voltage_kv": 220,
        "length_km": 62,
        "operator": "OPTCL",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            86.64,
            20.29
          ],
          [
            86.41,
            20.27
          ],
          [
            86.168,
            20.255
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-LINE-002",
        "name": "Paradeep-Jagatsinghpur 400kV Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Odisha",
        "voltage_kv": 400,
        "length_km": 54,
        "operator": "OPTCL",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            86.955,
            20.805
          ],
          [
            86.72,
            20.93
          ],
          [
            86.515,
            21.055
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-LINE-003",
        "name": "Dhamra-Bhadrak 220kV Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Odisha",
        "voltage_kv": 220,
        "length_km": 48,
        "operator": "OPTCL",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            86.935,
            21.495
          ],
          [
            86.71,
            21.28
          ],
          [
            86.515,
            21.055
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-LINE-004",
        "name": "Balasore-Bhadrak 400kV Interconnect",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Odisha",
        "voltage_kv": 400,
        "length_km": 68,
        "operator": "OPTCL",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            84.795,
            19.315
          ],
          [
            84.92,
            19.35
          ],
          [
            85.05,
            19.38
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-LINE-005",
        "name": "Berhampur-Ganjam Coastal 220kV Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Odisha",
        "voltage_kv": 220,
        "length_km": 42,
        "operator": "OPTCL",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            87.87,
            22.42
          ],
          [
            87.96,
            22.25
          ],
          [
            88.085,
            22.065
          ]
        ]
      },
      "properties": {
        "asset_id": "WB-LINE-001",
        "name": "Kolaghat-Haldia 400kV Feeder",
        "asset_type": "TRANSMISSION_LINE",
        "state": "West Bengal",
        "voltage_kv": 400,
        "length_km": 58,
        "operator": "WBSETCL",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            88.085,
            22.065
          ],
          [
            87.75,
            21.78
          ],
          [
            87.525,
            21.625
          ]
        ]
      },
      "properties": {
        "asset_id": "WB-LINE-002",
        "name": "Haldia-Contai-Digha 220kV Coastal Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "West Bengal",
        "voltage_kv": 220,
        "length_km": 76,
        "operator": "WBSETCL",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            88.435,
            22.365
          ],
          [
            88.31,
            22.28
          ],
          [
            88.19,
            22.195
          ]
        ]
      },
      "properties": {
        "asset_id": "WB-LINE-003",
        "name": "Baruipur-Diamond Harbour 220kV Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "West Bengal",
        "voltage_kv": 220,
        "length_km": 44,
        "operator": "WBSETCL",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            88.19,
            22.195
          ],
          [
            88.188,
            22.03
          ],
          [
            88.185,
            21.875
          ]
        ]
      },
      "properties": {
        "asset_id": "WB-LINE-004",
        "name": "Diamond Harbour-Kakdwip 132kV Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "West Bengal",
        "voltage_kv": 132,
        "length_km": 38,
        "operator": "WBSETCL",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            83.18,
            17.65
          ],
          [
            83.195,
            17.67
          ],
          [
            83.215,
            17.695
          ]
        ]
      },
      "properties": {
        "asset_id": "AP-LINE-001",
        "name": "Kalpaka-Gajuwaka 400kV Grid Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Andhra Pradesh",
        "voltage_kv": 400,
        "length_km": 32,
        "operator": "APTRANSCO",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            83.415,
            18.115
          ],
          [
            83.65,
            18.2
          ],
          [
            83.895,
            18.295
          ]
        ]
      },
      "properties": {
        "asset_id": "AP-LINE-002",
        "name": "Vizianagaram-Srikakulam 220kV Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Andhra Pradesh",
        "voltage_kv": 220,
        "length_km": 64,
        "operator": "APTRANSCO",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            81.785,
            17.005
          ],
          [
            82.02,
            16.98
          ],
          [
            82.255,
            16.965
          ]
        ]
      },
      "properties": {
        "asset_id": "AP-LINE-003",
        "name": "Rajahmundry-Kakinada 400kV Corridor",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Andhra Pradesh",
        "voltage_kv": 400,
        "length_km": 60,
        "operator": "APTRANSCO",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            80.32,
            13.21
          ],
          [
            80.305,
            13.17
          ],
          [
            80.29,
            13.13
          ]
        ]
      },
      "properties": {
        "asset_id": "TN-LINE-001",
        "name": "Ennore-Tondiarpet 400kV Bulk Link",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Tamil Nadu",
        "voltage_kv": 400,
        "length_km": 24,
        "operator": "TANTRANSCO",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            79.485,
            11.595
          ],
          [
            79.62,
            11.67
          ],
          [
            79.765,
            11.75
          ]
        ]
      },
      "properties": {
        "asset_id": "TN-LINE-002",
        "name": "Neyveli-Cuddalore 220kV Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Tamil Nadu",
        "voltage_kv": 220,
        "length_km": 42,
        "operator": "TANTRANSCO",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            79.765,
            11.75
          ],
          [
            79.692,
            11.398
          ],
          [
            79.8,
            11.1
          ],
          [
            79.845,
            10.765
          ]
        ]
      },
      "properties": {
        "asset_id": "TN-LINE-003",
        "name": "Cuddalore-Nagapattinam 220kV East Coast Line",
        "asset_type": "TRANSMISSION_LINE",
        "state": "Tamil Nadu",
        "voltage_kv": 220,
        "length_km": 115,
        "operator": "TANTRANSCO",
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            85.82,
            20.27
          ],
          [
            85.83,
            20.12
          ],
          [
            85.83,
            19.98
          ],
          [
            85.82,
            19.81
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-ROAD-001",
        "road_id": "NH-316-OD-01",
        "name": "NH-316 (Bhubaneswar-Pipili-Puri 4-Lane Highway)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Odisha",
        "district": "Puri",
        "districts_served": [
          "Puri",
          "Khordha"
        ],
        "length_km": 60,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            85.83,
            19.81
          ],
          [
            85.95,
            19.84
          ],
          [
            86.09,
            19.89
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-ROAD-002",
        "road_id": "SH-OD-01",
        "name": "OD-SH-60 (Puri-Konark Coastal Marine Drive)",
        "road_class": "SH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Odisha",
        "district": "Puri",
        "districts_served": [
          "Puri"
        ],
        "length_km": 36,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            85.82,
            19.81
          ],
          [
            85.68,
            19.80
          ],
          [
            85.50,
            19.72
          ],
          [
            85.35,
            19.65
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-ROAD-003",
        "road_id": "NH-203-OD-01",
        "name": "NH-203A (Puri-Brahmagiri-Satapada Chilika Arterial)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Odisha",
        "district": "Puri",
        "districts_served": [
          "Puri"
        ],
        "length_km": 50,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            86.93,
            21.49
          ],
          [
            86.78,
            21.32
          ],
          [
            86.64,
            21.18
          ],
          [
            86.51,
            21.05
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-ROAD-004",
        "road_id": "NH-16-OD-01",
        "name": "NH-16 (Balasore-Bhadrak Segment)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Odisha",
        "district": "Balasore",
        "districts_served": [
          "Balasore",
          "Bhadrak"
        ],
        "length_km": 72,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            86.51,
            21.05
          ],
          [
            86.35,
            20.85
          ],
          [
            86.15,
            20.55
          ],
          [
            85.95,
            20.35
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-ROAD-005",
        "road_id": "NH-16-OD-02",
        "name": "NH-16 (Bhadrak-Kendrapara Corridor)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Odisha",
        "district": "Kendrapara",
        "districts_served": [
          "Bhadrak",
          "Kendrapara"
        ],
        "length_km": 68,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            85.82,
            20.25
          ],
          [
            85.58,
            19.98
          ],
          [
            85.25,
            19.72
          ],
          [
            84.95,
            19.45
          ],
          [
            84.79,
            19.31
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-ROAD-006",
        "road_id": "NH-16-OD-03",
        "name": "NH-16 (Puri Coastal-Ganjam Segment)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Odisha",
        "district": "Puri",
        "districts_served": [
          "Puri",
          "Ganjam"
        ],
        "length_km": 145,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            86.64,
            20.29
          ],
          [
            86.42,
            20.31
          ],
          [
            86.17,
            20.26
          ],
          [
            85.88,
            20.3
          ]
        ]
      },
      "properties": {
        "asset_id": "OD-ROAD-007",
        "road_id": "NH-516-OD-01",
        "name": "NH-516A (Paradeep Port Express Link)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Odisha",
        "district": "Jagatsinghpur",
        "districts_served": [
          "Jagatsinghpur",
          "Kendrapara"
        ],
        "length_km": 82,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            87.87,
            22.42
          ],
          [
            87.65,
            22.25
          ],
          [
            87.42,
            22.02
          ],
          [
            87.25,
            21.85
          ]
        ]
      },
      "properties": {
        "asset_id": "WB-ROAD-001",
        "road_id": "NH-16-WB-01",
        "name": "NH-16 (Kolaghat-Dantan Corridor)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "districts_served": [
          "Purba Medinipur"
        ],
        "length_km": 94,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            87.87,
            22.42
          ],
          [
            87.94,
            22.28
          ],
          [
            88.04,
            22.14
          ],
          [
            88.08,
            22.06
          ]
        ]
      },
      "properties": {
        "asset_id": "WB-ROAD-002",
        "road_id": "NH-116-WB-01",
        "name": "NH-116 (Haldia Port Expressway)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "districts_served": [
          "Purba Medinipur"
        ],
        "length_km": 52,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            87.9,
            22.2
          ],
          [
            87.75,
            21.78
          ],
          [
            87.62,
            21.68
          ],
          [
            87.52,
            21.62
          ]
        ]
      },
      "properties": {
        "asset_id": "WB-ROAD-003",
        "road_id": "NH-116B-WB-01",
        "name": "NH-116B (Contai-Digha Coastal Highway)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "districts_served": [
          "Purba Medinipur"
        ],
        "length_km": 88,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            88.35,
            22.52
          ],
          [
            88.24,
            22.32
          ],
          [
            88.19,
            22.19
          ],
          [
            88.18,
            21.87
          ],
          [
            88.25,
            21.57
          ]
        ]
      },
      "properties": {
        "asset_id": "WB-ROAD-004",
        "road_id": "NH-12-WB-01",
        "name": "NH-12 (Diamond Harbour-Kakdwip Arterial Road)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "West Bengal",
        "district": "South 24 Parganas",
        "districts_served": [
          "South 24 Parganas"
        ],
        "length_km": 110,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            88.48,
            22.72
          ],
          [
            88.66,
            22.68
          ],
          [
            88.86,
            22.65
          ],
          [
            88.92,
            22.57
          ]
        ]
      },
      "properties": {
        "asset_id": "WB-ROAD-005",
        "road_id": "SH-03-WB-01",
        "name": "WB-SH-3 (Barasat-Basirhat-Hasnabad Link)",
        "road_class": "SH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "West Bengal",
        "district": "North 24 Parganas",
        "districts_served": [
          "North 24 Parganas"
        ],
        "length_km": 65,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            84.23,
            18.61
          ],
          [
            83.89,
            18.29
          ],
          [
            83.52,
            18.02
          ],
          [
            83.31,
            17.78
          ],
          [
            83.21,
            17.68
          ]
        ]
      },
      "properties": {
        "asset_id": "AP-ROAD-001",
        "road_id": "NH-16-AP-01",
        "name": "NH-16 (Srikakulam-Visakhapatnam Coastal Highway)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "districts_served": [
          "Srikakulam",
          "Vizianagaram",
          "Visakhapatnam"
        ],
        "length_km": 160,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            83.0,
            17.69
          ],
          [
            82.65,
            17.32
          ],
          [
            82.25,
            16.96
          ],
          [
            82.12,
            16.75
          ],
          [
            82.0,
            16.57
          ]
        ]
      },
      "properties": {
        "asset_id": "AP-ROAD-002",
        "road_id": "NH-216-AP-01",
        "name": "NH-216 (Kakinada-Amalapuram Coastal Highway)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "districts_served": [
          "Visakhapatnam",
          "East Godavari"
        ],
        "length_km": 142,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            82.66,
            18.08
          ],
          [
            82.85,
            17.88
          ],
          [
            83.0,
            17.69
          ]
        ]
      },
      "properties": {
        "asset_id": "AP-ROAD-003",
        "road_id": "NH-516E-AP-01",
        "name": "NH-516E (Ghat-Coast Arterial Corridor)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "districts_served": [
          "Visakhapatnam"
        ],
        "length_km": 78,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            80.12,
            13.4
          ],
          [
            80.22,
            13.25
          ],
          [
            80.29,
            13.13
          ],
          [
            80.27,
            13.08
          ]
        ]
      },
      "properties": {
        "asset_id": "TN-ROAD-001",
        "road_id": "NH-16-TN-01",
        "name": "NH-16 (Chennai-Ennore Trunk Highway)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "districts_served": [
          "Chennai"
        ],
        "length_km": 45,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            80.25,
            13.0
          ],
          [
            80.18,
            12.5
          ],
          [
            79.82,
            11.95
          ],
          [
            79.76,
            11.75
          ],
          [
            79.69,
            11.39
          ],
          [
            79.84,
            10.76
          ],
          [
            79.85,
            10.37
          ]
        ]
      },
      "properties": {
        "asset_id": "TN-ROAD-002",
        "road_id": "NH-32-TN-01",
        "name": "NH-32 (East Coast Road - Chennai to Nagapattinam)",
        "road_class": "NH",
        "asset_type": "ARTERIAL_ROAD",
        "state": "Tamil Nadu",
        "district": "Cuddalore",
        "districts_served": [
          "Chennai",
          "Cuddalore",
          "Nagapattinam"
        ],
        "length_km": 285,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          85.8312,
          19.8135
        ]
      },
      "properties": {
        "facility_id": "OD-HOSP-001",
        "name": "District Headquarters Hospital, Puri",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Odisha",
        "district": "Puri",
        "latitude": 19.8135,
        "longitude": 85.8312,
        "bed_capacity": 350,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 12,
        "distance_from_coast_km": 2.4,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.088,
          19.892
        ]
      },
      "properties": {
        "facility_id": "OD-SHEL-001",
        "name": "Konark Multi-Purpose Cyclone Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Odisha",
        "district": "Puri",
        "latitude": 19.892,
        "longitude": 86.088,
        "bed_capacity": null,
        "shelter_capacity": 1800,
        "has_generator": true,
        "elevation_m": 8,
        "distance_from_coast_km": 3.1,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.27,
          19.985
        ]
      },
      "properties": {
        "facility_id": "OD-PHC-001",
        "name": "Astaranga Primary Health Centre",
        "facility_type": "PHC",
        "state": "Odisha",
        "district": "Puri",
        "latitude": 19.985,
        "longitude": 86.27,
        "bed_capacity": 30,
        "shelter_capacity": null,
        "has_generator": false,
        "elevation_m": 6,
        "distance_from_coast_km": 1.8,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.645,
          20.298
        ]
      },
      "properties": {
        "facility_id": "OD-HOSP-002",
        "name": "Paradeep Port Trust Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Odisha",
        "district": "Jagatsinghpur",
        "latitude": 20.298,
        "longitude": 86.645,
        "bed_capacity": 220,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 7,
        "distance_from_coast_km": 1.5,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.48,
          20.18
        ]
      },
      "properties": {
        "facility_id": "OD-SHEL-002",
        "name": "Ersama Super Cyclone Shelter Hub",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Odisha",
        "district": "Jagatsinghpur",
        "latitude": 20.18,
        "longitude": 86.48,
        "bed_capacity": null,
        "shelter_capacity": 2000,
        "has_generator": true,
        "elevation_m": 5,
        "distance_from_coast_km": 4.2,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.421,
          20.502
        ]
      },
      "properties": {
        "facility_id": "OD-HOSP-003",
        "name": "Kendrapara District Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Odisha",
        "district": "Kendrapara",
        "latitude": 20.502,
        "longitude": 86.421,
        "bed_capacity": 280,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 9,
        "distance_from_coast_km": 28.0,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.723,
          20.582
        ]
      },
      "properties": {
        "facility_id": "OD-SHEL-003",
        "name": "Rajnagar Cyclone Evacuation Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Odisha",
        "district": "Kendrapara",
        "latitude": 20.582,
        "longitude": 86.723,
        "bed_capacity": null,
        "shelter_capacity": 1500,
        "has_generator": true,
        "elevation_m": 4,
        "distance_from_coast_km": 3.8,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.512,
          21.058
        ]
      },
      "properties": {
        "facility_id": "OD-HOSP-004",
        "name": "Bhadrak District Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Odisha",
        "district": "Bhadrak",
        "latitude": 21.058,
        "longitude": 86.512,
        "bed_capacity": 300,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 15,
        "distance_from_coast_km": 32.0,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.958,
          20.812
        ]
      },
      "properties": {
        "facility_id": "OD-SHEL-004",
        "name": "Dhamra Port Coastal Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Odisha",
        "district": "Bhadrak",
        "latitude": 20.812,
        "longitude": 86.958,
        "bed_capacity": null,
        "shelter_capacity": 1600,
        "has_generator": true,
        "elevation_m": 6,
        "distance_from_coast_km": 1.2,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          86.931,
          21.492
        ]
      },
      "properties": {
        "facility_id": "OD-MED-001",
        "name": "Fakir Mohan Medical College & Hospital",
        "facility_type": "MEDICAL_COLLEGE",
        "state": "Odisha",
        "district": "Balasore",
        "latitude": 21.492,
        "longitude": 86.931,
        "bed_capacity": 650,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 18,
        "distance_from_coast_km": 16.0,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          87.012,
          21.468
        ]
      },
      "properties": {
        "facility_id": "OD-SHEL-005",
        "name": "Chandipur Coastal Evacuation Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Odisha",
        "district": "Balasore",
        "latitude": 21.468,
        "longitude": 87.012,
        "bed_capacity": null,
        "shelter_capacity": 1200,
        "has_generator": true,
        "elevation_m": 5,
        "distance_from_coast_km": 0.8,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          84.792,
          19.311
        ]
      },
      "properties": {
        "facility_id": "OD-MED-002",
        "name": "MKCG Medical College & Hospital, Berhampur",
        "facility_type": "MEDICAL_COLLEGE",
        "state": "Odisha",
        "district": "Ganjam",
        "latitude": 19.311,
        "longitude": 84.792,
        "bed_capacity": 850,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 32,
        "distance_from_coast_km": 12.0,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          84.908,
          19.262
        ]
      },
      "properties": {
        "facility_id": "OD-SHEL-006",
        "name": "Gopalpur Port Cyclone Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Odisha",
        "district": "Ganjam",
        "latitude": 19.262,
        "longitude": 84.908,
        "bed_capacity": null,
        "shelter_capacity": 1400,
        "has_generator": true,
        "elevation_m": 7,
        "distance_from_coast_km": 0.9,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          85.012,
          19.355
        ]
      },
      "properties": {
        "facility_id": "OD-PHC-002",
        "name": "Chhatrapur Coastal PHC",
        "facility_type": "PHC",
        "state": "Odisha",
        "district": "Ganjam",
        "latitude": 19.355,
        "longitude": 85.012,
        "bed_capacity": 40,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 14,
        "distance_from_coast_km": 4.5,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.078,
          22.062
        ]
      },
      "properties": {
        "facility_id": "WB-HOSP-001",
        "name": "Haldia Sub-Divisional Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "latitude": 22.062,
        "longitude": 88.078,
        "bed_capacity": 320,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 7,
        "distance_from_coast_km": 2.1,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          87.925,
          22.298
        ]
      },
      "properties": {
        "facility_id": "WB-HOSP-002",
        "name": "Tamluk District Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "latitude": 22.298,
        "longitude": 87.925,
        "bed_capacity": 400,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 10,
        "distance_from_coast_km": 35.0,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          87.521,
          21.628
        ]
      },
      "properties": {
        "facility_id": "WB-SHEL-001",
        "name": "Digha Multi-Purpose Cyclone Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "latitude": 21.628,
        "longitude": 87.521,
        "bed_capacity": null,
        "shelter_capacity": 1800,
        "has_generator": true,
        "elevation_m": 5,
        "distance_from_coast_km": 0.5,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          87.698,
          21.668
        ]
      },
      "properties": {
        "facility_id": "WB-SHEL-002",
        "name": "Mandarmoni Coastal Disaster Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "latitude": 21.668,
        "longitude": 87.698,
        "bed_capacity": null,
        "shelter_capacity": 1200,
        "has_generator": true,
        "elevation_m": 4,
        "distance_from_coast_km": 0.3,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          87.562,
          21.682
        ]
      },
      "properties": {
        "facility_id": "WB-PHC-001",
        "name": "Ramnagar Coastal PHC",
        "facility_type": "PHC",
        "state": "West Bengal",
        "district": "Purba Medinipur",
        "latitude": 21.682,
        "longitude": 87.562,
        "bed_capacity": 35,
        "shelter_capacity": null,
        "has_generator": false,
        "elevation_m": 6,
        "distance_from_coast_km": 4.8,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.192,
          22.192
        ]
      },
      "properties": {
        "facility_id": "WB-HOSP-003",
        "name": "Diamond Harbour Super Speciality Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "West Bengal",
        "district": "South 24 Parganas",
        "latitude": 22.192,
        "longitude": 88.192,
        "bed_capacity": 450,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 8,
        "distance_from_coast_km": 1.2,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.118,
          21.652
        ]
      },
      "properties": {
        "facility_id": "WB-SHEL-003",
        "name": "Sagar Island Central Cyclone Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "West Bengal",
        "district": "South 24 Parganas",
        "latitude": 21.652,
        "longitude": 88.118,
        "bed_capacity": null,
        "shelter_capacity": 2000,
        "has_generator": true,
        "elevation_m": 3,
        "distance_from_coast_km": 0.9,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.188,
          21.878
        ]
      },
      "properties": {
        "facility_id": "WB-SHEL-004",
        "name": "Kakdwip Emergency Evacuation Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "West Bengal",
        "district": "South 24 Parganas",
        "latitude": 21.878,
        "longitude": 88.188,
        "bed_capacity": null,
        "shelter_capacity": 1500,
        "has_generator": true,
        "elevation_m": 5,
        "distance_from_coast_km": 2.5,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.805,
          22.165
        ]
      },
      "properties": {
        "facility_id": "WB-PHC-002",
        "name": "Gosaba Delta PHC",
        "facility_type": "PHC",
        "state": "West Bengal",
        "district": "South 24 Parganas",
        "latitude": 22.165,
        "longitude": 88.805,
        "bed_capacity": 45,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 3,
        "distance_from_coast_km": 3.2,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.482,
          22.722
        ]
      },
      "properties": {
        "facility_id": "WB-MED-001",
        "name": "Barasat Government Medical College & Hospital",
        "facility_type": "MEDICAL_COLLEGE",
        "state": "West Bengal",
        "district": "North 24 Parganas",
        "latitude": 22.722,
        "longitude": 88.482,
        "bed_capacity": 600,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 12,
        "distance_from_coast_km": 42.0,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.868,
          22.658
        ]
      },
      "properties": {
        "facility_id": "WB-HOSP-004",
        "name": "Basirhat District Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "West Bengal",
        "district": "North 24 Parganas",
        "latitude": 22.658,
        "longitude": 88.868,
        "bed_capacity": 300,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 9,
        "distance_from_coast_km": 30.0,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          88.985,
          22.465
        ]
      },
      "properties": {
        "facility_id": "WB-SHEL-005",
        "name": "Hingalganj Sundarbans Shelter Hub",
        "facility_type": "CYCLONE_SHELTER",
        "state": "West Bengal",
        "district": "North 24 Parganas",
        "latitude": 22.465,
        "longitude": 88.985,
        "bed_capacity": null,
        "shelter_capacity": 1400,
        "has_generator": true,
        "elevation_m": 4,
        "distance_from_coast_km": 2.8,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.892,
          18.298
        ]
      },
      "properties": {
        "facility_id": "AP-HOSP-001",
        "name": "RIMS General Hospital, Srikakulam",
        "facility_type": "MEDICAL_COLLEGE",
        "state": "Andhra Pradesh",
        "district": "Srikakulam",
        "latitude": 18.298,
        "longitude": 83.892,
        "bed_capacity": 550,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 16,
        "distance_from_coast_km": 14.0,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          84.128,
          18.338
        ]
      },
      "properties": {
        "facility_id": "AP-SHEL-001",
        "name": "Kalingapatnam Coastal Cyclone Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Andhra Pradesh",
        "district": "Srikakulam",
        "latitude": 18.338,
        "longitude": 84.128,
        "bed_capacity": null,
        "shelter_capacity": 1600,
        "has_generator": true,
        "elevation_m": 6,
        "distance_from_coast_km": 0.8,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          84.342,
          18.572
        ]
      },
      "properties": {
        "facility_id": "AP-PHC-001",
        "name": "Bhavanapadu Port PHC",
        "facility_type": "PHC",
        "state": "Andhra Pradesh",
        "district": "Srikakulam",
        "latitude": 18.572,
        "longitude": 84.342,
        "bed_capacity": 25,
        "shelter_capacity": null,
        "has_generator": false,
        "elevation_m": 5,
        "distance_from_coast_km": 1.2,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.412,
          18.118
        ]
      },
      "properties": {
        "facility_id": "AP-HOSP-002",
        "name": "Vizianagaram Government General Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Andhra Pradesh",
        "district": "Vizianagaram",
        "latitude": 18.118,
        "longitude": 83.412,
        "bed_capacity": 380,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 65,
        "distance_from_coast_km": 26.0,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.492,
          18.018
        ]
      },
      "properties": {
        "facility_id": "AP-SHEL-002",
        "name": "Bhogapuram Coastal Evacuation Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Andhra Pradesh",
        "district": "Vizianagaram",
        "latitude": 18.018,
        "longitude": 83.492,
        "bed_capacity": null,
        "shelter_capacity": 1200,
        "has_generator": true,
        "elevation_m": 18,
        "distance_from_coast_km": 4.1,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.305,
          17.708
        ]
      },
      "properties": {
        "facility_id": "AP-MED-001",
        "name": "King George Hospital (KGH) / Andhra Medical College",
        "facility_type": "MEDICAL_COLLEGE",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "latitude": 17.708,
        "longitude": 83.305,
        "bed_capacity": 1000,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 15,
        "distance_from_coast_km": 1.1,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.285,
          17.692
        ]
      },
      "properties": {
        "facility_id": "AP-HOSP-003",
        "name": "Visakhapatnam Port Authority Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "latitude": 17.692,
        "longitude": 83.285,
        "bed_capacity": 250,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 8,
        "distance_from_coast_km": 1.8,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          83.452,
          17.892
        ]
      },
      "properties": {
        "facility_id": "AP-SHEL-003",
        "name": "Bheemunipatnam Multi-Hazard Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "latitude": 17.892,
        "longitude": 83.452,
        "bed_capacity": null,
        "shelter_capacity": 1800,
        "has_generator": true,
        "elevation_m": 7,
        "distance_from_coast_km": 0.6,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          82.238,
          16.962
        ]
      },
      "properties": {
        "facility_id": "AP-MED-002",
        "name": "Rangaraya Medical College & General Hospital, Kakinada",
        "facility_type": "MEDICAL_COLLEGE",
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "latitude": 16.962,
        "longitude": 82.238,
        "bed_capacity": 750,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 6,
        "distance_from_coast_km": 2.2,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          82.008,
          16.578
        ]
      },
      "properties": {
        "facility_id": "AP-HOSP-004",
        "name": "Amalapuram Area Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "latitude": 16.578,
        "longitude": 82.008,
        "bed_capacity": 200,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 5,
        "distance_from_coast_km": 14.0,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          82.332,
          17.085
        ]
      },
      "properties": {
        "facility_id": "AP-SHEL-004",
        "name": "Uppada Beach Evacuation Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "latitude": 17.085,
        "longitude": 82.332,
        "bed_capacity": null,
        "shelter_capacity": 1500,
        "has_generator": true,
        "elevation_m": 4,
        "distance_from_coast_km": 0.2,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          81.735,
          16.325
        ]
      },
      "properties": {
        "facility_id": "AP-PHC-002",
        "name": "Antarvedi Delta PHC",
        "facility_type": "PHC",
        "state": "Andhra Pradesh",
        "district": "East Godavari",
        "latitude": 16.325,
        "longitude": 81.735,
        "bed_capacity": 30,
        "shelter_capacity": null,
        "has_generator": false,
        "elevation_m": 3,
        "distance_from_coast_km": 1.5,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          80.278,
          13.081
        ]
      },
      "properties": {
        "facility_id": "TN-MED-001",
        "name": "Rajiv Gandhi Government General Hospital (Madras Medical College)",
        "facility_type": "MEDICAL_COLLEGE",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "latitude": 13.081,
        "longitude": 80.278,
        "bed_capacity": 1000,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 8,
        "distance_from_coast_km": 1.9,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          80.285,
          13.109
        ]
      },
      "properties": {
        "facility_id": "TN-MED-002",
        "name": "Government Stanley Medical College Hospital",
        "facility_type": "MEDICAL_COLLEGE",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "latitude": 13.109,
        "longitude": 80.285,
        "bed_capacity": 800,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 6,
        "distance_from_coast_km": 1.4,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          80.272,
          13.062
        ]
      },
      "properties": {
        "facility_id": "TN-HOSP-001",
        "name": "Government Kasturba Gandhi Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "latitude": 13.062,
        "longitude": 80.272,
        "bed_capacity": 450,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 7,
        "distance_from_coast_km": 2.1,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          80.279,
          13.045
        ]
      },
      "properties": {
        "facility_id": "TN-SHEL-001",
        "name": "Marina Coastal Cyclone Relief Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "latitude": 13.045,
        "longitude": 80.279,
        "bed_capacity": null,
        "shelter_capacity": 2000,
        "has_generator": true,
        "elevation_m": 5,
        "distance_from_coast_km": 0.4,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          80.325,
          13.215
        ]
      },
      "properties": {
        "facility_id": "TN-SHEL-002",
        "name": "Ennore Port Disaster Evacuation Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "latitude": 13.215,
        "longitude": 80.325,
        "bed_capacity": null,
        "shelter_capacity": 1600,
        "has_generator": true,
        "elevation_m": 4,
        "distance_from_coast_km": 0.6,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.762,
          11.752
        ]
      },
      "properties": {
        "facility_id": "TN-HOSP-002",
        "name": "Cuddalore District Headquarters Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Tamil Nadu",
        "district": "Cuddalore",
        "latitude": 11.752,
        "longitude": 79.762,
        "bed_capacity": 420,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 9,
        "distance_from_coast_km": 2.8,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.712,
          11.392
        ]
      },
      "properties": {
        "facility_id": "TN-MED-003",
        "name": "Rajah Muthiah Medical College, Chidambaram",
        "facility_type": "MEDICAL_COLLEGE",
        "state": "Tamil Nadu",
        "district": "Cuddalore",
        "latitude": 11.392,
        "longitude": 79.712,
        "bed_capacity": 700,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 12,
        "distance_from_coast_km": 14.0,
        "criticality": "MEDIUM"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.782,
          11.705
        ]
      },
      "properties": {
        "facility_id": "TN-SHEL-003",
        "name": "Silver Beach Disaster Shelter, Cuddalore",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Tamil Nadu",
        "district": "Cuddalore",
        "latitude": 11.705,
        "longitude": 79.782,
        "bed_capacity": null,
        "shelter_capacity": 1500,
        "has_generator": true,
        "elevation_m": 4,
        "distance_from_coast_km": 0.3,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.762,
          11.495
        ]
      },
      "properties": {
        "facility_id": "TN-PHC-001",
        "name": "Parangipettai Coastal PHC",
        "facility_type": "PHC",
        "state": "Tamil Nadu",
        "district": "Cuddalore",
        "latitude": 11.495,
        "longitude": 79.762,
        "bed_capacity": 30,
        "shelter_capacity": null,
        "has_generator": false,
        "elevation_m": 5,
        "distance_from_coast_km": 1.5,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.841,
          10.762
        ]
      },
      "properties": {
        "facility_id": "TN-HOSP-003",
        "name": "Nagapattinam Government District Hospital",
        "facility_type": "DISTRICT_HOSPITAL",
        "state": "Tamil Nadu",
        "district": "Nagapattinam",
        "latitude": 10.762,
        "longitude": 79.841,
        "bed_capacity": 360,
        "shelter_capacity": null,
        "has_generator": true,
        "elevation_m": 6,
        "distance_from_coast_km": 1.1,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.845,
          10.682
        ]
      },
      "properties": {
        "facility_id": "TN-SHEL-004",
        "name": "Velankanni Pilgrim & Evacuation Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Tamil Nadu",
        "district": "Nagapattinam",
        "latitude": 10.682,
        "longitude": 79.845,
        "bed_capacity": null,
        "shelter_capacity": 2000,
        "has_generator": true,
        "elevation_m": 4,
        "distance_from_coast_km": 0.5,
        "criticality": "HIGH"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          79.852,
          10.378
        ]
      },
      "properties": {
        "facility_id": "TN-SHEL-005",
        "name": "Vedaranyam Tsunami & Cyclone Shelter",
        "facility_type": "CYCLONE_SHELTER",
        "state": "Tamil Nadu",
        "district": "Nagapattinam",
        "latitude": 10.378,
        "longitude": 79.852,
        "bed_capacity": null,
        "shelter_capacity": 1400,
        "has_generator": true,
        "elevation_m": 5,
        "distance_from_coast_km": 1.2,
        "criticality": "HIGH"
      }
    }
  ]
};
