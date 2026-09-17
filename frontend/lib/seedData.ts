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

