/* ================ VETERINARY PAGE ================ */

function initVeterinary() {
    document.querySelectorAll('.activity-item button').forEach(btn => {
        if (btn.textContent.trim() === 'View') {
            btn.addEventListener('click', () => {
                const name = btn.closest('.activity-item').querySelector('strong')?.textContent || 'Patient';
                showToast(`Viewing record for ${name}`, 'info');
            });
        }
        if (btn.textContent.trim() === 'Update') {
            btn.addEventListener('click', () => {
                const name = btn.closest('.activity-item').querySelector('strong')?.textContent || 'Patient';
                showToast(`Record updated for ${name}`, 'success');
            });
        }
    });

    document.querySelectorAll('.panel-action').forEach(btn => {
        if (btn.textContent.includes('New'))    btn.addEventListener('click', openNewAppointmentModal);
        if (btn.textContent.includes('Export')) btn.addEventListener('click', () => showToast('Reports exported!', 'success'));
    });
}

function openNewAppointmentModal() {
    const patient = prompt('Patient name:');
    if (!patient?.trim()) return;
    const reason  = prompt('Reason for appointment:', 'Checkup') || 'Checkup';
    const dateStr = prompt('Date (e.g. 30 Mar):', '30 Mar')     || '30 Mar';

    const taskList = document.querySelector('.task-list');
    if (!taskList) return;

    const [day, mon] = dateStr.split(' ');
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div class="event-date-box" style="min-width:40px;text-align:center;">
            <span class="day">${escapeHtml(day)}</span>
            <span class="mon">${escapeHtml(mon || '')}</span>
        </div>
        <div class="activity-text">
            <div><strong>${escapeHtml(patient.trim())}</strong> — ${escapeHtml(reason.trim())}</div>
            <div class="activity-time">Dr. Youssef</div>
        </div>
        <span class="event-tag tag-open">Upcoming</span>`;
    taskList.appendChild(item);
    showToast('Appointment added!', 'success');
}