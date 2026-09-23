import { AnticipatoryAdvisory, CycloneTrack, VulnerabilityFeatureCollection } from '../components/map/types';

// Fallback embedded data for instant client-side rendering
export const SEED_FANI_TRACK: CycloneTrack = {
  id: "BOB-02-2019",
  name: "Fani",
  season_year: 2019,
  basin: "Bay of Bengal",
  current_status: "Extremely Severe Cyclonic Storm",
  genesis_time: "2019-04-26T06:00:00Z",
  dissipation_time: "2019-05-04T18:00:00Z",
  track_points: [
    {
      timestamp: "2019-04-26T06:00:00Z",
      latitude: 2.7,
      longitude: 88.7,
      wind_speed_knots: 25,
      wind_speed_kmph: 45,
      gust_speed_kmph: 65,
      central_pressure_hpa: 1004,
      category: "Depression",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 315,
      forward_speed_kmph: 12
    },
    {
      timestamp: "2019-04-27T00:00:00Z",
      latitude: 4.3,
      longitude: 88.5,
      wind_speed_knots: 30,
      wind_speed_kmph: 55,
      gust_speed_kmph: 75,
      central_pressure_hpa: 1000,
      category: "Deep Depression",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 320,
      forward_speed_kmph: 15
    },
    {
      timestamp: "2019-04-27T12:00:00Z",
      latitude: 5.2,
      longitude: 88.2,
      wind_speed_knots: 35,
      wind_speed_kmph: 65,
      gust_speed_kmph: 85,
      central_pressure_hpa: 998,
      category: "Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 330,
      forward_speed_kmph: 14
    },
    {
      timestamp: "2019-04-29T12:00:00Z",
      latitude: 9.3,
      longitude: 86.8,
      wind_speed_knots: 50,
      wind_speed_kmph: 95,
      gust_speed_kmph: 115,
      central_pressure_hpa: 988,
      category: "Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 340,
      forward_speed_kmph: 16
    },
    {
      timestamp: "2019-04-30T12:00:00Z",
      latitude: 12.3,
      longitude: 84.8,
      wind_speed_knots: 70,
      wind_speed_kmph: 130,
      gust_speed_kmph: 150,
      central_pressure_hpa: 974,
      category: "Very Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 355,
      forward_speed_kmph: 18
    },
    {
      timestamp: "2019-05-01T12:00:00Z",
      latitude: 14.1,
      longitude: 84.1,
      wind_speed_knots: 100,
      wind_speed_kmph: 185,
      gust_speed_kmph: 210,
      central_pressure_hpa: 950,
      category: "Extremely Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 15,
      forward_speed_kmph: 14
    },
    {
      timestamp: "2019-05-02T06:00:00Z",
      latitude: 16.0,
      longitude: 84.6,
      wind_speed_knots: 115,
      wind_speed_kmph: 215,
      gust_speed_kmph: 240,
      central_pressure_hpa: 932,
      category: "Extremely Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 25,
      forward_speed_kmph: 17
    },
    {
      timestamp: "2019-05-02T18:00:00Z",
      latitude: 18.1,
      longitude: 85.3,
      wind_speed_knots: 115,
      wind_speed_kmph: 215,
      gust_speed_kmph: 240,
      central_pressure_hpa: 937,
      category: "Extremely Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 30,
      forward_speed_kmph: 19
    },
    {
      timestamp: "2019-05-03T03:00:00Z",
      latitude: 19.8,
      longitude: 85.8,
      wind_speed_knots: 110,
      wind_speed_kmph: 205,
      gust_speed_kmph: 230,
      central_pressure_hpa: 942,
      category: "Extremely Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 35,
      forward_speed_kmph: 20
    },
    {
      timestamp: "2019-05-03T09:00:00Z",
      latitude: 20.3,
      longitude: 86.1,
      wind_speed_knots: 85,
      wind_speed_kmph: 155,
      gust_speed_kmph: 180,
      central_pressure_hpa: 965,
      category: "Very Severe Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 6,
      cone_radius_km: 25,
      heading_degrees: 40,
      forward_speed_kmph: 22
    },
    {
      timestamp: "2019-05-03T18:00:00Z",
      latitude: 21.5,
      longitude: 86.9,
      wind_speed_knots: 60,
      wind_speed_kmph: 110,
      gust_speed_kmph: 130,
      central_pressure_hpa: 980,
      category: "Severe Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 15,
      cone_radius_km: 45,
      heading_degrees: 45,
      forward_speed_kmph: 25
    },
    {
      timestamp: "2019-05-04T06:00:00Z",
      latitude: 23.2,
      longitude: 88.5,
      wind_speed_knots: 40,
      wind_speed_kmph: 75,
      gust_speed_kmph: 95,
      central_pressure_hpa: 992,
      category: "Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 27,
      cone_radius_km: 70,
      heading_degrees: 50,
      forward_speed_kmph: 28
    }
  ]
};

export const SEED_AMPHAN_TRACK: CycloneTrack = {
  id: "BOB-01-2020",
  name: "Amphan",
  season_year: 2020,
  basin: "Bay of Bengal",
  current_status: "Super Cyclonic Storm",
  genesis_time: "2020-05-16T06:00:00Z",
  dissipation_time: "2020-05-21T12:00:00Z",
  track_points: [
    {
      timestamp: "2020-05-16T06:00:00Z",
      latitude: 10.4,
      longitude: 86.4,
      wind_speed_knots: 30,
      wind_speed_kmph: 55,
      gust_speed_kmph: 75,
      central_pressure_hpa: 1000,
      category: "Deep Depression",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 350,
      forward_speed_kmph: 10
    },
    {
      timestamp: "2020-05-16T18:00:00Z",
      latitude: 11.2,
      longitude: 86.2,
      wind_speed_knots: 40,
      wind_speed_kmph: 75,
      gust_speed_kmph: 95,
      central_pressure_hpa: 994,
      category: "Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 350,
      forward_speed_kmph: 11
    },
    {
      timestamp: "2020-05-17T12:00:00Z",
      latitude: 12.5,
      longitude: 86.4,
      wind_speed_knots: 60,
      wind_speed_kmph: 110,
      gust_speed_kmph: 130,
      central_pressure_hpa: 982,
      category: "Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 5,
      forward_speed_kmph: 13
    },
    {
      timestamp: "2020-05-18T00:00:00Z",
      latitude: 13.4,
      longitude: 86.4,
      wind_speed_knots: 85,
      wind_speed_kmph: 155,
      gust_speed_kmph: 180,
      central_pressure_hpa: 960,
      category: "Very Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 10,
      forward_speed_kmph: 14
    },
    {
      timestamp: "2020-05-18T12:00:00Z",
      latitude: 14.1,
      longitude: 86.4,
      wind_speed_knots: 130,
      wind_speed_kmph: 240,
      gust_speed_kmph: 265,
      central_pressure_hpa: 920,
      category: "Super Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 10,
      forward_speed_kmph: 15
    },
    {
      timestamp: "2020-05-19T06:00:00Z",
      latitude: 16.0,
      longitude: 86.7,
      wind_speed_knots: 115,
      wind_speed_kmph: 215,
      gust_speed_kmph: 240,
      central_pressure_hpa: 935,
      category: "Extremely Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 15,
      forward_speed_kmph: 17
    },
    {
      timestamp: "2020-05-20T00:00:00Z",
      latitude: 19.2,
      longitude: 87.7,
      wind_speed_knots: 95,
      wind_speed_kmph: 175,
      gust_speed_kmph: 200,
      central_pressure_hpa: 950,
      category: "Extremely Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 20,
      forward_speed_kmph: 22
    },
    {
      timestamp: "2020-05-20T10:00:00Z",
      latitude: 21.65,
      longitude: 88.3,
      wind_speed_knots: 85,
      wind_speed_kmph: 155,
      gust_speed_kmph: 185,
      central_pressure_hpa: 960,
      category: "Very Severe Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 6,
      cone_radius_km: 30,
      heading_degrees: 25,
      forward_speed_kmph: 25
    },
    {
      timestamp: "2020-05-20T18:00:00Z",
      latitude: 22.8,
      longitude: 88.6,
      wind_speed_knots: 60,
      wind_speed_kmph: 110,
      gust_speed_kmph: 130,
      central_pressure_hpa: 978,
      category: "Severe Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 14,
      cone_radius_km: 50,
      heading_degrees: 30,
      forward_speed_kmph: 27
    },
    {
      timestamp: "2020-05-21T06:00:00Z",
      latitude: 24.5,
      longitude: 89.2,
      wind_speed_knots: 35,
      wind_speed_kmph: 65,
      gust_speed_kmph: 85,
      central_pressure_hpa: 994,
      category: "Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 26,
      cone_radius_km: 75,
      heading_degrees: 35,
      forward_speed_kmph: 30
    }
  ]
};

export const SEED_SIDR_TRACK: CycloneTrack = {
  id: "BOB-04-2007",
  name: "Sidr",
  season_year: 2007,
  basin: "Bay of Bengal",
  current_status: "Very Severe Cyclonic Storm",
  genesis_time: "2007-11-11T06:00:00Z",
  dissipation_time: "2007-11-16T12:00:00Z",
  track_points: [
    {
      timestamp: "2007-11-12T00:00:00Z",
      latitude: 10.2,
      longitude: 92.5,
      wind_speed_knots: 30,
      wind_speed_kmph: 55,
      gust_speed_kmph: 75,
      central_pressure_hpa: 1000,
      category: "Deep Depression",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 330,
      forward_speed_kmph: 12
    },
    {
      timestamp: "2007-11-12T18:00:00Z",
      latitude: 11.5,
      longitude: 91.8,
      wind_speed_knots: 40,
      wind_speed_kmph: 75,
      gust_speed_kmph: 95,
      central_pressure_hpa: 994,
      category: "Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 335,
      forward_speed_kmph: 14
    },
    {
      timestamp: "2007-11-13T12:00:00Z",
      latitude: 13.4,
      longitude: 90.7,
      wind_speed_knots: 65,
      wind_speed_kmph: 120,
      gust_speed_kmph: 150,
      central_pressure_hpa: 980,
      category: "Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 340,
      forward_speed_kmph: 16
    },
    {
      timestamp: "2007-11-14T06:00:00Z",
      latitude: 15.6,
      longitude: 89.8,
      wind_speed_knots: 95,
      wind_speed_kmph: 175,
      gust_speed_kmph: 210,
      central_pressure_hpa: 960,
      category: "Very Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 345,
      forward_speed_kmph: 18
    },
    {
      timestamp: "2007-11-14T18:00:00Z",
      latitude: 17.8,
      longitude: 89.2,
      wind_speed_knots: 115,
      wind_speed_kmph: 215,
      gust_speed_kmph: 250,
      central_pressure_hpa: 944,
      category: "Extremely Severe Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 350,
      forward_speed_kmph: 22
    },
    {
      timestamp: "2007-11-15T06:00:00Z",
      latitude: 20.1,
      longitude: 89.1,
      wind_speed_knots: 140,
      wind_speed_kmph: 260,
      gust_speed_kmph: 295,
      central_pressure_hpa: 928,
      category: "Super Cyclonic Storm",
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 355,
      forward_speed_kmph: 25
    },
    {
      timestamp: "2007-11-15T12:00:00Z",
      latitude: 21.8,
      longitude: 89.5,
      wind_speed_knots: 125,
      wind_speed_kmph: 230,
      gust_speed_kmph: 270,
      central_pressure_hpa: 940,
      category: "Extremely Severe Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 6,
      cone_radius_km: 25,
      heading_degrees: 10,
      forward_speed_kmph: 28
    },
    {
      timestamp: "2007-11-15T18:00:00Z",
      latitude: 22.8,
      longitude: 90.1,
      wind_speed_knots: 90,
      wind_speed_kmph: 165,
      gust_speed_kmph: 195,
      central_pressure_hpa: 965,
      category: "Very Severe Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 12,
      cone_radius_km: 45,
      heading_degrees: 25,
      forward_speed_kmph: 30
    },
    {
      timestamp: "2007-11-16T00:00:00Z",
      latitude: 24.2,
      longitude: 91.2,
      wind_speed_knots: 55,
      wind_speed_kmph: 100,
      gust_speed_kmph: 125,
      central_pressure_hpa: 985,
      category: "Severe Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 18,
      cone_radius_km: 70,
      heading_degrees: 35,
      forward_speed_kmph: 32
    },
    {
      timestamp: "2007-11-16T06:00:00Z",
      latitude: 25.5,
      longitude: 92.4,
      wind_speed_knots: 35,
      wind_speed_kmph: 65,
      gust_speed_kmph: 85,
      central_pressure_hpa: 996,
      category: "Cyclonic Storm",
      is_forecast: true,
      forecast_lead_hours: 24,
      cone_radius_km: 95,
      heading_degrees: 40,
      forward_speed_kmph: 34
    }
  ]
};

export const SEED_ODISHA_VULNERABILITY: VulnerabilityFeatureCollection = {
  type: "FeatureCollection",
  name: "odisha_coastal_districts_vulnerability",
  features: [
    {
      type: "Feature",
      properties: {
        district_id: "OD-PUR",
        district_name: "Puri",
        state_name: "Odisha",
        total_population: 1698730,
        vulnerable_population: 420000,
        coastal_length_km: 150.4,
        average_elevation_m: 4.5,
        cyclone_risk_score: 0.94,
        storm_surge_risk_m: 4.8,
        shelter_capacity: 210000,
        shelter_count: 142,
        hospital_count: 38,
        primary_language: "Odia",
        secondary_language: "Hindi"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [85.12, 19.65],
            [85.45, 19.78],
            [85.83, 19.80],
            [86.25, 19.95],
            [86.15, 20.15],
            [85.75, 20.10],
            [85.35, 19.90],
            [85.12, 19.65]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "OD-JAG",
        district_name: "Jagatsinghpur",
        state_name: "Odisha",
        total_population: 1136971,
        vulnerable_population: 365000,
        coastal_length_km: 67.2,
        average_elevation_m: 3.8,
        cyclone_risk_score: 0.96,
        storm_surge_risk_m: 5.2,
        shelter_capacity: 185000,
        shelter_count: 118,
        hospital_count: 29,
        primary_language: "Odia",
        secondary_language: "Hindi"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [86.15, 20.00],
            [86.68, 20.18],
            [86.72, 20.35],
            [86.40, 20.40],
            [86.10, 20.25],
            [86.15, 20.00]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "OD-KEN",
        district_name: "Kendrapara",
        state_name: "Odisha",
        total_population: 1440218,
        vulnerable_population: 480000,
        coastal_length_km: 68.0,
        average_elevation_m: 3.2,
        cyclone_risk_score: 0.98,
        storm_surge_risk_m: 5.5,
        shelter_capacity: 240000,
        shelter_count: 156,
        hospital_count: 34,
        primary_language: "Odia",
        secondary_language: "Bengali"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [86.50, 20.35],
            [87.05, 20.55],
            [87.10, 20.78],
            [86.75, 20.75],
            [86.35, 20.50],
            [86.50, 20.35]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "OD-BHA",
        district_name: "Bhadrak",
        state_name: "Odisha",
        total_population: 1506522,
        vulnerable_population: 390000,
        coastal_length_km: 54.5,
        average_elevation_m: 4.1,
        cyclone_risk_score: 0.88,
        storm_surge_risk_m: 4.2,
        shelter_capacity: 170000,
        shelter_count: 105,
        hospital_count: 31,
        primary_language: "Odia",
        secondary_language: "Bengali"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [86.70, 20.75],
            [87.05, 20.82],
            [87.15, 21.05],
            [86.65, 21.15],
            [86.45, 20.90],
            [86.70, 20.75]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "OD-BAL",
        district_name: "Balasore",
        state_name: "Odisha",
        total_population: 2320529,
        vulnerable_population: 520000,
        coastal_length_km: 81.0,
        average_elevation_m: 5.0,
        cyclone_risk_score: 0.91,
        storm_surge_risk_m: 4.6,
        shelter_capacity: 260000,
        shelter_count: 164,
        hospital_count: 46,
        primary_language: "Odia",
        secondary_language: "Bengali"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [86.65, 21.15],
            [87.15, 21.05],
            [87.52, 21.55],
            [87.25, 21.80],
            [86.70, 21.60],
            [86.65, 21.15]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "OD-GAN",
        district_name: "Ganjam",
        state_name: "Odisha",
        total_population: 3529031,
        vulnerable_population: 610000,
        coastal_length_km: 60.0,
        average_elevation_m: 7.2,
        cyclone_risk_score: 0.85,
        storm_surge_risk_m: 3.8,
        shelter_capacity: 310000,
        shelter_count: 182,
        hospital_count: 62,
        primary_language: "Odia",
        secondary_language: "Telugu"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [84.60, 19.00],
            [85.05, 19.30],
            [85.25, 19.60],
            [84.95, 19.85],
            [84.45, 19.45],
            [84.60, 19.00]
          ]
        ]
      }
    }
  ]
};

export const SEED_WEST_BENGAL_VULNERABILITY: VulnerabilityFeatureCollection = {
  type: "FeatureCollection",
  name: "west_bengal_coastal_districts_vulnerability",
  features: [
    {
      type: "Feature",
      properties: {
        district_id: "WB-PMED",
        district_name: "Purba Medinipur",
        state_name: "West Bengal",
        total_population: 5100000,
        population: 5100000,
        vulnerable_population: 2150000,
        kutcha_population: 2150000,
        coastal_length_km: 65.5,
        coastline_km: 65.5,
        average_elevation_m: 3.2,
        elevation_m: 3.2,
        cyclone_risk_score: 0.82,
        vulnerability_score: 0.82,
        storm_surge_risk_m: 4.6,
        inundation_risk: 0.38,
        shelter_capacity: 182000,
        shelter_count: 182,
        evac_shelters: 182,
        hospital_count: 46,
        primary_language: "Bengali",
        secondary_language: "English"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [87.45, 21.65],
            [87.85, 21.60],
            [88.05, 21.80],
            [87.95, 22.15],
            [87.65, 22.25],
            [87.40, 21.95],
            [87.45, 21.65]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "WB-S24P",
        district_name: "South 24 Parganas",
        state_name: "West Bengal",
        total_population: 8200000,
        population: 8200000,
        vulnerable_population: 3550000,
        kutcha_population: 3550000,
        coastal_length_km: 110.0,
        coastline_km: 110.0,
        average_elevation_m: 2.8,
        elevation_m: 2.8,
        cyclone_risk_score: 0.85,
        vulnerability_score: 0.85,
        storm_surge_risk_m: 5.1,
        inundation_risk: 0.44,
        shelter_capacity: 220000,
        shelter_count: 220,
        evac_shelters: 220,
        hospital_count: 58,
        primary_language: "Bengali",
        secondary_language: "English"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [88.05, 21.60],
            [88.55, 21.55],
            [88.85, 21.75],
            [88.90, 22.10],
            [88.50, 22.35],
            [88.15, 22.20],
            [88.05, 21.60]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "WB-N24P",
        district_name: "North 24 Parganas",
        state_name: "West Bengal",
        total_population: 10000000,
        population: 10000000,
        vulnerable_population: 4100000,
        kutcha_population: 4100000,
        coastal_length_km: 45.0,
        coastline_km: 45.0,
        average_elevation_m: 4.0,
        elevation_m: 4.0,
        cyclone_risk_score: 0.76,
        vulnerability_score: 0.76,
        storm_surge_risk_m: 3.8,
        inundation_risk: 0.28,
        shelter_capacity: 198000,
        shelter_count: 198,
        evac_shelters: 198,
        hospital_count: 72,
        primary_language: "Bengali",
        secondary_language: "Hindi"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [88.40, 22.35],
            [88.90, 22.25],
            [89.05, 22.65],
            [88.80, 22.85],
            [88.45, 22.75],
            [88.35, 22.45],
            [88.40, 22.35]
          ]
        ]
      }
    }
  ]
};

export const SEED_ANDHRA_PRADESH_VULNERABILITY: VulnerabilityFeatureCollection = {
  type: "FeatureCollection",
  name: "andhra_pradesh_coastal_districts_vulnerability",
  features: [
    {
      type: "Feature",
      properties: {
        district_id: "AP-SRIK",
        district_name: "Srikakulam",
        state_name: "Andhra Pradesh",
        total_population: 2750000,
        population: 2750000,
        vulnerable_population: 1150000,
        kutcha_population: 1150000,
        coastal_length_km: 193.0,
        coastline_km: 193.0,
        average_elevation_m: 6.5,
        elevation_m: 6.5,
        cyclone_risk_score: 0.79,
        vulnerability_score: 0.79,
        storm_surge_risk_m: 3.9,
        inundation_risk: 0.32,
        shelter_capacity: 152000,
        shelter_count: 152,
        evac_shelters: 152,
        hospital_count: 34,
        primary_language: "Telugu",
        secondary_language: "Odia"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [83.80, 18.25],
            [84.40, 18.55],
            [84.75, 18.95],
            [84.60, 19.10],
            [84.10, 18.85],
            [83.75, 18.45],
            [83.80, 18.25]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "AP-VZN",
        district_name: "Vizianagaram",
        state_name: "Andhra Pradesh",
        total_population: 2350000,
        population: 2350000,
        vulnerable_population: 980000,
        kutcha_population: 980000,
        coastal_length_km: 28.0,
        coastline_km: 28.0,
        average_elevation_m: 8.0,
        elevation_m: 8.0,
        cyclone_risk_score: 0.71,
        vulnerability_score: 0.71,
        storm_surge_risk_m: 3.2,
        inundation_risk: 0.22,
        shelter_capacity: 128000,
        shelter_count: 128,
        evac_shelters: 128,
        hospital_count: 28,
        primary_language: "Telugu",
        secondary_language: "Hindi"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [83.35, 17.90],
            [83.70, 18.15],
            [83.90, 18.35],
            [83.65, 18.45],
            [83.25, 18.20],
            [83.15, 18.00],
            [83.35, 17.90]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "AP-VSP",
        district_name: "Visakhapatnam",
        state_name: "Andhra Pradesh",
        total_population: 4300000,
        population: 4300000,
        vulnerable_population: 1800000,
        kutcha_population: 1800000,
        coastal_length_km: 132.0,
        coastline_km: 132.0,
        average_elevation_m: 7.2,
        elevation_m: 7.2,
        cyclone_risk_score: 0.81,
        vulnerability_score: 0.81,
        storm_surge_risk_m: 4.4,
        inundation_risk: 0.35,
        shelter_capacity: 184000,
        shelter_count: 184,
        evac_shelters: 184,
        hospital_count: 52,
        primary_language: "Telugu",
        secondary_language: "English"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [82.60, 17.40],
            [83.10, 17.65],
            [83.45, 17.90],
            [83.30, 18.05],
            [82.85, 17.85],
            [82.50, 17.60],
            [82.60, 17.40]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "AP-EGOD",
        district_name: "East Godavari",
        state_name: "Andhra Pradesh",
        total_population: 5200000,
        population: 5200000,
        vulnerable_population: 2200000,
        kutcha_population: 2200000,
        coastal_length_km: 161.0,
        coastline_km: 161.0,
        average_elevation_m: 3.5,
        elevation_m: 3.5,
        cyclone_risk_score: 0.83,
        vulnerability_score: 0.83,
        storm_surge_risk_m: 4.7,
        inundation_risk: 0.39,
        shelter_capacity: 206000,
        shelter_count: 206,
        evac_shelters: 206,
        hospital_count: 64,
        primary_language: "Telugu",
        secondary_language: "English"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [81.60, 16.45],
            [82.15, 16.70],
            [82.45, 17.05],
            [82.35, 17.30],
            [81.90, 17.20],
            [81.55, 16.85],
            [81.60, 16.45]
          ]
        ]
      }
    }
  ]
};

export const SEED_TAMIL_NADU_VULNERABILITY: VulnerabilityFeatureCollection = {
  type: "FeatureCollection",
  name: "tamil_nadu_coastal_districts_vulnerability",
  features: [
    {
      type: "Feature",
      properties: {
        district_id: "TN-CHE",
        district_name: "Chennai",
        state_name: "Tamil Nadu",
        total_population: 8500000,
        population: 8500000,
        vulnerable_population: 3450000,
        kutcha_population: 3450000,
        coastal_length_km: 25.5,
        coastline_km: 25.5,
        average_elevation_m: 6.0,
        elevation_m: 6.0,
        cyclone_risk_score: 0.82,
        vulnerability_score: 0.82,
        storm_surge_risk_m: 4.2,
        inundation_risk: 0.34,
        shelter_capacity: 144000,
        shelter_count: 144,
        evac_shelters: 144,
        hospital_count: 86,
        primary_language: "Tamil",
        secondary_language: "English"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.12, 12.85],
            [80.32, 12.95],
            [80.35, 13.25],
            [80.20, 13.30],
            [80.05, 13.15],
            [80.08, 12.90],
            [80.12, 12.85]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "TN-CUD",
        district_name: "Cuddalore",
        state_name: "Tamil Nadu",
        total_population: 2650000,
        population: 2650000,
        vulnerable_population: 1120000,
        kutcha_population: 1120000,
        coastal_length_km: 57.5,
        coastline_km: 57.5,
        average_elevation_m: 4.2,
        elevation_m: 4.2,
        cyclone_risk_score: 0.84,
        vulnerability_score: 0.84,
        storm_surge_risk_m: 4.9,
        inundation_risk: 0.41,
        shelter_capacity: 122000,
        shelter_count: 122,
        evac_shelters: 122,
        hospital_count: 32,
        primary_language: "Tamil",
        secondary_language: "English"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.60, 11.35],
            [79.85, 11.45],
            [79.90, 11.80],
            [79.70, 11.85],
            [79.45, 11.65],
            [79.50, 11.40],
            [79.60, 11.35]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "TN-NGP",
        district_name: "Nagapattinam",
        state_name: "Tamil Nadu",
        total_population: 2450000,
        population: 2450000,
        vulnerable_population: 1020000,
        kutcha_population: 1020000,
        coastal_length_km: 187.0,
        coastline_km: 187.0,
        average_elevation_m: 3.0,
        elevation_m: 3.0,
        cyclone_risk_score: 0.80,
        vulnerability_score: 0.80,
        storm_surge_risk_m: 4.8,
        inundation_risk: 0.37,
        shelter_capacity: 94000,
        shelter_count: 94,
        evac_shelters: 94,
        hospital_count: 26,
        primary_language: "Tamil",
        secondary_language: "English"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.65, 10.45],
            [79.92, 10.60],
            [79.95, 11.15],
            [79.75, 11.20],
            [79.55, 10.85],
            [79.50, 10.55],
            [79.65, 10.45]
          ]
        ]
      }
    }
  ]
};

export const SEED_GUJARAT_VULNERABILITY: VulnerabilityFeatureCollection = {
  "type": "FeatureCollection",
  "name": "gujarat_coastal_districts_vulnerability",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "district_id": "GJ-KUT",
        "district_name": "Kutch",
        "state_name": "Gujarat",
        "total_population": 2100000,
        "population": 2100000,
        "vulnerable_population": 800000,
        "kutcha_population": 800000,
        "coastal_length_km": 405.0,
        "coastline_km": 405.0,
        "average_elevation_m": 4.2,
        "elevation_m": 4.2,
        "cyclone_risk_score": 0.72,
        "vulnerability_score": 0.72,
        "storm_surge_risk_m": 3.8,
        "inundation_risk": 0.32,
        "shelter_capacity": 16000,
        "shelter_count": 32,
        "evac_shelters": 32,
        "hospital_count": 45,
        "primary_language": "Gujarati",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              68.6,
              22.8
            ],
            [
              69.8,
              22.85
            ],
            [
              70.6,
              23.4
            ],
            [
              70.2,
              24.1
            ],
            [
              68.8,
              23.9
            ],
            [
              68.6,
              22.8
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "GJ-JAM",
        "district_name": "Jamnagar",
        "state_name": "Gujarat",
        "total_population": 2200000,
        "population": 2200000,
        "vulnerable_population": 770000,
        "kutcha_population": 770000,
        "coastal_length_km": 155.0,
        "coastline_km": 155.0,
        "average_elevation_m": 5.1,
        "elevation_m": 5.1,
        "cyclone_risk_score": 0.78,
        "vulnerability_score": 0.78,
        "storm_surge_risk_m": 4.2,
        "inundation_risk": 0.35,
        "shelter_capacity": 18000,
        "shelter_count": 36,
        "evac_shelters": 36,
        "hospital_count": 52,
        "primary_language": "Gujarati",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              69.4,
              22.2
            ],
            [
              70.4,
              22.3
            ],
            [
              70.6,
              22.8
            ],
            [
              69.8,
              22.75
            ],
            [
              69.4,
              22.2
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "GJ-POR",
        "district_name": "Porbandar",
        "state_name": "Gujarat",
        "total_population": 600000,
        "population": 600000,
        "vulnerable_population": 240000,
        "kutcha_population": 240000,
        "coastal_length_km": 105.0,
        "coastline_km": 105.0,
        "average_elevation_m": 3.8,
        "elevation_m": 3.8,
        "cyclone_risk_score": 0.75,
        "vulnerability_score": 0.75,
        "storm_surge_risk_m": 4.0,
        "inundation_risk": 0.34,
        "shelter_capacity": 7200,
        "shelter_count": 15,
        "evac_shelters": 15,
        "hospital_count": 28,
        "primary_language": "Gujarati",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              69.45,
              21.45
            ],
            [
              70.05,
              21.5
            ],
            [
              70.1,
              21.9
            ],
            [
              69.55,
              21.85
            ],
            [
              69.45,
              21.45
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "GJ-JUN",
        "district_name": "Junagadh",
        "state_name": "Gujarat",
        "total_population": 2700000,
        "population": 2700000,
        "vulnerable_population": 1130000,
        "kutcha_population": 1130000,
        "coastal_length_km": 85.0,
        "coastline_km": 85.0,
        "average_elevation_m": 6.5,
        "elevation_m": 6.5,
        "cyclone_risk_score": 0.74,
        "vulnerability_score": 0.74,
        "storm_surge_risk_m": 3.9,
        "inundation_risk": 0.3,
        "shelter_capacity": 22000,
        "shelter_count": 44,
        "evac_shelters": 44,
        "hospital_count": 58,
        "primary_language": "Gujarati",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              70.05,
              21.0
            ],
            [
              70.75,
              21.15
            ],
            [
              70.8,
              21.65
            ],
            [
              70.15,
              21.55
            ],
            [
              70.05,
              21.0
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "GJ-GIR",
        "district_name": "Gir Somnath",
        "state_name": "Gujarat",
        "total_population": 1200000,
        "population": 1200000,
        "vulnerable_population": 540000,
        "kutcha_population": 540000,
        "coastal_length_km": 120.0,
        "coastline_km": 120.0,
        "average_elevation_m": 4.5,
        "elevation_m": 4.5,
        "cyclone_risk_score": 0.77,
        "vulnerability_score": 0.77,
        "storm_surge_risk_m": 4.3,
        "inundation_risk": 0.36,
        "shelter_capacity": 12000,
        "shelter_count": 24,
        "evac_shelters": 24,
        "hospital_count": 36,
        "primary_language": "Gujarati",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              70.4,
              20.7
            ],
            [
              71.15,
              20.8
            ],
            [
              71.2,
              21.2
            ],
            [
              70.5,
              21.1
            ],
            [
              70.4,
              20.7
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "GJ-BHA",
        "district_name": "Bhavnagar",
        "state_name": "Gujarat",
        "total_population": 2900000,
        "population": 2900000,
        "vulnerable_population": 1160000,
        "kutcha_population": 1160000,
        "coastal_length_km": 152.0,
        "coastline_km": 152.0,
        "average_elevation_m": 5.0,
        "elevation_m": 5.0,
        "cyclone_risk_score": 0.76,
        "vulnerability_score": 0.76,
        "storm_surge_risk_m": 4.5,
        "inundation_risk": 0.38,
        "shelter_capacity": 24000,
        "shelter_count": 48,
        "evac_shelters": 48,
        "hospital_count": 62,
        "primary_language": "Gujarati",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              71.8,
              21.4
            ],
            [
              72.35,
              21.5
            ],
            [
              72.4,
              22.0
            ],
            [
              71.85,
              21.95
            ],
            [
              71.8,
              21.4
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "GJ-SUR",
        "district_name": "Surat",
        "state_name": "Gujarat",
        "total_population": 6100000,
        "population": 6100000,
        "vulnerable_population": 1830000,
        "kutcha_population": 1830000,
        "coastal_length_km": 83.0,
        "coastline_km": 83.0,
        "average_elevation_m": 4.0,
        "elevation_m": 4.0,
        "cyclone_risk_score": 0.82,
        "vulnerability_score": 0.82,
        "storm_surge_risk_m": 5.0,
        "inundation_risk": 0.42,
        "shelter_capacity": 48000,
        "shelter_count": 96,
        "evac_shelters": 96,
        "hospital_count": 120,
        "primary_language": "Gujarati",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              72.5,
              21.05
            ],
            [
              72.95,
              21.1
            ],
            [
              73.0,
              21.5
            ],
            [
              72.55,
              21.45
            ],
            [
              72.5,
              21.05
            ]
          ]
        ]
      }
    }
  ]
};

export const SEED_MAHARASHTRA_VULNERABILITY: VulnerabilityFeatureCollection = {
  "type": "FeatureCollection",
  "name": "maharashtra_coastal_districts_vulnerability",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "district_id": "MH-MUM",
        "district_name": "Mumbai City",
        "state_name": "Maharashtra",
        "total_population": 3100000,
        "population": 3100000,
        "vulnerable_population": 465000,
        "kutcha_population": 465000,
        "coastal_length_km": 40.0,
        "coastline_km": 40.0,
        "average_elevation_m": 8.0,
        "elevation_m": 8.0,
        "cyclone_risk_score": 0.88,
        "vulnerability_score": 0.88,
        "storm_surge_risk_m": 4.8,
        "inundation_risk": 0.45,
        "shelter_capacity": 35000,
        "shelter_count": 70,
        "evac_shelters": 70,
        "hospital_count": 140,
        "primary_language": "Marathi",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              72.8,
              18.9
            ],
            [
              72.88,
              18.92
            ],
            [
              72.86,
              19.02
            ],
            [
              72.81,
              19.0
            ],
            [
              72.8,
              18.9
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "MH-MSU",
        "district_name": "Mumbai Suburban",
        "state_name": "Maharashtra",
        "total_population": 9400000,
        "population": 9400000,
        "vulnerable_population": 1128000,
        "kutcha_population": 1128000,
        "coastal_length_km": 74.0,
        "coastline_km": 74.0,
        "average_elevation_m": 10.0,
        "elevation_m": 10.0,
        "cyclone_risk_score": 0.85,
        "vulnerability_score": 0.85,
        "storm_surge_risk_m": 4.5,
        "inundation_risk": 0.4,
        "shelter_capacity": 85000,
        "shelter_count": 170,
        "evac_shelters": 170,
        "hospital_count": 210,
        "primary_language": "Marathi",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              72.78,
              19.02
            ],
            [
              72.95,
              19.05
            ],
            [
              72.92,
              19.28
            ],
            [
              72.8,
              19.25
            ],
            [
              72.78,
              19.02
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "MH-THA",
        "district_name": "Thane",
        "state_name": "Maharashtra",
        "total_population": 11100000,
        "population": 11100000,
        "vulnerable_population": 2775000,
        "kutcha_population": 2775000,
        "coastal_length_km": 50.0,
        "coastline_km": 50.0,
        "average_elevation_m": 12.0,
        "elevation_m": 12.0,
        "cyclone_risk_score": 0.79,
        "vulnerability_score": 0.79,
        "storm_surge_risk_m": 4.2,
        "inundation_risk": 0.35,
        "shelter_capacity": 92000,
        "shelter_count": 184,
        "evac_shelters": 184,
        "hospital_count": 190,
        "primary_language": "Marathi",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              72.9,
              19.15
            ],
            [
              73.2,
              19.2
            ],
            [
              73.15,
              19.45
            ],
            [
              72.92,
              19.4
            ],
            [
              72.9,
              19.15
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "MH-PAL",
        "district_name": "Palghar",
        "state_name": "Maharashtra",
        "total_population": 3000000,
        "population": 3000000,
        "vulnerable_population": 1440000,
        "kutcha_population": 1440000,
        "coastal_length_km": 112.0,
        "coastline_km": 112.0,
        "average_elevation_m": 5.5,
        "elevation_m": 5.5,
        "cyclone_risk_score": 0.81,
        "vulnerability_score": 0.81,
        "storm_surge_risk_m": 4.6,
        "inundation_risk": 0.38,
        "shelter_capacity": 28000,
        "shelter_count": 56,
        "evac_shelters": 56,
        "hospital_count": 65,
        "primary_language": "Marathi",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              72.65,
              19.45
            ],
            [
              73.0,
              19.5
            ],
            [
              72.95,
              20.1
            ],
            [
              72.7,
              20.05
            ],
            [
              72.65,
              19.45
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "MH-RAI",
        "district_name": "Raigad",
        "state_name": "Maharashtra",
        "total_population": 2600000,
        "population": 2600000,
        "vulnerable_population": 1300000,
        "kutcha_population": 1300000,
        "coastal_length_km": 240.0,
        "coastline_km": 240.0,
        "average_elevation_m": 6.0,
        "elevation_m": 6.0,
        "cyclone_risk_score": 0.8,
        "vulnerability_score": 0.8,
        "storm_surge_risk_m": 4.4,
        "inundation_risk": 0.37,
        "shelter_capacity": 25000,
        "shelter_count": 50,
        "evac_shelters": 50,
        "hospital_count": 58,
        "primary_language": "Marathi",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              72.85,
              18.0
            ],
            [
              73.3,
              18.1
            ],
            [
              73.25,
              18.9
            ],
            [
              72.88,
              18.85
            ],
            [
              72.85,
              18.0
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "MH-RAT",
        "district_name": "Ratnagiri",
        "state_name": "Maharashtra",
        "total_population": 1600000,
        "population": 1600000,
        "vulnerable_population": 880000,
        "kutcha_population": 880000,
        "coastal_length_km": 167.0,
        "coastline_km": 167.0,
        "average_elevation_m": 7.0,
        "elevation_m": 7.0,
        "cyclone_risk_score": 0.78,
        "vulnerability_score": 0.78,
        "storm_surge_risk_m": 4.0,
        "inundation_risk": 0.33,
        "shelter_capacity": 16000,
        "shelter_count": 32,
        "evac_shelters": 32,
        "hospital_count": 48,
        "primary_language": "Marathi",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              73.15,
              16.8
            ],
            [
              73.6,
              16.9
            ],
            [
              73.55,
              17.9
            ],
            [
              73.2,
              17.85
            ],
            [
              73.15,
              16.8
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "MH-SIN",
        "district_name": "Sindhudurg",
        "state_name": "Maharashtra",
        "total_population": 850000,
        "population": 850000,
        "vulnerable_population": 442000,
        "kutcha_population": 442000,
        "coastal_length_km": 121.0,
        "coastline_km": 121.0,
        "average_elevation_m": 8.5,
        "elevation_m": 8.5,
        "cyclone_risk_score": 0.76,
        "vulnerability_score": 0.76,
        "storm_surge_risk_m": 3.8,
        "inundation_risk": 0.3,
        "shelter_capacity": 9000,
        "shelter_count": 18,
        "evac_shelters": 18,
        "hospital_count": 34,
        "primary_language": "Marathi",
        "secondary_language": "Konkani"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              73.4,
              15.75
            ],
            [
              73.85,
              15.85
            ],
            [
              73.8,
              16.75
            ],
            [
              73.45,
              16.7
            ],
            [
              73.4,
              15.75
            ]
          ]
        ]
      }
    }
  ]
};

export const SEED_GOA_VULNERABILITY: VulnerabilityFeatureCollection = {
  "type": "FeatureCollection",
  "name": "goa_coastal_districts_vulnerability",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "district_id": "GA-NGO",
        "district_name": "North Goa",
        "state_name": "Goa",
        "total_population": 820000,
        "population": 820000,
        "vulnerable_population": 180400,
        "kutcha_population": 180400,
        "coastal_length_km": 55.0,
        "coastline_km": 55.0,
        "average_elevation_m": 10.0,
        "elevation_m": 10.0,
        "cyclone_risk_score": 0.7,
        "vulnerability_score": 0.7,
        "storm_surge_risk_m": 3.5,
        "inundation_risk": 0.25,
        "shelter_capacity": 8000,
        "shelter_count": 16,
        "evac_shelters": 16,
        "hospital_count": 32,
        "primary_language": "Konkani",
        "secondary_language": "Marathi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              73.65,
              15.45
            ],
            [
              74.05,
              15.48
            ],
            [
              74.0,
              15.8
            ],
            [
              73.7,
              15.78
            ],
            [
              73.65,
              15.45
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "GA-SGO",
        "district_name": "South Goa",
        "state_name": "Goa",
        "total_population": 640000,
        "population": 640000,
        "vulnerable_population": 153600,
        "kutcha_population": 153600,
        "coastal_length_km": 50.0,
        "coastline_km": 50.0,
        "average_elevation_m": 12.0,
        "elevation_m": 12.0,
        "cyclone_risk_score": 0.68,
        "vulnerability_score": 0.68,
        "storm_surge_risk_m": 3.2,
        "inundation_risk": 0.22,
        "shelter_capacity": 6500,
        "shelter_count": 13,
        "evac_shelters": 13,
        "hospital_count": 28,
        "primary_language": "Konkani",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              73.8,
              14.9
            ],
            [
              74.15,
              14.95
            ],
            [
              74.1,
              15.45
            ],
            [
              73.85,
              15.42
            ],
            [
              73.8,
              14.9
            ]
          ]
        ]
      }
    }
  ]
};

export const SEED_KARNATAKA_VULNERABILITY: VulnerabilityFeatureCollection = {
  "type": "FeatureCollection",
  "name": "karnataka_coastal_districts_vulnerability",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "district_id": "KA-DKA",
        "district_name": "Dakshina Kannada",
        "state_name": "Karnataka",
        "total_population": 2100000,
        "population": 2100000,
        "vulnerable_population": 630000,
        "kutcha_population": 630000,
        "coastal_length_km": 42.0,
        "coastline_km": 42.0,
        "average_elevation_m": 14.0,
        "elevation_m": 14.0,
        "cyclone_risk_score": 0.73,
        "vulnerability_score": 0.73,
        "storm_surge_risk_m": 3.6,
        "inundation_risk": 0.28,
        "shelter_capacity": 22000,
        "shelter_count": 44,
        "evac_shelters": 44,
        "hospital_count": 75,
        "primary_language": "Kannada",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              74.8,
              12.6
            ],
            [
              75.35,
              12.65
            ],
            [
              75.3,
              13.15
            ],
            [
              74.85,
              13.1
            ],
            [
              74.8,
              12.6
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KA-UDU",
        "district_name": "Udupi",
        "state_name": "Karnataka",
        "total_population": 1200000,
        "population": 1200000,
        "vulnerable_population": 384000,
        "kutcha_population": 384000,
        "coastal_length_km": 98.0,
        "coastline_km": 98.0,
        "average_elevation_m": 12.0,
        "elevation_m": 12.0,
        "cyclone_risk_score": 0.71,
        "vulnerability_score": 0.71,
        "storm_surge_risk_m": 3.5,
        "inundation_risk": 0.26,
        "shelter_capacity": 14000,
        "shelter_count": 28,
        "evac_shelters": 28,
        "hospital_count": 45,
        "primary_language": "Kannada",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              74.65,
              13.15
            ],
            [
              75.1,
              13.2
            ],
            [
              75.05,
              13.9
            ],
            [
              74.7,
              13.85
            ],
            [
              74.65,
              13.15
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KA-UKA",
        "district_name": "Uttara Kannada",
        "state_name": "Karnataka",
        "total_population": 1400000,
        "population": 1400000,
        "vulnerable_population": 588000,
        "kutcha_population": 588000,
        "coastal_length_km": 160.0,
        "coastline_km": 160.0,
        "average_elevation_m": 8.0,
        "elevation_m": 8.0,
        "cyclone_risk_score": 0.75,
        "vulnerability_score": 0.75,
        "storm_surge_risk_m": 3.9,
        "inundation_risk": 0.3,
        "shelter_capacity": 16000,
        "shelter_count": 32,
        "evac_shelters": 32,
        "hospital_count": 50,
        "primary_language": "Kannada",
        "secondary_language": "Konkani"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              74.1,
              13.9
            ],
            [
              74.85,
              13.95
            ],
            [
              74.8,
              15.0
            ],
            [
              74.15,
              14.95
            ],
            [
              74.1,
              13.9
            ]
          ]
        ]
      }
    }
  ]
};

export const SEED_KERALA_VULNERABILITY: VulnerabilityFeatureCollection = {
  "type": "FeatureCollection",
  "name": "kerala_coastal_districts_vulnerability",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "district_id": "KL-KAS",
        "district_name": "Kasaragod",
        "state_name": "Kerala",
        "total_population": 1300000,
        "population": 1300000,
        "vulnerable_population": 325000,
        "kutcha_population": 325000,
        "coastal_length_km": 70.0,
        "coastline_km": 70.0,
        "average_elevation_m": 8.0,
        "elevation_m": 8.0,
        "cyclone_risk_score": 0.74,
        "vulnerability_score": 0.74,
        "storm_surge_risk_m": 3.5,
        "inundation_risk": 0.27,
        "shelter_capacity": 14000,
        "shelter_count": 28,
        "evac_shelters": 28,
        "hospital_count": 42,
        "primary_language": "Malayalam",
        "secondary_language": "Kannada"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              74.9,
              12.1
            ],
            [
              75.3,
              12.15
            ],
            [
              75.25,
              12.8
            ],
            [
              74.95,
              12.75
            ],
            [
              74.9,
              12.1
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KL-KAN",
        "district_name": "Kannur",
        "state_name": "Kerala",
        "total_population": 2500000,
        "population": 2500000,
        "vulnerable_population": 700000,
        "kutcha_population": 700000,
        "coastal_length_km": 82.0,
        "coastline_km": 82.0,
        "average_elevation_m": 9.0,
        "elevation_m": 9.0,
        "cyclone_risk_score": 0.75,
        "vulnerability_score": 0.75,
        "storm_surge_risk_m": 3.6,
        "inundation_risk": 0.28,
        "shelter_capacity": 26000,
        "shelter_count": 52,
        "evac_shelters": 52,
        "hospital_count": 68,
        "primary_language": "Malayalam",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              75.25,
              11.7
            ],
            [
              75.7,
              11.75
            ],
            [
              75.65,
              12.2
            ],
            [
              75.3,
              12.15
            ],
            [
              75.25,
              11.7
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KL-KOZ",
        "district_name": "Kozhikode",
        "state_name": "Kerala",
        "total_population": 3100000,
        "population": 3100000,
        "vulnerable_population": 930000,
        "kutcha_population": 930000,
        "coastal_length_km": 71.0,
        "coastline_km": 71.0,
        "average_elevation_m": 6.5,
        "elevation_m": 6.5,
        "cyclone_risk_score": 0.78,
        "vulnerability_score": 0.78,
        "storm_surge_risk_m": 4.0,
        "inundation_risk": 0.32,
        "shelter_capacity": 32000,
        "shelter_count": 64,
        "evac_shelters": 64,
        "hospital_count": 85,
        "primary_language": "Malayalam",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              75.65,
              11.2
            ],
            [
              76.1,
              11.25
            ],
            [
              76.05,
              11.75
            ],
            [
              75.7,
              11.7
            ],
            [
              75.65,
              11.2
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KL-MAL",
        "district_name": "Malappuram",
        "state_name": "Kerala",
        "total_population": 4100000,
        "population": 4100000,
        "vulnerable_population": 1312000,
        "kutcha_population": 1312000,
        "coastal_length_km": 70.0,
        "coastline_km": 70.0,
        "average_elevation_m": 7.0,
        "elevation_m": 7.0,
        "cyclone_risk_score": 0.76,
        "vulnerability_score": 0.76,
        "storm_surge_risk_m": 3.8,
        "inundation_risk": 0.3,
        "shelter_capacity": 38000,
        "shelter_count": 76,
        "evac_shelters": 76,
        "hospital_count": 90,
        "primary_language": "Malayalam",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              75.8,
              10.7
            ],
            [
              76.35,
              10.75
            ],
            [
              76.3,
              11.25
            ],
            [
              75.85,
              11.2
            ],
            [
              75.8,
              10.7
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KL-THR",
        "district_name": "Thrissur",
        "state_name": "Kerala",
        "total_population": 3100000,
        "population": 3100000,
        "vulnerable_population": 868000,
        "kutcha_population": 868000,
        "coastal_length_km": 54.0,
        "coastline_km": 54.0,
        "average_elevation_m": 5.5,
        "elevation_m": 5.5,
        "cyclone_risk_score": 0.79,
        "vulnerability_score": 0.79,
        "storm_surge_risk_m": 4.1,
        "inundation_risk": 0.33,
        "shelter_capacity": 30000,
        "shelter_count": 60,
        "evac_shelters": 60,
        "hospital_count": 82,
        "primary_language": "Malayalam",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              75.95,
              10.2
            ],
            [
              76.45,
              10.25
            ],
            [
              76.4,
              10.75
            ],
            [
              76.0,
              10.7
            ],
            [
              75.95,
              10.2
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KL-ERN",
        "district_name": "Ernakulam",
        "state_name": "Kerala",
        "total_population": 3300000,
        "population": 3300000,
        "vulnerable_population": 726000,
        "kutcha_population": 726000,
        "coastal_length_km": 46.0,
        "coastline_km": 46.0,
        "average_elevation_m": 3.5,
        "elevation_m": 3.5,
        "cyclone_risk_score": 0.82,
        "vulnerability_score": 0.82,
        "storm_surge_risk_m": 4.8,
        "inundation_risk": 0.4,
        "shelter_capacity": 36000,
        "shelter_count": 72,
        "evac_shelters": 72,
        "hospital_count": 110,
        "primary_language": "Malayalam",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              76.15,
              9.8
            ],
            [
              76.6,
              9.85
            ],
            [
              76.55,
              10.25
            ],
            [
              76.2,
              10.2
            ],
            [
              76.15,
              9.8
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KL-ALA",
        "district_name": "Alappuzha",
        "state_name": "Kerala",
        "total_population": 2100000,
        "population": 2100000,
        "vulnerable_population": 735000,
        "kutcha_population": 735000,
        "coastal_length_km": 82.0,
        "coastline_km": 82.0,
        "average_elevation_m": 1.8,
        "elevation_m": 1.8,
        "cyclone_risk_score": 0.84,
        "vulnerability_score": 0.84,
        "storm_surge_risk_m": 5.2,
        "inundation_risk": 0.48,
        "shelter_capacity": 28000,
        "shelter_count": 56,
        "evac_shelters": 56,
        "hospital_count": 65,
        "primary_language": "Malayalam",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              76.25,
              9.15
            ],
            [
              76.65,
              9.2
            ],
            [
              76.6,
              9.85
            ],
            [
              76.3,
              9.8
            ],
            [
              76.25,
              9.15
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KL-KOL",
        "district_name": "Kollam",
        "state_name": "Kerala",
        "total_population": 2600000,
        "population": 2600000,
        "vulnerable_population": 780000,
        "kutcha_population": 780000,
        "coastal_length_km": 37.0,
        "coastline_km": 37.0,
        "average_elevation_m": 4.5,
        "elevation_m": 4.5,
        "cyclone_risk_score": 0.81,
        "vulnerability_score": 0.81,
        "storm_surge_risk_m": 4.3,
        "inundation_risk": 0.36,
        "shelter_capacity": 27000,
        "shelter_count": 54,
        "evac_shelters": 54,
        "hospital_count": 72,
        "primary_language": "Malayalam",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              76.5,
              8.8
            ],
            [
              77.0,
              8.85
            ],
            [
              76.95,
              9.25
            ],
            [
              76.55,
              9.2
            ],
            [
              76.5,
              8.8
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "KL-TVM",
        "district_name": "Thiruvananthapuram",
        "state_name": "Kerala",
        "total_population": 3300000,
        "population": 3300000,
        "vulnerable_population": 825000,
        "kutcha_population": 825000,
        "coastal_length_km": 78.0,
        "coastline_km": 78.0,
        "average_elevation_m": 6.0,
        "elevation_m": 6.0,
        "cyclone_risk_score": 0.8,
        "vulnerability_score": 0.8,
        "storm_surge_risk_m": 4.2,
        "inundation_risk": 0.34,
        "shelter_capacity": 34000,
        "shelter_count": 68,
        "evac_shelters": 68,
        "hospital_count": 98,
        "primary_language": "Malayalam",
        "secondary_language": "Tamil"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              76.8,
              8.25
            ],
            [
              77.25,
              8.3
            ],
            [
              77.2,
              8.85
            ],
            [
              76.85,
              8.8
            ],
            [
              76.8,
              8.25
            ]
          ]
        ]
      }
    }
  ]
};

export const SEED_UT_VULNERABILITY: VulnerabilityFeatureCollection = {
  "type": "FeatureCollection",
  "name": "union_territories_coastal_vulnerability",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "district_id": "UT-PUD",
        "district_name": "Puducherry",
        "state_name": "Union Territories",
        "total_population": 950000,
        "population": 950000,
        "vulnerable_population": 237500,
        "kutcha_population": 237500,
        "coastal_length_km": 45.0,
        "coastline_km": 45.0,
        "average_elevation_m": 3.5,
        "elevation_m": 3.5,
        "cyclone_risk_score": 0.72,
        "vulnerability_score": 0.72,
        "storm_surge_risk_m": 3.8,
        "inundation_risk": 0.28,
        "shelter_capacity": 11000,
        "shelter_count": 22,
        "evac_shelters": 22,
        "hospital_count": 36,
        "primary_language": "Tamil",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.75,
              11.85
            ],
            [
              80.0,
              11.88
            ],
            [
              79.95,
              12.05
            ],
            [
              79.78,
              12.02
            ],
            [
              79.75,
              11.85
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "UT-LAK",
        "district_name": "Lakshadweep",
        "state_name": "Union Territories",
        "total_population": 65000,
        "population": 65000,
        "vulnerable_population": 26000,
        "kutcha_population": 26000,
        "coastal_length_km": 132.0,
        "coastline_km": 132.0,
        "average_elevation_m": 1.5,
        "elevation_m": 1.5,
        "cyclone_risk_score": 0.85,
        "vulnerability_score": 0.85,
        "storm_surge_risk_m": 5.0,
        "inundation_risk": 0.45,
        "shelter_capacity": 3500,
        "shelter_count": 8,
        "evac_shelters": 8,
        "hospital_count": 12,
        "primary_language": "Malayalam",
        "secondary_language": "English"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              72.1,
              10.0
            ],
            [
              73.8,
              10.05
            ],
            [
              73.75,
              11.8
            ],
            [
              72.15,
              11.75
            ],
            [
              72.1,
              10.0
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "UT-ANI",
        "district_name": "Andaman & Nicobar Islands",
        "state_name": "Union Territories",
        "total_population": 380000,
        "population": 380000,
        "vulnerable_population": 152000,
        "kutcha_population": 152000,
        "coastal_length_km": 1962.0,
        "coastline_km": 1962.0,
        "average_elevation_m": 5.0,
        "elevation_m": 5.0,
        "cyclone_risk_score": 0.88,
        "vulnerability_score": 0.88,
        "storm_surge_risk_m": 5.2,
        "inundation_risk": 0.48,
        "shelter_capacity": 15000,
        "shelter_count": 30,
        "evac_shelters": 30,
        "hospital_count": 28,
        "primary_language": "Hindi",
        "secondary_language": "Bengali"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              92.5,
              11.0
            ],
            [
              93.5,
              11.05
            ],
            [
              93.45,
              13.0
            ],
            [
              92.55,
              12.95
            ],
            [
              92.5,
              11.0
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district_id": "UT-DND",
        "district_name": "Daman & Diu",
        "state_name": "Union Territories",
        "total_population": 240000,
        "population": 240000,
        "vulnerable_population": 72000,
        "kutcha_population": 72000,
        "coastal_length_km": 42.0,
        "coastline_km": 42.0,
        "average_elevation_m": 4.0,
        "elevation_m": 4.0,
        "cyclone_risk_score": 0.75,
        "vulnerability_score": 0.75,
        "storm_surge_risk_m": 4.0,
        "inundation_risk": 0.3,
        "shelter_capacity": 4800,
        "shelter_count": 10,
        "evac_shelters": 10,
        "hospital_count": 16,
        "primary_language": "Gujarati",
        "secondary_language": "Hindi"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              72.8,
              20.35
            ],
            [
              72.95,
              20.38
            ],
            [
              72.92,
              20.5
            ],
            [
              72.82,
              20.48
            ],
            [
              72.8,
              20.35
            ]
          ]
        ]
      }
    }
  ]
};

export const SEED_ALL_COASTAL_VULNERABILITY: VulnerabilityFeatureCollection = {
  type: "FeatureCollection",
  name: "india_coastal_districts_vulnerability",
  features: [
    ...SEED_ODISHA_VULNERABILITY.features,
    ...SEED_WEST_BENGAL_VULNERABILITY.features,
    ...SEED_ANDHRA_PRADESH_VULNERABILITY.features,
    ...SEED_TAMIL_NADU_VULNERABILITY.features,
    ...SEED_GUJARAT_VULNERABILITY.features,
    ...SEED_MAHARASHTRA_VULNERABILITY.features,
    ...SEED_GOA_VULNERABILITY.features,
    ...SEED_KARNATAKA_VULNERABILITY.features,
    ...SEED_KERALA_VULNERABILITY.features,
    ...SEED_UT_VULNERABILITY.features,
  ]
};

export const SEED_ALL_VULNERABILITY = SEED_ALL_COASTAL_VULNERABILITY;

export const SEED_BANGLADESH_VULNERABILITY: VulnerabilityFeatureCollection = {
  type: "FeatureCollection",
  name: "bangladesh_coastal_districts_vulnerability",
  features: [
    {
      type: "Feature",
      properties: {
        district_id: "BD-COX",
        district_name: "Cox's Bazar",
        state_name: "Chittagong",
        country: "Bangladesh",
        total_population: 2890000,
        vulnerable_population: 1445000,
        coastal_length_km: 120.5,
        average_elevation_m: 3.2,
        cyclone_risk_score: 0.92,
        storm_surge_risk_m: 5.8,
        shelter_capacity: 420000,
        shelter_count: 580,
        hospital_count: 42,
        primary_language: "Bengali",
        secondary_language: "English",
        population: 2890000,
        kutcha_population: 1445000,
        coastline_km: 120.5,
        elevation_m: 3.2,
        vulnerability_score: 0.92,
        inundation_risk: 5.8,
        evac_shelters: 580
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.95, 21.35],
            [92.15, 21.20],
            [92.35, 21.40],
            [92.20, 21.75],
            [92.00, 21.65],
            [91.95, 21.35]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "BD-CHG",
        district_name: "Chittagong",
        state_name: "Chittagong",
        country: "Bangladesh",
        total_population: 9160000,
        vulnerable_population: 4580000,
        coastal_length_km: 85.0,
        average_elevation_m: 4.8,
        cyclone_risk_score: 0.88,
        storm_surge_risk_m: 5.2,
        shelter_capacity: 1250000,
        shelter_count: 820,
        hospital_count: 110,
        primary_language: "Bengali",
        secondary_language: "English",
        population: 9160000,
        kutcha_population: 4580000,
        coastline_km: 85.0,
        elevation_m: 4.8,
        vulnerability_score: 0.88,
        inundation_risk: 5.2,
        evac_shelters: 820
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [91.75, 22.15],
            [92.05, 22.10],
            [92.15, 22.50],
            [91.85, 22.65],
            [91.65, 22.45],
            [91.75, 22.15]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "BD-BHO",
        district_name: "Bhola",
        state_name: "Khulna",
        country: "Bangladesh",
        total_population: 1930000,
        vulnerable_population: 1020000,
        coastal_length_km: 145.0,
        average_elevation_m: 2.1,
        cyclone_risk_score: 0.91,
        storm_surge_risk_m: 6.2,
        shelter_capacity: 310000,
        shelter_count: 360,
        hospital_count: 28,
        primary_language: "Bengali",
        secondary_language: "English",
        population: 1930000,
        kutcha_population: 1020000,
        coastline_km: 145.0,
        elevation_m: 2.1,
        vulnerability_score: 0.91,
        inundation_risk: 6.2,
        evac_shelters: 360
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [90.55, 22.05],
            [90.85, 22.10],
            [90.80, 22.75],
            [90.50, 22.65],
            [90.55, 22.05]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        district_id: "BD-KHU",
        district_name: "Khulna",
        state_name: "Khulna",
        country: "Bangladesh",
        total_population: 2610000,
        vulnerable_population: 1305000,
        coastal_length_km: 95.0,
        average_elevation_m: 3.5,
        cyclone_risk_score: 0.85,
        storm_surge_risk_m: 5.0,
        shelter_capacity: 390000,
        shelter_count: 420,
        hospital_count: 52,
        primary_language: "Bengali",
        secondary_language: "English",
        population: 2610000,
        kutcha_population: 1305000,
        coastline_km: 95.0,
        elevation_m: 3.5,
        vulnerability_score: 0.85,
        inundation_risk: 5.0,
        evac_shelters: 420
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [89.30, 22.20],
            [89.70, 22.25],
            [89.75, 22.85],
            [89.35, 22.80],
            [89.30, 22.20]
          ]
        ]
      }
    }
  ]
};

export const SEED_MULTILINGUAL_ADVISORIES: Record<string, {
  headline: Record<string, string>;
  message: Record<string, string>;
  action: Record<string, string>;
}> = {
  EMERGENCY: {
    headline: {
      en: "URGENT PRE-LANDFALL EVACUATION ADVISORY",
      english: "URGENT PRE-LANDFALL EVACUATION ADVISORY",
      or: "ଜରୁରୀକାଳୀନ ଭୂଭାଗ-ସ୍ପର୍ଶ ପୂର୍ବ ସ୍ଥାନାନ୍ତରଣ ପରାମର୍ଶ",
      odia: "ଜରୁରୀକାଳୀନ ଭୂଭାଗ-ସ୍ପର୍ଶ ପୂର୍ବ ସ୍ଥାନାନ୍ତରଣ ପରାମର୍ଶ",
      bn: "জরুরী ল্যান্ডফল-পূর্ব স্থানান্তর পরামর্শ",
      bengali: "জরুরী ল্যান্ডফল-পূর্ব স্থানান্তর পরামর্শ",
      hi: "अति आवश्यक भूस्खलन-पूर्व निकासी परामर्श",
      hindi: "अति आवश्यक भूस्खलन-पूर्व निकासी परामर्श",
      te: "అత్యవసర భూతాకిడి-ముందస్తు తరలింపు సలహా",
      telugu: "అత్యవసర భూతాకిడి-ముందస్తు తరలింపు సలహా",
      ta: "அவசர புயல்-கரை கடக்கும் முன் வெளியேற்ற ஆலோசனை",
      tamil: "அவசர புயல்-கரை கடக்கும் முன் வெளியேற்ற ஆலோசனை"
    },
    message: {
      en: "Extremely Severe Cyclone tracking toward Odisha coast. Wind gusts exceeding 215 km/h. Expected storm surge 4.5m - 5.5m in Kendrapara and Jagatsinghpur. Complete evacuation of kutcha settlements within 12 hours.",
      english: "Extremely Severe Cyclone tracking toward Odisha coast. Wind gusts exceeding 215 km/h. Expected storm surge 4.5m - 5.5m in Kendrapara and Jagatsinghpur. Complete evacuation of kutcha settlements within 12 hours.",
      or: "ଅତ୍ୟନ୍ତ ଭୟଙ୍କର ବାତ୍ୟା ଓଡ଼ିଶା ଉପକୂଳ ମୁହାଁ। ପବନର ବେଗ ୨୧୫ କିମି/ଘଣ୍ଟା ଅତିକ୍ରମ କରିବ। କେନ୍ଦ୍ରାପଡ଼ା ଏବଂ ଜଗତସିଂହପୁରରେ ୪.୫ ରୁ ୫.୫ ମିଟର ଉଚ୍ଚ ଜୁଆର ଆଶଙ୍କା। ଆଗାମୀ ୧୨ ଘଣ୍ଟା ମଧ୍ୟରେ କଚ୍ଚା ଘରୁ ଲୋକଙ୍କୁ ଆଶ୍ରୟସ୍ଥଳକୁ ସ୍ଥାନାନ୍ତର କରନ୍ତୁ।",
      odia: "ଅତ୍ୟନ୍ତ ଭୟଙ୍କର ବାତ୍ୟା ଓଡ଼ିଶା ଉପକୂଳ ମୁହାଁ। ପବନର ବେଗ ୨୧୫ କିମି/ଘଣ୍ଟା ଅତିକ୍ରମ କରିବ। କେନ୍ଦ୍ରାପଡ଼ା ଏବଂ ଜଗତସିଂହପୁରରେ ୪.୫ ରୁ ୫.୫ ମିଟର ଉଚ୍ଚ ଜୁଆର ଆଶଙ୍କା। ଆଗାମୀ ୧୨ ଘଣ୍ଟା ମଧ୍ୟରେ କଚ୍ଚା ଘରୁ ଲୋକଙ୍କୁ ଆଶ୍ରୟସ୍ଥଳକୁ ସ୍ଥାନାନ୍ତର କରନ୍ତୁ।",
      bn: "অতি তীব্র ঘূর্ণিঝড় ওড়িশা উপকূলের দিকে অগ্রসর হচ্ছে। বাতাসের গতিবেগ ঘণ্টায় ২১৫ কিমি ছাড়িয়ে যেতে পারে। কেন্দ্রাপাড়া ও জগৎসিংহপুরে ৪.৫ থেকে ৫.৫ মিটার জলোচ্ছ্বাসের আশঙ্কা। ১২ ঘণ্টার মধ্যে সকল কাঁচা বাড়ি থেকে মানুষকে নিরাপদ আশ্রয়ে সরিয়ে নিন।",
      bengali: "অতি তীব্র ঘূর্ণিঝড় ওড়িশা উপকূলের দিকে অগ্রসর হচ্ছে। বাতাসের গতিবেগ ঘণ্টায় ২১৫ কিমি ছাড়িয়ে যেতে পারে। কেন্দ্রাপাড়া ও জগৎসিংহপুরে ৪.৫ থেকে ৫.৫ মিটার জলোচ্ছ্বাসের আশঙ্কা। ১২ ঘণ্টার মধ্যে সকল কাঁচা বাড়ি থেকে মানুষকে নিরাপদ আশ্রয়ে সরিয়ে নিন।",
      hi: "अत्यंत भीषण चक्रवात ओडिशा तट की ओर बढ़ रहा है। 215 किमी/घंटा से अधिक की रफ्तार से हवाएं चलने की संभावना। केंद्रपाड़ा और जगतसिंहपुर में 4.5 से 5.5 मीटर तक समुद्री लहरें। 12 घंटों के भीतर कच्चे मकानों को पूरी तरह खाली कराएं।",
      hindi: "अत्यंत भीषण चक्रवात ओडिशा तट की ओर बढ़ रहा है। 215 किमी/घंटा से अधिक की रफ्तार से हवाएं चलने की संभावना। केंद्रपाड़ा और जगतसिंहपुर में 4.5 से 5.5 मीटर तक समुद्री लहरें। 12 घंटों के भीतर कच्चे मकानों को पूरी तरह खाली कराएं।",
      te: "తీవ్రమైన తుఫాను ఒడిశా తీరం వైపు దూసుకొస్తోంది. గాలి వేగం గంటకు 215 కిమీ దాటే అవకాశం. కేంద్రపడా మరియు జగత్‌సింగ్‌పూర్‌లలో 4.5 నుండి 5.5 మీటర్ల తుఫాను అలలు ఎగసిపడే ప్రమాదం. 12 గంటల్లో ప్రజలను సురక్షిత ప్రాంతాలకు తరలించండి.",
      telugu: "తీవ్రమైన తుఫాను ఒడిశా తీరం వైపు దూసుకొస్తోంది. గాలి వేగం గంటకు 215 కిమీ దాటే అవకాశం. కేంద్రపడా మరియు జగత్‌సింగ్‌పూర్‌లలో 4.5 నుండి 5.5 మీటర్ల తుఫాను అలలు ఎగసిపడే ప్రమాదం. 12 గంటల్లో ప్రజలను సురక్షిత ప్రాంతాలకు తరలించండి.",
      ta: "மிகக் கடுமையான புயல் ஒடிசா கடற்கரையை நோக்கி நகர்கிறது. காற்றின் வேகம் மணிக்கு 215 கி.மீ வரை இருக்கும். கேந்திரபாரா மற்றும் ஜகத்சிங்பூரில் 4.5 - 5.5 மீட்டர் அலைகள் எழும் அபாயம். 12 மணி நேரத்திற்குள் மக்களை பாதுகாப்பான முகாம்களுக்கு மாற்றவும்.",
      tamil: "மிகக் கடுமையான புயல் ஒடிசா கடற்கரையை நோக்கி நகர்கிறது. காற்றின் வேகம் மணிக்கு 215 கி.மீ வரை இருக்கும். கேந்திரபாரா மற்றும் ஜகத்சிங்பூரில் 4.5 - 5.5 மீட்டர் அலைகள் எழும் அபாயம். 12 மணி நேரத்திற்குள் மக்களை பாதுகாப்பான முகாம்களுக்கு மாற்றவும்."
    },
    action: {
      en: "Trigger automatic anticipatory cash transfers; mobilize ODRAF and NDRF battalions; shut Paradip port operations.",
      english: "Trigger automatic anticipatory cash transfers; mobilize ODRAF and NDRF battalions; shut Paradip port operations.",
      or: "ପୂର୍ବ-ପ୍ରସ୍ତୁତି ଆର୍ଥିକ ସହାୟତା ଜାରି କରନ୍ତୁ; ଓଡ୍ରାଫ୍ ଓ ଏନଡିଆରଏଫ୍ ଟିମ୍ ମୁତୟନ କରନ୍ତୁ; ପାରାଦ୍ୱୀପ ବନ୍ଦର କାର୍ଯ୍ୟ ବନ୍ଦ ରଖନ୍ତୁ।",
      odia: "ପୂର୍ବ-ପ୍ରସ୍ତୁତି ଆର୍ଥିକ ସହାୟତା ଜାରି କରନ୍ତୁ; ଓଡ୍ରାଫ୍ ଓ ଏନଡିଆରଏଫ୍ ଟିମ୍ ମୁତୟନ କରନ୍ତୁ; ପାରାଦ୍ୱୀପ ବନ୍ଦର କାର୍ଯ୍ୟ ବନ୍ଦ ରଖନ୍ତୁ।",
      bn: "আগাম দুর্যোগ তহবিল সক্রিয় করুন; এনডিআরএফ মোতায়েন করুন; পারাদ্বীপ বন্দরের কাজ স্থগিত রাখুন।",
      bengali: "আগাম দুর্যোগ তহবিল সক্রিয় করুন; এনডিআরএফ মোতায়েন করুন; পারাদ্বীপ বন্দরের কাজ স্থগিত রাখুন।",
      hi: "अग्रिम सहायता राशि जारी करें; एनडीआरएफ/एसडीआरएफ तैनात करें; पारादीप बंदरगाह का संचालन रोकें।",
      hindi: "अग्रिम सहायता राशि जारी करें; एनडीआरएफ/एसडीआरएफ तैनात करें; पारादीप बंदरगाह का संचालन रोकें।",
      te: "ముందస్తు నిధులను విడుదల చేయండి; ఎన్డీఆర్ఎఫ్ దళాలను మోహరించండి; పారాదీప్ పోర్ట్ కార్యకలాపాలను నిలిపివేయండి.",
      telugu: "ముందస్తు నిధులను విడుదల చేయండి; ఎన్డీఆర్ఎఫ్ దళాలను మోహరించండి; పారాదీప్ పోర్ట్ కార్యకలాపాలను నిలిపివేయండి.",
      ta: "முன்னெச்சரிக்கை நிதி விடுவிப்பு; தேசிய பேரிடர் மீட்புப் படை நிலைநிறுத்தம்; பாராதீப் துறைமுக செயல்பாடுகளை நிறுத்துங்கள்.",
      tamil: "முன்னெச்சரிக்கை நிதி விடுவிப்பு; தேசிய பேரிடர் மீட்புப் படை நிலைநிறுத்தம்; பாராதீப் துறைமுக செயல்பாடுகளை நிறுத்துங்கள்."
    }
  }
};

export const FALLBACK_ADVISORY: AnticipatoryAdvisory = {
  advisory_id: "ADV-FALLBACK-SEED",
  cyclone_id: "BOB-02-2019",
  issued_at: "2026-09-18T00:00:00Z",
  severity_level: "EMERGENCY_ACTION",
  lead_time_hours: 18.0,
  estimated_landfall_location: "Odisha Coastline (Puri-Jagatsinghpur sector)",
  max_expected_wind_kmph: 215,
  max_expected_surge_m: 5.5,
  target_districts: ["Kendrapara", "Jagatsinghpur", "Puri"],
  headline: "URGENT PRE-LANDFALL ANTICIPATORY ACTION",
  multilingual_advisories: {
    english: "Extremely Severe Cyclone tracking toward Odisha coast. Wind gusts exceeding 215 km/h. Expected storm surge 4.5m - 5.5m in Kendrapara and Jagatsinghpur. Complete evacuation of kutcha settlements within 12 hours.",
    odia: "ଅତ୍ୟନ୍ତ ଭୟଙ୍କର ବାତ୍ୟା ଓଡ଼ିଶା ଉପକୂଳ ମୁହାଁ। ପବନର ବେଗ ୨୧୫ କିମି/ଘଣ୍ଟା ଅତିକ୍ରମ କରିବ। କେନ୍ଦ୍ରାପଡ଼ା ଏବଂ ଜଗତସିଂହପୁରରେ ୪.୫ ରୁ ୫.୫ ମିଟର ଉଚ୍ଚ ଜୁଆର ଆଶଙ୍କା। ଆଗାମୀ ୧୨ ଘଣ୍ଟା ମଧ୍ୟରେ କଚ୍ଚା ଘରୁ ଲୋକଙ୍କୁ ଆଶ୍ରୟସ୍ଥଳକୁ ସ୍ଥାନାନ୍ତର କରନ୍ତୁ।",
    bengali: "অতি তীব্র ঘূর্ণিঝড় ওড়িশা উপকূলের দিকে অগ্রসর হচ্ছে। বাতাসের গতিবেগ ঘণ্টায় ২১৫ কিমি ছাড়িয়ে যেতে পারে। কেন্দ্রাপাড়া ও জগৎসিংহপুরে ৪.৫ থেকে ৫.৫ মিটার জলোচ্ছ্বাসের আশঙ্কা। ১২ ঘণ্টার মধ্যে সকল কাঁচা বাড়ি থেকে মানুষকে নিরাপদ আশ্রয়ে সরিয়ে নিন।",
    hindi: "अत्यंत भीषण चक्रवात ओडिशा तट की ओर बढ़ रहा है। 215 किमी/घंटा से अधिक की रफ्तार से हवाएं चलने की संभावना। केंद्रपाड़ा और जगतसिंहपुर में 4.5 से 5.5 मीटर तक समुद्री लहरें। 12 घंटों के भीतर कच्चे मकानों को पूरी तरह खाली कराएं।",
    telugu: "తీవ్రమైన తుఫాను ఒడిశా తీరం వైపు దూసుకొస్తోంది. గాలి వేగం గంటకు 215 కిమీ దాటే అవకాశం. కేంద్రపడా మరియు జగత్‌సింగ్‌పూర్‌లలో 4.5 నుండి 5.5 మీటర్ల తుఫాను అలలు ఎగసిపడే ప్రమాదం. 12 గంటల్లో ప్రజలను సురక్షిత ప్రాంతాలకు తరలించండి.",
    tamil: "மிகக் கடுமையான புயல் ஒடிசா கடற்கரையை நோக்கி நகர்கிறது. காற்றின் வேகம் மணிக்கு 215 கி.மீ வரை இருக்கும். கேந்திரபாரா மற்றும் ஜகத்சிங்பூரில் 4.5 - 5.5 மீட்டர் அலைகள் எழும் அபாயம். 12 மணி நேரத்திற்குள் மக்களை பாதுகாப்பான முகாம்களுக்கு மாற்றவும்."
  },
  recommended_actions: [
    {
      category: "EVACUATION",
      action: "Complete priority evacuation of elderly, children, and vulnerable families from kutcha houses to cyclone shelters.",
      urgency: "IMMEDIATE",
      target_audience: "District Administration & ODRAF"
    },
    {
      category: "SHELTER",
      action: "Pre-position 72h dry food rations, drinking water purification, and emergency lighting in multipurpose shelters.",
      urgency: "WITHIN_12_HOURS",
      target_audience: "Civil Supplies & Block Development Officers"
    },
    {
      category: "FISHERFOLK",
      action: "Strict ban on sea venturing. Ensure all mechanized boats anchored safely inside fishing harbours.",
      urgency: "IMMEDIATE",
      target_audience: "Fisheries Department & Marine Police"
    }
  ],
  model: "gemini-3.7-flash"
};

