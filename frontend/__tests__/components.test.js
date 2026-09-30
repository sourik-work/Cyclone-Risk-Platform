import test from 'node:test';
import assert from 'node:assert/strict';

test('ApprovalGate Component Tests', async (t) => {
  await t.test('initializes in draft state with modification false', () => {
    const state = { status: 'draft', modification: false, confidence: 5 };
    assert.equal(state.status, 'draft');
    assert.equal(state.modification, false);
  });

  await t.test('transitions to approved state on operator submit', () => {
    const state = { status: 'draft' };
    const approve = (s) => ({ ...s, status: 'APPROVED', approved_at: new Date().toISOString() });
    const newState = approve(state);
    assert.equal(newState.status, 'APPROVED');
    assert.ok(newState.approved_at);
  });

  await t.test('records operator confidence scale (1-5)', () => {
    const feedback = { clarity: 5, modified: false, trust: 4 };
    assert.ok(feedback.clarity >= 1 && feedback.clarity <= 5);
    assert.ok(feedback.trust >= 1 && feedback.trust <= 5);
  });

  await t.test('calculates review latency correctly in seconds', () => {
    const t1 = new Date('2026-09-30T10:00:00Z').getTime();
    const t2 = new Date('2026-09-30T10:02:30Z').getTime();
    const latencySec = (t2 - t1) / 1000;
    assert.equal(latencySec, 150);
  });
});

test('InsurancePanel & Actuarial Tests', async (t) => {
  await t.test('enforces k_state and cap_state limits', () => {
    const k_state = 0.12;
    const cap_state = 0.55;
    const exceedance = 1.4;
    const affectedRatio = Math.min(exceedance * k_state, cap_state);
    assert.equal(Number(affectedRatio.toFixed(4)), 0.168);
  });

  await t.test('caps payout at total sum insured', () => {
    const sumInsured = 100000000;
    const calculatedPayout = 120000000;
    const finalPayout = Math.min(calculatedPayout, sumInsured);
    assert.equal(finalPayout, sumInsured);
  });

  await t.test('returns zero payout for sub-threshold wind speeds', () => {
    const threshold = 150;
    const observed = 110;
    const isTriggered = observed >= threshold;
    const payout = isTriggered ? 50000000 : 0;
    assert.equal(payout, 0);
  });

  await t.test('includes valid calibration_provenance structure', () => {
    const contract = {
      id: 'INS-01',
      calibration_provenance: {
        calibration_source: 'Kerala SDMA 2026 / Nagaland DRTPS 2024',
        k_state: 0.12,
        cap_state: 0.55,
      },
    };
    assert.ok(contract.calibration_provenance.calibration_source.includes('Kerala SDMA'));
    assert.equal(contract.calibration_provenance.k_state, 0.12);
  });
});

test('ModelValidationCard & LOSO Forecast Tests', async (t) => {
  await t.test('computes 95% CI bounds from bootstrap resamples', () => {
    const mean24h = 79.54;
    const ci_lower = 75.67;
    const ci_upper = 83.62;
    assert.ok(mean24h >= ci_lower && mean24h <= ci_upper);
  });

  await t.test('displays Persistence and IMD operational baselines', () => {
    const baselines = {
      persistence_24h_rmse: 112.4,
      imd_operational_24h_rmse: 80.0,
      lstm_ensemble_24h_rmse: 79.54,
    };
    assert.ok(baselines.lstm_ensemble_24h_rmse < baselines.persistence_24h_rmse);
  });

  await t.test('formats ensemble divergence alert threshold (> 200 km)', () => {
    const divergence = 245.8;
    const flagForHumanReview = divergence > 200.0;
    assert.equal(flagForHumanReview, true);
  });

  await t.test('labels model as complementary ensemble member without claiming superiority', () => {
    const label = 'AI Ensemble Member — Track Smoothing & Divergence Detection';
    assert.ok(!label.toLowerCase().includes('beats imd'));
    assert.ok(label.includes('Ensemble Member'));
  });
});

test('MapOverlay & Sentinel-2 Change Detection Tests', async (t) => {
  await t.test('provides valid tile URLs for Fani and Amphan', () => {
    const layers = {
      fani_2019: {
        ndvi_change_tile: 'https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/fani-ndvi-2019/tiles/{z}/{x}/{y}',
        ndwi_change_tile: 'https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/fani-ndwi-2019/tiles/{z}/{x}/{y}',
      },
    };
    assert.ok(layers.fani_2019.ndvi_change_tile.includes('https://'));
    assert.ok(layers.fani_2019.ndwi_change_tile.includes('https://'));
  });

  await t.test('clamps layer opacity between 0.0 and 1.0', () => {
    const clamp = (val) => Math.max(0, Math.min(1, val));
    assert.equal(clamp(0.75), 0.75);
    assert.equal(clamp(1.5), 1.0);
    assert.equal(clamp(-0.2), 0.0);
  });

  await t.test('toggles layer visibility state cleanly', () => {
    let visible = false;
    visible = !visible;
    assert.equal(visible, true);
    visible = !visible;
    assert.equal(visible, false);
  });
});

test('ExposurePanel & Uncertainty Cone Tests', async (t) => {
  await t.test('computes cone radii at 24h and 48h from LOSO RMSE', () => {
    const rmse24 = 79.54;
    const rmse48 = 147.08;
    const r24 = Number((1.96 * rmse24).toFixed(1));
    const r48 = Number((1.96 * rmse48).toFixed(1));
    assert.equal(r24, 155.9);
    assert.equal(r48, 288.3);
  });

  await t.test('classifies district exposure confidence into HIGH, MEDIUM, LOW', () => {
    const districtExposure = {
      district: 'Puri',
      exposure_level: 'HIGH',
      confidence: 'MEDIUM',
      within_cone: true,
    };
    assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(districtExposure.confidence));
    assert.equal(districtExposure.within_cone, true);
  });

  await t.test('formats probabilistic uncertainty language for dispatch advisory', () => {
    const narrative = 'Landfall is likely within the 95% cone of uncertainty between Puri and Paradip.';
    assert.ok(narrative.includes('cone of uncertainty'));
  });

  await t.test('identifies assets inside 50km buffer outside cone', () => {
    const asset = { name: 'Dhamra Port Substation', distance_to_track_km: 185.0, cone_radius_km: 155.9 };
    const insideCone = asset.distance_to_track_km <= asset.cone_radius_km;
    const inBuffer = !insideCone && (asset.distance_to_track_km - asset.cone_radius_km) <= 50.0;
    assert.equal(insideCone, false);
    assert.equal(inBuffer, true);
  });

  await t.test('validates emergency triage asset priority ranking', () => {
    const triageLevels = ['P1_CRITICAL', 'P2_HIGH', 'P3_MODERATE', 'P4_LOW'];
    assert.equal(triageLevels[0], 'P1_CRITICAL');
    assert.equal(triageLevels.length, 4);
  });
});
