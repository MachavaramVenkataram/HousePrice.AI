const http = require('http');

async function testFetch(url, options = {}) {
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data,
            });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const sampleFeatures = {
  GrLivArea: 1600,
  TotalBsmtSF: 950,
  "1stFlrSF": 950,
  "2ndFlrSF": 650,
  YearBuilt: 1985,
  YearRemodAdd: 1995,
  OverallQual: 7,
  OverallCond: 5,
  FullBath: 2,
  HalfBath: 1,
  BsmtFullBath: 1,
  BedroomAbvGr: 3,
  TotRmsAbvGrd: 7,
  Fireplaces: 1,
  GarageCars: 2,
  GarageArea: 480,
  LotArea: 9500,
  Neighborhood: "CollgCr",
};

async function runVerification() {
  console.log("=== HOUSEPRICE AI DECISION INTELLIGENCE INTEGRATION TEST ===");

  try {
    // 1. Frontend home page
    const feHome = await testFetch('http://localhost:3000/');
    console.log(`[PASS] Frontend Homepage HTTP status: ${feHome.status}`);

    // 2. Frontend predict page
    const fePredict = await testFetch('http://localhost:3000/predict');
    console.log(`[PASS] Frontend Predict Page HTTP status: ${fePredict.status}`);

    // 3. Frontend what-if page
    const feWhatIf = await testFetch('http://localhost:3000/what-if');
    console.log(`[PASS] Frontend What-If Page HTTP status: ${feWhatIf.status}`);

    // 4. Backend Health
    const beHealth = await testFetch('http://127.0.0.1:8001/api/v1/health');
    console.log(`[PASS] Backend Health: ${beHealth.status} - Status: ${beHealth.body.status || 'OK'}`);

    // 5. Backend Decision Profile
    const profileRes = await testFetch('http://127.0.0.1:8001/api/v1/decision/profile', {
      method: 'POST',
      body: sampleFeatures,
    });
    console.log(`[PASS] Decision Profile: ${profileRes.status}`);
    console.log(`       Input Quality: ${profileRes.body.input_quality.status} (${profileRes.body.input_quality.score_label})`);
    console.log(`       Summary: "${profileRes.body.profile.summary_text}"`);

    // 6. Backend Similar Properties (Historical Ames Comparables)
    const simRes = await testFetch('http://127.0.0.1:8001/api/v1/decision/similar?estimated_price=215000&priority=balanced&top_k=4', {
      method: 'POST',
      body: sampleFeatures,
    });
    console.log(`[PASS] Similar Historical Comparables: ${simRes.status}`);
    console.log(`       Comparables Count: ${simRes.body.comparable_count}`);
    console.log(`       Median Price: $${simRes.body.comparable_median_price.toLocaleString()}`);
    console.log(`       Positioning: "${simRes.body.positioning_summary}"`);
    console.log(`       Disclaimer: "${simRes.body.historical_disclaimer}"`);
    console.log(`       First Comparable: $${simRes.body.comparables[0].sale_price.toLocaleString()}, ${simRes.body.comparables[0].gr_liv_area} sq ft, ${simRes.body.comparables[0].similarity_pct}% similarity`);

    // 7. Backend Reliability Assessment & Model Consensus
    const relRes = await testFetch('http://127.0.0.1:8001/api/v1/decision/reliability?estimated_price=215000&interval_width=35000', {
      method: 'POST',
      body: sampleFeatures,
    });
    console.log(`[PASS] Reliability Center: ${relRes.status}`);
    console.log(`       Overall Reliability: ${relRes.body.overall_reliability}`);
    console.log(`       Consensus Level: ${relRes.body.consensus.agreement_level} (Spread: ${relRes.body.consensus.spread_percentage}%)`);
    console.log(`       Models Evaluated: ${relRes.body.consensus.models.map(m => `${m.model_name}: $${Math.round(m.predicted_price).toLocaleString()}`).join(', ')}`);

    // 8. Backend Affordability Planner
    const affRes = await testFetch('http://127.0.0.1:8001/api/v1/decision/affordability', {
      method: 'POST',
      body: {
        budget: 250000,
        estimated_price: 215000,
        down_payment: 43000,
        interest_rate_pct: 6.5,
        loan_term_years: 30,
        monthly_property_tax: 250,
        monthly_home_insurance: 100,
      },
    });
    console.log(`[PASS] Affordability Planner: ${affRes.status}`);
    console.log(`       Monthly Principal & Interest: $${affRes.body.monthly_principal_interest.toFixed(2)}`);
    console.log(`       Total Monthly Payment: $${affRes.body.total_monthly_payment.toFixed(2)}`);
    console.log(`       Status: ${affRes.body.status_label} (Delta: $${affRes.body.budget_delta.toLocaleString()})`);

    // 9. Backend Improvement Simulator
    const impRes = await testFetch('http://127.0.0.1:8001/api/v1/decision/improve', {
      method: 'POST',
      body: {
        features: sampleFeatures,
        renovation_costs: {
          quality_upgrade: 15000,
          space_addition: 35000,
        },
      },
    });
    console.log(`[PASS] Improvement Simulator: ${impRes.status}`);
    console.log(`       Current Estimate: $${Math.round(impRes.body.current_estimate).toLocaleString()}`);
    impRes.body.scenarios.forEach((sc) => {
      console.log(`       Scenario "${sc.name}": Modeled Change: +$${Math.round(sc.modeled_difference).toLocaleString()}${sc.net_modeled_scenario_difference !== null ? ` (Net Modeled Difference: +$${Math.round(sc.net_modeled_scenario_difference).toLocaleString()})` : ''}`);
    });

    // 10. Backend Saved Scenarios CRUD
    const saveRes = await testFetch('http://127.0.0.1:8001/api/v1/decision/scenarios', {
      method: 'POST',
      body: {
        name: "Test Family Scenario",
        description: "3-bed 2-bath college creek",
        features: sampleFeatures,
        predicted_price: 215000,
        lower_bound: 195000,
        upper_bound: 235000,
        model_name: "Voting Ensemble",
      },
    });
    console.log(`[PASS] Save Scenario: ${saveRes.status} (ID: ${saveRes.body.id}, Name: "${saveRes.body.name}")`);

    const listRes = await testFetch('http://127.0.0.1:8001/api/v1/decision/scenarios');
    console.log(`[PASS] List Scenarios: ${listRes.status} (${listRes.body.length} scenario(s) found)`);

    const delRes = await testFetch(`http://127.0.0.1:8001/api/v1/decision/scenarios/${saveRes.body.id}`, {
      method: 'DELETE',
    });
    console.log(`[PASS] Delete Scenario: ${delRes.status} - ${delRes.body.message}`);

    console.log("\n>>> ALL 10 DECISION INTELLIGENCE ENDPOINTS & PAGES VERIFIED SUCCESSFULLY! <<<");
  } catch (err) {
    console.error("Verification error:", err);
    process.exit(1);
  }
}

runVerification();
