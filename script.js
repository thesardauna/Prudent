let currentReport = null;

document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();

    let data = getFormData();
    currentReport = generateReport(data);
    displayReport(currentReport);
});

/* GET DATA */
function getFormData() {
    return {
        business_id: val("business_id"),
        business_name: val("business_name"),
        type: val("type"),
        sector: val("sector"),
        location: val("location"),
        state: val("state"),
        lga: val("lga"),
        size: val("size"),
        year_established: val("year_established"),
        has_cac: val("has_cac"),
        has_tin: val("has_tin"),
        has_vat: val("has_vat"),
        has_nafdac: val("has_nafdac"),
        has_permit: val("has_permit"),
        last_compliance_check: val("last_compliance_check")
    };
}

function val(id) {
    return document.getElementById(id).value;
}

/* GENERATE REPORT */
function generateReport(data) {
    let report_id = "RPT-" + Date.now();

    let total = 5;
    let fulfilled = 0;
    let recommendations = [];

    if (data.has_cac === "Yes") fulfilled++; else recommendations.push("Register with CAC");
    if (data.has_tin === "Yes") fulfilled++; else recommendations.push("Get TIN");
    if (data.has_vat === "Yes") fulfilled++; else recommendations.push("Register VAT");
    if (data.has_nafdac === "Yes") fulfilled++; else recommendations.push("Obtain NAFDAC");
    if (data.has_permit === "Yes") fulfilled++; else recommendations.push("Get Permit");

    let risk =
        fulfilled >= 4 ? "Low Risk" :
        fulfilled >= 2 ? "Medium Risk" :
        "High Risk";

    return {
        report_id,
        business_id: data.business_id,
        business_name: data.business_name,
        compliance_score: fulfilled + "/5",
        risk_level: risk,
        total_requirements: total,
        fulfilled_requirements: fulfilled,
        missing_requirements: total - fulfilled,
        recommendations: recommendations.join("; "),
        status: fulfilled === 5 ? "Compliant" : "Pending Compliance",
        date_generated: new Date().toISOString().split("T")[0]
    };
}

/* DISPLAY */
function displayReport(report) {
    let html = `<div class="report-grid">`;

    for (let key in report) {
        html += `
        <div class="report-item">
            <strong>${key}</strong><br>${report[key]}
        </div>`;
    }

    html += `</div>`;

    document.getElementById("reportContent").innerHTML = html;
    document.getElementById("reportSection").classList.remove("hidden");
}

/* DOWNLOAD CSV */
function downloadCSV() {
    if (!currentReport) return;

    let headers = Object.keys(currentReport).join(",");
    let values = Object.values(currentReport).join(",");

    let csv = headers + "\n" + values;

    let blob = new Blob([csv], { type: "text/csv" });
    let link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "report.csv";
    link.click();
}
