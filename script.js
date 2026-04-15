let rulesData = [];
let riskData = [];
let stateData = [];
let businessesData = [];
let reportsData = [];
let checklistData = [];
let authoritiesData = [];

let latestReportData = null;

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

function normalize(value) {
  return (value || "").toString().trim().toLowerCase();
}

function checkCompliance() {
  const type = normalize(document.getElementById("businessType").value);
  const location = normalize(document.getElementById("location").value);
  const size = normalize(document.getElementById("size").value);

  if (!type || !location || !size) {
    alert("Please fill in Business Type, Location, and Size.");
    return;
  }

  let applicableRules = rulesData.filter(r =>
    normalize(r.business_type) === type || normalize(r.business_type) === "all"
  );

  applicableRules = applicableRules.filter(r =>
    !r.applicable_size ||
    normalize(r.applicable_size) === size ||
    normalize(r.applicable_size) === "all"
  );

  const locationRules = stateData.filter(s =>
    normalize(s.state) === location || normalize(s.state) === "all"
  );

  let allRequirements = [
    ...applicableRules.map(r => r.requirement),
    ...locationRules.map(r => r.requirement)
  ].filter(Boolean);

  allRequirements = [...new Set(allRequirements)];

  if (allRequirements.length === 0) {
    document.getElementById("result").classList.remove("hidden");
    document.getElementById("result").innerHTML = `
      <h3>Compliance Result</h3>
      <p>No matching compliance rules found for this business type and location.</p>
    `;
    latestReportData = null;
    return;
  }

  // Demo logic: assume first half are missing
  const missing = allRequirements.slice(0, Math.ceil(allRequirements.length / 2));
  const fulfilled = allRequirements.filter(item => !missing.includes(item));

  let totalRisk = 0;
  const penaltyNotes = [];

  missing.forEach(req => {
    const risk = riskData.find(r => normalize(r.requirement) === normalize(req));
    if (risk) {
      totalRisk += parseInt(risk.severity_score || 0, 10);
      if (risk.penalty) {
        penaltyNotes.push(`${req}: ${risk.penalty}`);
      }
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

  latestReportData = {
    businessType: type,
    location,
    size,
    required: allRequirements,
    missing,
    fulfilled,
    score,
    status,
    penaltyNotes,
    generatedAt: new Date().toLocaleString()
  };

  displayResult(latestReportData, color);
}

function displayResult(data, color) {
  const resultDiv = document.getElementById("result");
  resultDiv.classList.remove("hidden");

  resultDiv.innerHTML = `
    <h3>Compliance Result</h3>
    <p><strong>Business Type:</strong> ${capitalizeWords(data.businessType)}</p>
    <p><strong>Location:</strong> ${capitalizeWords(data.location)}</p>
    <p><strong>Size:</strong> ${capitalizeWords(data.size)}</p>

    <h4>Required Compliance Items</h4>
    <ul>${data.required.map(r => `<li>${r}</li>`).join("")}</ul>

    <h4>Fulfilled Items</h4>
    <ul>${data.fulfilled.length ? data.fulfilled.map(f => `<li>${f}</li>`).join("") : "<li>None</li>"}</ul>

    <h4>Missing Items</h4>
    <ul>${data.missing.length ? data.missing.map(m => `<li>${m}</li>`).join("") : "<li>None</li>"}</ul>

    <p class="${color}"><strong>Compliance Score: ${data.score}%</strong></p>
    <p><strong>Status:</strong> ${data.status}</p>
    <p><strong>Recommendation:</strong> Complete the missing requirements to reduce regulatory risk.</p>

    <button onclick="downloadPDF()" style="margin-top:15px;">Download PDF Report</button>
  `;
}

function downloadPDF() {
  if (!latestReportData) {
    alert("Please run a compliance check first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const data = latestReportData;
  let y = 20;

  doc.setFontSize(18);
  doc.text("Prudent Compliance Report", 14, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Generated: ${data.generatedAt}`, 14, y);
  y += 10;

  doc.text(`Business Type: ${capitalizeWords(data.businessType)}`, 14, y);
  y += 7;
  doc.text(`Location: ${capitalizeWords(data.location)}`, 14, y);
  y += 7;
  doc.text(`Size: ${capitalizeWords(data.size)}`, 14, y);
  y += 7;
  doc.text(`Compliance Score: ${data.score}%`, 14, y);
  y += 7;
  doc.text(`Status: ${data.status}`, 14, y);
  y += 12;

  y = addSection(doc, "Required Compliance Items", data.required, y);
  y = addSection(doc, "Fulfilled Items", data.fulfilled.length ? data.fulfilled : ["None"], y);
  y = addSection(doc, "Missing Items", data.missing.length ? data.missing : ["None"], y);
  y = addSection(doc, "Penalty Notes", data.penaltyNotes.length ? data.penaltyNotes : ["No penalty notes available"], y);

  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(11);
  const recommendation = "Recommendation: Complete the missing requirements to reduce regulatory risk and improve your compliance score.";
  const wrappedRecommendation = doc.splitTextToSize(recommendation, 180);
  doc.text(wrappedRecommendation, 14, y);

  const safeBusinessType = data.businessType.replace(/\s+/g, "_");
  doc.save(`Prudent_Report_${safeBusinessType}.pdf`);
}

function addSection(doc, title, items, y) {
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.text(title, 14, y);
  y += 8;

  doc.setFontSize(11);

  items.forEach(item => {
    const lines = doc.splitTextToSize(`- ${item}`, 180);
    if (y + (lines.length * 6) > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, 14, y);
    y += lines.length * 6 + 2;
  });

  y += 4;
  return y;
}

function capitalizeWords(text) {
  return (text || "").replace(/\b\w/g, char => char.toUpperCase());
}
