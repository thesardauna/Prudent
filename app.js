const GEMINI_MODEL = 'gemini-2.0-flash';
const API_KEY_KEY = 'prudent_gemini_key';

// Data Registry
const selectedFWs = new Set(['ndpa']);
let evStatus = {};

const ALL_OBLIGATIONS = [
    {key:'lawful_basis', label:'Lawful basis documented', fw:'NDPA 2023 §2', risk:'High', fwKeys:['ndpa']},
    {key:'dpia', label:'DPIA conducted', fw:'GAID 2025 §12', risk:'High', fwKeys:['gaid']},
    {key:'data_localisation', label:'Data localisation compliance', fw:'NITDA Code §5', risk:'High', fwKeys:['nitda']}
];

// Navigation
function goTo(step) {
    document.querySelectorAll('.panel, .step-tab, .chain-node').forEach(el => el.classList.remove('active'));
    document.getElementById(`panel${step}`).classList.add('active');
    document.getElementById(`stab${step}`).classList.add('active');
    document.getElementById(`cn${step}`).classList.add('active');

    if (step === 3) renderEvidence();
}

// Framework Selection
function toggleFW(card) {
    const fw = card.dataset.fw;
    selectedFWs.has(fw) ? selectedFWs.delete(fw) : selectedFWs.add(fw);
    card.classList.toggle('sel');
}

// Render Compliance Rows
function renderEvidence() {
    const container = document.getElementById('evidenceRows');
    container.innerHTML = '<h3>Assess Controls</h3>';
    
    ALL_OBLIGATIONS.filter(o => o.fwKeys.some(k => selectedFWs.has(k))).forEach(o => {
        const div = document.createElement('div');
        div.className = 'ev-row';
        div.innerHTML = `
            <p><strong>${o.label}</strong> (${o.fw})</p>
            <button onclick="setEv('${o.key}', 'c')">Compliant</button>
            <button onclick="setEv('${o.key}', 'n')">Non-Compliant</button>
        `;
        container.appendChild(div);
    });
}

function setEv(key, status) {
    evStatus[key] = status;
}

// Gemini Integration
async function runAnalysis() {
    goTo(4);
    const area = document.getElementById('reportArea');
    area.innerHTML = "Consulting Gemini AI for Nigerian Regulatory insights...";

    const prompt = `Perform a gap analysis for a Nigerian organization based on these compliance statuses: ${JSON.stringify(evStatus)}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${localStorage.getItem(API_KEY_KEY)}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        area.innerHTML = data.candidates[0].content.parts[0].text;
    } catch (e) {
        area.innerHTML = "Error: Please ensure your API Key is set correctly.";
    }
}
