const API_BASE = API_BASE_URL + "/api";

function getToken() {
    return localStorage.getItem("rescueMe_token") || localStorage.getItem("token");
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

let currentPatientId = null;
let currentPatientName = '';
let currentPatients = [];

async function getPatients() {
    const token = getToken();
    try {
        const res = await fetch(`${API_BASE}/veterinary/patients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.error(err);
    }
    return [];
}

async function getAppointments() {
    const token = getToken();
    try {
        const res = await fetch(`${API_BASE}/veterinary/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.error(err);
    }
    return [];
}

async function renderVeterinaryDashboard() {
    const patients = await getPatients();
    currentPatients = patients; // cache for modals

    let criticalCount = patients.filter(p => p.status === 'Critical').length;
    let treatmentCount = patients.filter(p => p.status === 'Stable' || p.status === 'Critical' || p.status === 'In Treatment').length;
    
    let statCrit = document.getElementById('statCritical');
    if (statCrit) statCrit.textContent = criticalCount;
    
    let statTreat = document.getElementById('statPatients');
    if (statTreat) statTreat.textContent = treatmentCount;
    
    const patientsGrid = document.getElementById('patientsList');
    if (patientsGrid) {
        patientsGrid.innerHTML = '';
        if (patients.length === 0) {
            patientsGrid.innerHTML = '<div style="padding:16px;text-align:center;color:#64748b;">No patients currently in system.</div>';
        } else {
            patients.forEach(p => {
                let tagClass = p.status === 'Stable' ? 'tag-confirmed' : p.status === 'Critical' ? 'tag-pending' : 'tag-open';
                let dotClass = p.status === 'Stable' ? 'dot-green' : p.status === 'Critical' ? 'dot-orange' : 'dot-blue';
                patientsGrid.innerHTML += `
                    <div class="activity-item">
                        <div class="activity-dot ${dotClass}"></div>
                        <div class="activity-text">
                            <div><strong>${escapeHtml(p.name)}</strong> — ${escapeHtml(p.breed)} <span style="font-size:.75rem;color:#94a3b8;">• ID: ${escapeHtml(p.id)}</span></div>
                            <div class="activity-time">Owner: ${escapeHtml(p.owner)} · ${escapeHtml(p.status)}</div>
                        </div>
                        <span class="event-tag ${tagClass}">${escapeHtml(p.status)}</span>
                        <button style="padding:4px 10px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;font-size:.72rem;font-weight:600;color:#475569;cursor:pointer;margin-left:6px;" onclick="openViewPatientModal('${escapeHtml(p.id)}')">View</button>
                        <button style="padding:4px 10px;border-radius:6px;border:none;background:#2563eb;font-size:.72rem;font-weight:600;color:#fff;cursor:pointer;margin-left:4px;" onclick="openUpdateModal('${escapeHtml(p.id)}', '${escapeHtml(p.name)}')">Update</button>
                    </div>
                `;
            });
        }
    }

    renderAppointments();
    renderMedicalReports(patients);
}

async function renderAppointments() {
    const appointments = await getAppointments();
    const tasksGrid = document.getElementById('appointmentsList');
    if (!tasksGrid) return;
    
    tasksGrid.innerHTML = '';
    if (appointments.length === 0) {
        tasksGrid.innerHTML = '<div style="padding:16px;text-align:center;color:#64748b;">No upcoming appointments.</div>';
    } else {
        appointments.forEach(app => {
            const dateObj = new Date(app.date);
            const safeDate = dateObj.toDateString();
            const parts = safeDate.split(' ');
            const day = parts[2] || '';
            const mon = parts[1] || '';
            
            tasksGrid.innerHTML += `
                <div class="activity-item">
                    <div class="event-date-box" style="min-width:40px;text-align:center;">
                        <span class="day">${escapeHtml(day)}</span><span class="mon">${escapeHtml(mon)}</span>
                    </div>
                    <div class="activity-text">
                        <div><strong>${escapeHtml(app.patient)}</strong> — ${escapeHtml(app.reason)}</div>
                        <div class="activity-time">Upcoming</div>
                    </div>
                    <span class="event-tag tag-open">Upcoming</span>
                    <button style="padding:4px 10px;border-radius:6px;border:none;background:#ef4444;font-size:.72rem;font-weight:600;color:#fff;cursor:pointer;margin-left:6px;" onclick="deleteAppointment('${app.id}')">Cancel</button>
                </div>
            `;
        });
    }
}

window.deleteAppointment = async function(id) {
    const token = getToken();
    try {
        const res = await fetch(`${API_BASE}/veterinary/appointments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            if(typeof showToast === 'function') showToast('Appointment cancelled.', 'success');
            renderAppointments();
        }
    } catch(err) {
        console.error(err);
    }
};

function renderMedicalReports(patients) {
    const reportsGrid = document.getElementById('reportsList');
    if (!reportsGrid) return;
    reportsGrid.innerHTML = '';
    const hasReports = patients.filter(p => p.status === 'Stable' || p.status === 'Critical' || p.status === 'In Treatment');
    if (hasReports.length === 0) {
        reportsGrid.innerHTML = '<div style="padding:16px;text-align:center;color:#64748b;">No recent medical activity.</div>';
    } else {
        hasReports.forEach(p => {
             let icon = p.status === 'Stable' ? '✅' : p.status === 'Critical' ? '⚠️' : '📄';
             let note = p.status === 'Stable' ? 'All clear' : p.status === 'Critical' ? 'Under observation' : 'Progressing';
             let dotClass = p.status === 'Stable' ? 'dot-green' : p.status === 'Critical' ? 'dot-orange' : 'dot-blue';
             reportsGrid.innerHTML += `
                <div class="activity-item">
                    <div class="activity-dot ${dotClass}"></div>
                    <div class="activity-text">
                        <div><strong>${escapeHtml(p.name)}</strong> — Health Status Event</div>
                        <div class="activity-time">Last update · ${note}</div>
                    </div>
                    <span class="activity-timestamp">${icon}</span>
                </div>
            `;
        });
    }
}

window.openUpdateModal = function (id, name) {
    currentPatientId = id;
    currentPatientName = name;
    const desc = document.getElementById('updateModalDesc');
    if (desc) desc.textContent = `Select the new status for ${name}.`;
    
    const p = currentPatients.find(r => r.id == id);
    if (p) {
        const select = document.getElementById('statusSelect');
        if (select) select.value = p.status;
    }
    const modal = document.getElementById('updateModal');
    if (!modal) return;
    
    const extraFields = document.getElementById('stableExtraFields');
    if (extraFields) {
        extraFields.style.display = (p && p.status === 'Stable') ? 'block' : 'none';
    }

    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('show');
}

window.closeUpdateModal = function () {
    const modal = document.getElementById('updateModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        currentPatientId = null;
    }, 300);
}

window.openNewAppointmentModal = function () {
    const modal = document.getElementById('appointmentModal');
    if (!modal) return;
    
    // populate select
    const pInput = document.getElementById('appPatientStr');
    if (pInput) {
        pInput.innerHTML = '<option value="">Select a Patient</option>';
        currentPatients.forEach(p => {
            pInput.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)} - ID: ${p.id}</option>`;
        });
    }

    const rInput = document.getElementById('appReasonStr');
    if (rInput) rInput.value = '';
    const dInput = document.getElementById('appDateStr');
    if (dInput) dInput.value = '';
    
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('show');
}

window.closeAppointmentModal = function () {
    const modal = document.getElementById('appointmentModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

window.openViewPatientModal = function (id) {
    const p = currentPatients.find(e => e.id == id);
    if (!p) return;
    const modal = document.getElementById('viewPatientModal');
    if (!modal) return;
    
    const imgObj = document.getElementById('viewPatientImg');
    if (imgObj) imgObj.src = p.image || '';
    
    document.getElementById('viewPatientName').textContent = p.name;
    document.getElementById('viewPatientBreed').textContent = p.breed;
    document.getElementById('viewPatientId').textContent = p.id;
    document.getElementById('viewPatientStatus').textContent = p.status;
    document.getElementById('viewPatientOwner').textContent = p.owner;
    
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('show');
}

window.closeViewPatientModal = function () {
    const modal = document.getElementById('viewPatientModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

window.openViewAllPatientsModal = function () {
    const modal = document.getElementById('viewAllPatientsModal');
    const grid = document.getElementById('allPatientsGrid');
    if (!modal || !grid) return;
    grid.innerHTML = '';
    
    currentPatients.forEach(p => {
        const card = document.createElement('div');
        card.style.background = 'var(--base-clr)';
        card.style.border = '1px solid var(--line-clr)';
        card.style.borderRadius = '12px';
        card.style.padding = '16px';
        card.style.textAlign = 'center';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        let statusColor = p.status === 'Stable' ? '#10b981' : p.status === 'Critical' ? '#f59e0b' : '#3b82f6';
        card.innerHTML = `
            <img src="${escapeHtml(p.image || '')}" alt="${escapeHtml(p.name)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px;">
            <h4 style="margin:0;font-size:1.1rem;color:var(--text-clr);">${escapeHtml(p.name)}</h4>
            <div style="font-size:0.8rem;color:var(--secondary-text-clr);margin-bottom:8px;">${escapeHtml(p.breed)}</div>
            <div style="font-size:0.8rem;font-weight:600;padding:4px 10px;border-radius:20px;background:var(--input-color);color:${statusColor};">${escapeHtml(p.status)}</div>
        `;
        grid.appendChild(card);
    });
    
    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('show');
}

window.closeViewAllPatientsModal = function () {
    const modal = document.getElementById('viewAllPatientsModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function initVeterinary() {
    renderVeterinaryDashboard();

    const updateForm = document.getElementById('updateForm');
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            const extraFields = document.getElementById('stableExtraFields');
            if (extraFields) {
                extraFields.style.display = e.target.value === 'Stable' ? 'block' : 'none';
            }
        });
    }

    if (updateForm) {
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentPatientId) return;
            const newStatus = document.getElementById('statusSelect').value;
            const token = getToken();

            let age = null;
            let gender = null;
            if (newStatus === 'Stable') {
                const ageInput = document.getElementById('updateAge');
                const genderSelect = document.getElementById('updateGender');
                if (ageInput && ageInput.value) age = parseFloat(ageInput.value);
                if (genderSelect) gender = genderSelect.value;
            }

            try {
                const res = await fetch(`${API_BASE}/veterinary/patients/${currentPatientId}/status`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ status: newStatus, age, gender })
                });

                if (res.ok) {
                    if (typeof showToast === 'function') {
                        showToast(`Record updated for ${currentPatientName} to ${newStatus}`, 'success');
                    } else {
                        alert(`Record updated for ${currentPatientName} to ${newStatus}`);
                    }
                    renderVeterinaryDashboard();
                    closeUpdateModal();
                } else {
                    const data = await res.json();
                    if(typeof showToast === 'function') showToast(data.error || "Failed to update", "error");
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    document.querySelectorAll('.panel-action').forEach(btn => {
        if (btn.textContent.includes('View all')) btn.addEventListener('click', openViewAllPatientsModal);
        if (btn.textContent.includes('New')) btn.addEventListener('click', openNewAppointmentModal);
        if (btn.textContent.includes('Export')) btn.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(currentPatients)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'medical_reports.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (typeof showToast === 'function') showToast('Reports exported successfully!', 'success');
        });
    });

    const appForm = document.getElementById('appointmentForm');
    if (appForm) {
        appForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reportId = document.getElementById('appPatientStr').value;
            const reason = document.getElementById('appReasonStr').value;
            const dateStr = document.getElementById('appDateStr').value;
            const token = getToken();

            if (!reportId) {
                if(typeof showToast === 'function') showToast('Please select a patient.', 'error');
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/veterinary/appointments`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ report_id: reportId, reason, date: dateStr })
                });

                if (res.ok) {
                    if (typeof showToast === 'function') showToast('Appointment added!', 'success');
                    renderAppointments();
                    closeAppointmentModal();
                } else {
                    const data = await res.json();
                    if(typeof showToast === 'function') showToast(data.error || "Failed to add", "error");
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initVeterinary);