let regulatoryRules = [];
let stateRules = [];
let riskMatrix = [];

let currentReport = null;

/* LOAD CSV FILES */
function loadCSV(file, callback) {
    Papa.parse(`csv/${file}`, {
        download: true,
        header: true,
        complete: function(results) {
            callback(results.data);
        }
    });
}

loadCSV("regulatory_rules.csv", data => regulatoryRules = data);
loadCSV("state_rules.csv", data => stateRules = data);
loadCSV("risk_matrix.csv", data => riskMatrix = data);

/* FORM */
document.getElementById("form").addEventListener("submit", function(e){
    e.preventDefault();
    let data = getFormData();
    currentReport = generateReport(data);
    displayReport(currentReport);
});

/* GET DATA */
function getFormData(){
    return {
        business_id: val("business_id"),
        business_name: val("business_name"),
        state: val("state"),
        sector: val("sector"),
        lga: val("lga"),
        has_cac: val("has_cac"),
        has_tin: val("has_tin"),
        has_vat: val("has_vat"),
        has_nafdac: val("has_nafdac"),
        has_permit: val("has_permit")
    };
}

function val(id){ return document.getElementById(id).value; }

/* CORE ENGINE */
function generateReport(data){

    let issues = [];
    let recommendations = [];
    let fulfilled = 0;
    let total = 5;

    /* BASIC CHECK */
    if(data.has_cac==="Yes") fulfilled++; else issues.push("Not registered with CAC");
    if(data.has_tin==="Yes") fulfilled++; else issues.push("No Tax Identification Number");
    if(data.has_vat==="Yes") fulfilled++; else issues.push("VAT not registered");
    if(data.has_nafdac==="Yes") fulfilled++; else issues.push("NAFDAC approval missing");
    if(data.has_permit==="Yes") fulfilled++; else issues.push("Operational permit missing");

    /* REGULATORY RULES */
    let relevantRules = regulatoryRules.filter(r => 
        r.sector?.toLowerCase() === data.sector.toLowerCase()
    );

    relevantRules.forEach(rule => {
        if(rule.requirement){
            issues.push(rule.requirement);
            recommendations.push(rule.recommendation);
        }
    });

    /* STATE RULES */
    let relevantStateRules = stateRules.filter(r => 
        r.state === data.state
    );

    relevantStateRules.forEach(rule => {
        issues.push(rule.rule);
        recommendations.push(rule.action);
    });

    /* RISK LEVEL */
    let risk = fulfilled >=4 ? "Low Risk" :
               fulfilled >=2 ? "Medium Risk" :
               "High Risk";

    return {
        ...data,
        compliance_score: fulfilled + "/5",
        risk_level: risk,
        total_requirements: total,
        fulfilled_requirements: fulfilled,
        missing_requirements: total - fulfilled,
        issues,
        recommendations,
        date_generated: new Date().toISOString().split("T")[0]
    };
}

/* DISPLAY REPORT */
function displayReport(r){

    let riskClass =
        r.risk_level==="Low Risk" ? "good" :
        r.risk_level==="Medium Risk" ? "medium" :
        "bad";

    let html = `
    <div class="report-box">

    <div class="section">
        <h3>Business Overview</h3>
        <p><b>${r.business_name}</b> (${r.business_id})</p>
        <p>State: ${r.state} | Sector: ${r.sector}</p>
    </div>

    <div class="section">
        <h3>Compliance Score</h3>
        <p class="${riskClass}">
            ${r.compliance_score} — ${r.risk_level}
        </p>
    </div>

    <div class="section">
        <h3>Regulatory Issues</h3>
        <ul>
            ${r.issues.map(i => `<li class="bad">${i}</li>`).join("")}
        </ul>
    </div>

    <div class="section">
        <h3>Recommendations</h3>
        <ul>
            ${r.recommendations.map(i => `<li class="good">${i}</li>`).join("")}
        </ul>
    </div>

    </div>
    `;

    document.getElementById("reportContent").innerHTML = html;
    document.getElementById("reportSection").classList.remove("hidden");
}

/* DOWNLOAD CSV */
function downloadCSV(){
    if(!currentReport) return;

    let headers = Object.keys(currentReport).join(",");
    let values = Object.values(currentReport).map(v =>
        Array.isArray(v) ? `"${v.join("; ")}"` : v
    ).join(",");

    let blob = new Blob([headers + "\n" + values], {type:"text/csv"});
    let a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "report.csv";
    a.click();
}
