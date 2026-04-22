const GEMINI_MODEL = 'gemini-2.0-flash';

// State
let selectedFWs = new Set(['ndpa']);
let evStatus = {};

const OBLIGATIONS = [
    {key:'lawful_basis', label:'Lawful basis documented', fw:'NDPA §2', fwKeys:['ndpa']},
    {key:'dpo', label:'DPO appointed', fw:'NDPA §30', fwKeys:['ndpa']},
    {key:'localisation', label:'Data Localisation compliance', fw:'NITDA Code', fwKeys:['nitda']}
];

// Navigation
function goTo(step) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.step-tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(`panel${step}`).classList.add('active');
    document.getElementById(`stab${step}`).classList.add('active');

    if (step === 3) renderEvidence();
}

function toggleFW(el) {
    const fw = el.dataset.fw;
    if (selectedFWs.has(fw)) {
        selectedFWs.delete(fw);
        el.classList.remove('sel');
    } else {
        selectedFWs.add(fw);
        el.classList.add('sel');
    }
}

function renderEvidence() {
    const container = document.getElementById('evidenceRows');
    container.innerHTML = '<h3>Assess Controls</h3>';
    
    const filtered = OBLIGATIONS.filter(o => o.fwKeys.some(k => selectedFWs.has(k)));
    
    filtered.forEach(o => {
        const div = document.createElement('div');
        div.style.marginBottom = "15px";
        div.innerHTML = `
            <p><strong>${o.label}</strong></p>
            <select onchange="evStatus['${o.key}'] = this.value" style="width:100%; padding:5px;">
                <option value="none">Select Status...</option>
                <option value="compliant">Compliant</option>
                <option value="gap">Non-Compliant</option>
            </select>
        `;
        container.appendChild(div);
    });
}

// Modal Logic
function openKeyModal() { document.getElementById('keyOverlay').style.display = 'flex'; }
function closeKeyModal() { document.getElementById('keyOverlay').style.display = 'none'; }
function saveKey() {
    const key = document.getElementById('keyInput').value;
    localStorage.setItem('gemini_api_key', key);
    closeKeyModal();
}

// AI Analysis
async function runAnalysis() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return openKeyModal();

    goTo(4);
    const area = document.getElementById('reportArea');
    area.innerHTML = "Generating Nigerian Regulatory Report...";

    const prompt = `Analyze this Nigerian org: ${document.getElementById('orgName').value}. 
    Description: ${document.getElementById('orgDesc').value}. 
    Gaps: ${JSON.stringify(evStatus)}. 
    Provide remediation steps based on NDPA 2023.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        area.innerHTML = `<div class="card">${data.candidates[0].content.parts[0].text}</div>`;
    } catch (e) {
        area.innerHTML = "Error: Check your API Key and internet connection.";
    }
}
