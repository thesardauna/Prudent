function checkCompliance() {
  const type = document.getElementById("businessType").value.toLowerCase();
  const location = document.getElementById("location").value;
  const size = document.getElementById("size").value;

  let requirements = [
    "CAC Registration",
    "Tax Identification Number (TIN)"
  ];

  if (type.includes("food") || type.includes("farm")) {
    requirements.push("NAFDAC Registration");
  }

  let missing = [];
  let score = 100;

  // Simulate missing items
  if (type === "") {
    missing = requirements;
    score = 40;
  } else {
    missing = requirements.slice(1);
    score = 70;
  }

  let colorClass = "green";
  if (score < 80) colorClass = "yellow";
  if (score < 50) colorClass = "red";

  const resultDiv = document.getElementById("result");
  resultDiv.classList.remove("hidden");

  resultDiv.innerHTML = `
    <h3>Compliance Result</h3>
    <p><strong>Business:</strong> ${type}</p>
    <p><strong>Location:</strong> ${location}</p>

    <p><strong>Required:</strong></p>
    <ul>${requirements.map(r => `<li>${r}</li>`).join("")}</ul>

    <p><strong>Missing:</strong></p>
    <ul>${missing.map(m => `<li>${m}</li>`).join("")}</ul>

    <p class="${colorClass}"><strong>Risk Score: ${score}%</strong></p>
  `;
}
