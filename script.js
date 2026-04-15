/* =========================
   GLOBAL DATA
========================= */
let rulesData = [];
let riskData = [];
let stateData = [];
let statesList = [];

let latestReport = null;

/* =========================
   LOAD CSV
========================= */
function loadCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: res => resolve(res.data),
      error: err => reject(err)
    });
  });
}

/* =========================
   INIT DATA
========================= */
async function init() {
  [rulesData, riskData, stateData] = await Promise.all([
    loadCSV("csv/regulatory_rules.csv"),
    loadCSV("csv/risk_matrix.csv"),
    loadCSV("csv/state_rules.csv")
  ]);

  populateStates();
}

init();

/* =========================
   POPULATE STATE DROPDOWN
========================= */
function populateStates() {
  const select = document.getElementById("state");

  statesList = [...new Set(stateData.map(s => s.state).filter(Boolean))];

  select.innerHTML = `<option value="">Select State</option>` +
    statesList.map(s => `<option value="${s}">${s}</option>`).join("");
}

/* =========================
   MAIN CHECK
========================= */
function checkCompliance() {

  const type = normalize(document.getElementById("businessType").value);
  const state = normalize(document.getElementById("state").value);
  const size = normalize(document.getElementById("size").value);

  if (!type || !state || !size) {
    alert("Please fill all fields");
    return;
  }

  /* ===== RULE MATCHING ===== */

  // Base regulatory rules
  let baseRules = rulesData.filter(r =>
    normalize(r.business_type) === type ||
    normalize(r.business_type) === "all"
  );

  // Size filter
  baseRules = baseRules.filter(r =>
    !r.applicable_size ||
    normalize(r.applicable_size) === size ||
    normalize(r.applicable_size) === "all"
  );

  // State-specific rules
  let localRules = stateData.filter(s =>
    normalize(s.state) === state
  );

  /* ===== COMBINE ===== */

  let requirements = [
    ...baseRules.map(r => r.requirement),
    ...localRules.map(r => r.requirement)
  ].filter(Boolean);

  requirements = [...new Set(requirements)];

  /* ===== SIMULATE STATUS ===== */
  let missing = requirements.slice(0, Math.ceil(requirements.length / 2));
  let fulfilled = requirements.filter(r => !missing.includes(r));

  /* ===== RISK CALCULATION ===== */
  let totalRisk = 0;
  let penalties = [];

  missing.forEach(req => {
    let match = riskData.find(r =>
      normalize(r.requirement) === normalize(req)
    );

    if (match) {
      totalRisk += parseInt(match.severity_score || 0);
      penalties.push(match.penalty || "Penalty applies");
    }
  });

  let score = Math.max(0, 100 - totalRisk);

  let status = "Low Risk";
  if (score < 70) status = "Medium Risk";
  if (score < 40) status = "High Risk";

  latestReport = {
    type, state, size,
    requirements,
    missing,
    fulfilled,
    penalties,
    score,
    status
  };

  renderResult();
}

/* =========================
   RENDER RESULT
========================= */
function renderResult() {

  const r = latestReport;
  const result = document.getElementById("result");

  result.classList.remove("hidden");

  result.innerHTML = `
    <h3>Compliance Result</h3>

    <p><strong>Business:</strong> ${capitalize(r.type)}</p>
    <p><strong>State:</strong> ${capitalize(r.state)}</p>

    <h4>Required Compliance</h4>
    <ul>${r.requirements.map(x => `<li>${x}</li>`).join("")}</ul>

    <h4>Missing Requirements</h4>
    <ul>${r.missing.map(x => `<li>${x}</li>`).join("")}</ul>

    <h4>Penalties</h4>
    <ul>${r.penalties.map(p => `<li>${p}</li>`).join("")}</ul>

    <p class="${getColor(r.score)}">
      <strong>Score: ${r.score}% (${r.status})</strong>
    </p>

    <button onclick="downloadPDF()">Download PDF Report</button>
  `;
}

/* =========================
   HELPERS
========================= */
function normalize(x) { return (x || "").toLowerCase().trim(); }
function capitalize(x) { return x.charAt(0).toUpperCase() + x.slice(1); }

function getColor(score) {
  if (score < 40) return "red";
  if (score < 70) return "yellow";
  return "green";
}

loadCSV("/csv/regulatory_rules.csv")
loadCSV("/csv/risk_matrix.csv")
loadCSV("/csv/state_rules.csv")
loadCSV("/csv/authority_directory.csv")
loadCSV("/csv/compliance_checklist_template.csv")
