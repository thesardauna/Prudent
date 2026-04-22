let selectedFWs = new Set(['ndpa']);

const OBLIGATIONS = [
    {key:'lawful', label:'Lawful basis documented', fw:'NDPA §2', fwKeys:['ndpa']},
    {key:'dpia', label:'DPIA Conducted', fw:'GAID §12', fwKeys:['gaid']},
    {key:'storage', label:'Local Data Hosting', fw:'NITDA §5', fwKeys:['nitda']}
];

function goTo(step) {
    document.querySelectorAll('.panel, .step-tab, .chain-node').forEach(el => el.classList.remove('active'));
    document.getElementById(`panel${step}`)?.classList.add('active');
    document.getElementById(`stab${step}`)?.classList.add('active');
    document.getElementById(`cn${step}`)?.classList.add('active');
    if (step === 3) renderEvidence();
}

function toggleFW(el) {
    const fw = el.dataset.fw;
    selectedFWs.has(fw) ? selectedFWs.delete(fw) : selectedFWs.add(fw);
    el.classList.toggle('sel');
    document.getElementById('fwCount').innerText = `${selectedFWs.size} Active`;
}

function renderEvidence() {
    const container = document.getElementById('evidenceRows');
    container.innerHTML = '<h3>Evidence Control Status</h3>';
    const active = OBLIGATIONS.filter(o => o.fwKeys.some(k => selectedFWs.has(k)));
    
    active.forEach(o => {
        const row = document.createElement('div');
        row.style.padding = "15px 0";
        row.innerHTML = `
            <strong>${o.label} (${o.fw})</strong>
            <select onchange="window.evStatus['${o.key}'] = this.value" style="width:100%; padding:8px; margin-top:5px;">
                <option>Select...</option><option value="yes">Compliant</option><option value="no">Gap</option>
            </select>`;
        container.appendChild(row);
    });
}

window.evStatus = {};

function openKeyModal() { document.getElementById('keyOverlay').style.display = 'flex'; }
function closeKeyModal() { document.getElementById('keyOverlay').style.display = 'none'; }
function saveKey() {
    localStorage.setItem('gemini_key', document.getElementById('keyInput').value);
    closeKeyModal();
}

async function runAnalysis() {
    const key = localStorage.getItem('gemini_key');
    if(!key) return openKeyModal();
    goTo(4);
    document.getElementById('reportArea').innerHTML = "AI is generating report...";
    
    // API Fetch logic... (as provided in previous step)
}
