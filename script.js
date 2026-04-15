let csvData = {};

const files = [
    "regulatory_rules.csv",
    "risk_matrix.csv",
    "state_rules.csv",
    "risk_events.csv",
    "authority_directory.csv",
    "compliance_checklist_template.csv",
    "regulation_explanations.csv"
];

/* LOAD ALL CSV */
files.forEach(file => {
    Papa.parse(`csv/${file}`, {
        download: true,
        header: true,
        complete: res => {
            csvData[file] = res.data;
        }
    });
});

let currentReport;

/* FORM */
document.getElementById("form").addEventListener("submit", e => {
    e.preventDefault();
    currentReport = generateReport();
    displayReport(currentReport);
});

/* GENERATE REPORT */
function generateReport() {

    let state = document.getElementById("state").value;
    let sector = document.getElementById("sector").value.toLowerCase();

    let fulfilled = 0;

    if (val("has_cac") === "Yes") fulfilled++;
    if (val("has_tin") === "Yes") fulfilled++;
    if (val("has_vat") === "Yes") fulfilled++;
    if (val("has_nafdac") === "Yes") fulfilled++;
    if (val("has_permit") === "Yes") fulfilled++;

    let risk =
        fulfilled >= 4 ? "Low Risk" :
        fulfilled >= 2 ? "Medium Risk" :
        "High Risk";

    /* FILTER CSV DATA */
    let rules = csvData["regulatory_rules.csv"] || [];
    let stateRules = csvData["state_rules.csv"] || [];
    let risks = csvData["risk_events.csv"] || [];
    let authorities = csvData["authority_directory.csv"] || [];

    let relevantRules = rules.filter(r =>
        r.sector?.toLowerCase().includes(sector)
    );

    let relevantStateRules = stateRules.filter(r =>
        r.state === state
    );

    let relevantRisks = risks.filter(r =>
        r.sector?.toLowerCase().includes(sector)
    );

    return {
        business_name: val("business_name"),
        compliance_score: fulfilled + "/5",
        risk_level: risk,
        rules: relevantRules,
        state_rules: relevantStateRules,
        risks: relevantRisks,
        authorities
    };
}

/* DISPLAY RICH REPORT */
function displayReport(report) {

    let html = "";

    html += `
    <div class="report-section">
        <h3>Overview</h3>
        <p><b>${report.business_name}</b></p>
        <p>Score: ${report.compliance_score}</p>
        <span class="badge ${report.risk_level.split(" ")[0].toLowerCase()}">
            ${report.risk_level}
        </span>
    </div>
    `;

    /* REGULATORY RULES */
    html += `<div class="report-section"><h3>Applicable Regulations</h3><ul>`;
    report.rules.slice(0,10).forEach(r=>{
        html+=`<li>${r.rule || "Regulation rule"}</li>`;
    });
    html += `</ul></div>`;

    /* STATE RULES */
    html += `<div class="report-section"><h3>State Laws</h3><ul>`;
    report.state_rules.slice(0,10).forEach(r=>{
        html+=`<li>${r.rule || "State law"}</li>`;
    });
    html += `</ul></div>`;

    /* RISKS */
    html += `<div class="report-section"><h3>Risk Exposure</h3><ul>`;
    report.risks.slice(0,10).forEach(r=>{
        html+=`<li>${r.risk || "Risk factor"}</li>`;
    });
    html += `</ul></div>`;

    /* AUTHORITIES */
    html += `<div class="report-section"><h3>Relevant Authorities</h3><ul>`;
    report.authorities.slice(0,10).forEach(a=>{
        html+=`<li>${a.name || "Authority"}</li>`;
    });
    html += `</ul></div>`;

    /* RECOMMENDATIONS */
    html += `
    <div class="report-section">
        <h3>AI Recommendations</h3>
        <ul>
            <li>Complete all missing registrations</li>
            <li>Follow state-specific compliance rules</li>
            <li>Schedule compliance audit</li>
            <li>Engage regulatory authorities</li>
        </ul>
    </div>
    `;

    document.getElementById("reportContent").innerHTML = html;
    document.getElementById("reportSection").classList.remove("hidden");
}

/* UTIL */
function val(id){
    return document.getElementById(id).value;
}

/* CSV DOWNLOAD */
function downloadCSV(){
    if(!currentReport) return;

    let row = [
        currentReport.business_name,
        currentReport.compliance_score,
        currentReport.risk_level
    ];

    let csv = "Business,Score,Risk\n" + row.join(",");

    let blob = new Blob([csv], {type:"text/csv"});
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "report.csv";
    a.click();
}
