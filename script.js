let rulesData = [];
let riskData = [];
let stateData = [];
let businessesData = [];
let reportsData = [];
let checklistData = [];
let authoritiesData = [];

// Load CSV helper
function loadCSV(file, callback) {
  Papa.parse(file, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      callback(results.data);
    },
    error: function (err) {
      console.error(`Error loading ${file}:`, err);
    }
  });
}

// Initialize all datasets from csv folder
function initData() {
  loadCSV("csv/regulatory_rules.csv", data => rulesData = data);
  loadCSV("csv/risk_matrix.csv", data => riskData = data);
  loadCSV("csv/state_rules.csv", data => stateData = data);
  loadCSV("csv/sample_businesses.csv", data => businessesData = data);
  loadCSV("csv/compliance_reports.csv", data => reportsData = data);
  loadCSV("csv/compliance_checklist_template.csv", data => checklistData = data);
  loadCSV("csv/authority_directory.csv", data => authoritiesData = data);
}

initData();

function checkCompliance() {
  const type = document.getElementById("businessType").value.trim().toLowerCase();
  const location = document.getElementById("location").value.trim().toLowerCase();
  const size = document.getElementById("size").value.trim().toLowerCase();

  let applicableRules = rulesData.filter(r =>
    (r.business_type || "").toLowerCase() === type ||
    (r.business_type || "").toLowerCase() === "all"
  );

  applicableRules = applicableRules.filter(r =>
    !(r.applicable_size) ||
    r.applicable_size.toLowerCase() === size ||
    r.applicable_size.toLowerCase() === "all"
  );

  const locationRules = stateData.filter(s =>
    (s.state || "").toLowerCase() === location
  );

  let allRequirements = [
    ...applicableRules.map(r => r.requirement),
    ...locationRules.map(r => r.requirement)
  ].filter(Boolean);

  allRequirements = [...new Set(allRequirements)];

  // Demo assumption: first half missing
  const missing = allRequirements.slice(0, Math.ceil(allRequirements.length / 2));

  let totalRisk = 0;
  missing.forEach(req => {
    const risk = riskData.find(r => (r.requirement || "").trim() === req.trim());
    if (risk) {
      totalRisk += parseInt(risk.severity_score || 0, 10);
    }
  });

  const score = Math.max(0, 100 - totalRisk);

  let color = "green";
  let status = "Low Risk";
  if (score < 70) {
    color = "yellow";
    status = "Medium Risk";
  }
  if (score < 40) {
    color = "red";
    status = "High Risk";
  }

  displayResult(type, location, size, allRequirements, missing, score, color, status);
}

function displayResult(type, location, size, required, missing, score, color, status) {
  const resultDiv = document.getElementById("result");
  resultDiv.classList.remove("hidden");

  resultDiv.innerHTML = `
    <h3>Compliance Result</h3>
    <p><strong>Business Type:</strong> ${type}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Size:</strong> ${size}</p>

    <h4>Required Compliance Items</h4>
    <ul>${required.map(r => `<li>${r}</li>`).join("")}</ul>

    <h4>Missing Items</h4>
    <ul>${missing.map(m => `<li>${m}</li>`).join("")}</ul>

    <p class="${color}"><strong>Compliance Score: ${score}%</strong></p>
    <p><strong>Status:</strong> ${status}</p>
    <p><strong>Recommendation:</strong> Complete the missing requirements to reduce regulatory risk.</p>
  `;
}
