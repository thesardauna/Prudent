// --- MOCK REGULATORY DATA ENGINE ---
const extractedObligations = [
    { 
        domain: "Data Localisation", 
        extractedText: "All primary backups are stored on AWS eu-west-1 (Ireland).",
        rules: { 
            nitda: { status: "fail", clause: "NITDA Code Sec 4.1: Must store data within Nigeria." },
            ndpc: { status: "pass", clause: "NDPA Art 24: Cross-border transfer permitted with safeguards." },
            cbn: { status: "fail", clause: "CBN AML/CFT: Financial data must remain domestic." }
        }
    },
    { 
        domain: "DPO Appointment", 
        extractedText: "Jane Doe is appointed as Chief Privacy Officer and registered with NDPC.",
        rules: { 
            nitda: { status: "pass", clause: "NITDA Sec 2.1: Officer designated." },
            ndpc: { status: "pass", clause: "NDPA Art 32: DPO formally registered." },
            cbn: { status: "gap", clause: "CBN: Requires separate compliance officer notification." }
        }
    }
];

// --- UI CONTROLLERS ---
let isSupTech = false;

function toggleView() {
    isSupTech = !isSupTech;
    document.getElementById('org-view').classList.toggle('hidden');
    document.getElementById('suptech-view').classList.toggle('hidden');
    
    const btn = document.getElementById('view-toggle');
    btn.innerText = isSupTech ? "Switch to Org View" : "Switch to Regulator (SupTech) View";
    btn.style.background = isSupTech ? "#334155" : "#0F6E56";
}

// --- SIMULATED PIPELINE ---
const terminal = document.getElementById('terminal');

function logTerminal(message, type) {
    const el = document.createElement('div');
    el.className = `log ${type}`;
    el.innerText = `> ${message}`;
    terminal.appendChild(el);
    terminal.scrollTop = terminal.scrollHeight;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

document.getElementById('drop-zone').addEventListener('click', async () => {
    terminal.innerHTML = '';
    document.getElementById('matrix-body').innerHTML = `<tr><td colspan="5" style="text-align:center;">Processing...</td></tr>`;
    
    logTerminal("Initiating File Ingestion: Data_Privacy_Policy.pdf", "system");
    await sleep(600);
    
    logTerminal("Running Unstructured.io parser... Tables & text extracted.", "system");
    await sleep(800);
    
    logTerminal("[LegalBERT] Semantic extraction initiated.", "ai");
    await sleep(700);
    logTerminal("[LegalBERT] Found 14 compliance-relevant clauses. Mapping to domains.", "ai");
    await sleep(900);
    
    logTerminal("[OPA Engine] Executing continuous compliance ruleset v1.2...", "rule");
    await sleep(800);
    logTerminal("[OPA Engine] Rule evaluation complete. Deterministic outputs generated.", "rule");
    
    renderMatrix();
});

function getBadge(status) {
    if (status === 'pass') return `<span class="badge pass">PASS</span>`;
    if (status === 'fail') return `<span class="badge fail">FAIL</span>`;
    return `<span class="badge gap">GAP</span>`;
}

function renderMatrix() {
    const tbody = document.getElementById('matrix-body');
    tbody.innerHTML = '';
    
    extractedObligations.forEach((item, index) => {
        // Calculate overall domain status
        const statuses = Object.values(item.rules).map(r => r.status);
        const overall = statuses.includes('fail') ? 'fail' : (statuses.includes('gap') ? 'gap' : 'pass');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.domain}</strong></td>
            <td>${getBadge(item.rules.nitda.status)}</td>
            <td>${getBadge(item.rules.ndpc.status)}</td>
            <td>${getBadge(item.rules.cbn.status)}</td>
            <td><button class="btn-outline" onclick="openModal(${index})">View Reason</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- MODAL LOGIC ---
function openModal(index) {
    const data = extractedObligations[index];
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div style="background:#F1F5F9; padding:1rem; border-radius:6px; margin-bottom:1rem;">
            <p style="font-size:0.8rem; color:#64748B; margin:0 0 0.5rem 0;">EXTRACTED EVIDENCE (POLICY TEXT)</p>
            <p style="margin:0; font-family:monospace; color:#0F172A;">"${data.extractedText}"</p>
        </div>
        <h4>Rule Evaluations:</h4>
        <ul style="line-height:1.8; color:#334155;">
            <li><strong>NITDA:</strong> ${data.rules.nitda.clause}</li>
            <li><strong>NDPC:</strong> ${data.rules.ndpc.clause}</li>
            <li><strong>CBN:</strong> ${data.rules.cbn.clause}</li>
        </ul>
    `;
    
    document.getElementById('evidence-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('evidence-modal').classList.add('hidden');
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('evidence-modal');
    if (event.target == modal) closeModal();
}
