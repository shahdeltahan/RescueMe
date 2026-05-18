const API_BASE = API_BASE_URL + "/api";

function getToken() {
    return localStorage.getItem("rescueMe_token") || localStorage.getItem("token");
}

document.addEventListener("DOMContentLoaded", () => {
    loadVolunteerDashboard();
    initVolunteersExport();
});

async function loadVolunteerDashboard() {
    const token = getToken();
    if (!token) {
        if(typeof showToast === 'function') showToast("Please log in as a volunteer.", "error");
        return;
    }

    try {
        const [casesRes, tasksRes] = await Promise.all([
            fetch(`${API_BASE}/volunteers/cases`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_BASE}/volunteers/tasks`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (casesRes.ok && tasksRes.ok) {
            const allCases = await casesRes.json();
            const tasks = await tasksRes.json();

            const activeCases = allCases.filter(c => c.completed_at === null);
            const historyCases = allCases.filter(c => c.completed_at !== null);

            renderActiveCases(activeCases);
            renderHistoryList(historyCases);
            renderTasks(tasks);

            updateCounters(activeCases.length, historyCases.length);
        } else {
            console.error("Failed to fetch dashboard data");
        }
    } catch (error) {
        console.error("Error loading volunteer dashboard:", error);
    }
}

function updateCounters(active, completed) {
    const activeEl = document.getElementById("activeTasksCount");
    if (activeEl) activeEl.textContent = active;

    const completedEl = document.getElementById("completedTasksCount");
    if (completedEl) completedEl.textContent = completed;
}

function renderActiveCases(cases) {
    const myCasesContainer = document.getElementById("myCasesContainer");
    const noCasesMsg = document.getElementById("no-cases-msg");
    if (!myCasesContainer) return;

    myCasesContainer.innerHTML = '';
    
    if (cases.length > 0 && noCasesMsg) {
        noCasesMsg.style.display = "none";
    } else if (cases.length === 0 && noCasesMsg) {
        noCasesMsg.style.display = "block";
    }

    cases.forEach(c => {
        const card = document.createElement("div");
        card.classList.add("card");
        const statusClass = c.status_name ? c.status_name.toLowerCase().replace(/\s+/g, '-') : '';
        const img = c.image_url || "https://placehold.co/600x400/333333/888888?text=No+Photo";
        card.innerHTML = `
            <img src="${img}" alt="${c.animal_type || 'Unknown'}">
            <div class="card-content">
                <h3>${c.animal_type || 'Unknown Animal'}</h3>
                <p style="margin-bottom: 10px; color: var(--secondary-text-clr); font-size: 14px;">
                    Original Issue: <span class="status ${statusClass}" style="padding:2px 8px; border-radius:5px; font-size: 12px; margin-left: 5px;">${c.animal_condition || c.status_name || 'Unknown'}</span>
                </p>
                <div style="margin-top: 15px;">
                    <label style="font-size: 14px; color: var(--text-clr);">Current Progress:</label>
                    <select class="status-updater" data-assignment-id="${c.assignment_id}" data-report-id="${c.report_id}" style="width: 100%; margin-top: 5px;">
                        <option value="in-progress" ${c.progress_status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="in-treatment" ${c.progress_status === 'in-treatment' ? 'selected' : ''}>In Treatment</option>
                        <option value="stable" ${c.progress_status === 'stable' ? 'selected' : ''}>Stable / Good Condition</option>
                    </select>
                </div>
                ${c.vet_name ? `<p style="margin-top: 10px; font-size: 13px; color: #10b981; font-weight: 500;">👨‍⚕️ Assigned Vet: ${escapeHtml(c.vet_name)}</p>` : ''}
                <button 
                    class="close-case-btn" 
                    data-assignment-id="${c.assignment_id}" 
                    data-name="${c.animal_type || 'Case'}" 
                    style="
                        margin-top: 14px;
                        width: 100%;
                        padding: 9px 0;
                        border: none;
                        border-radius: 8px;
                        background: linear-gradient(135deg, #e53935, #b71c1c);
                        color: #fff;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        transition: opacity 0.2s, transform 0.15s;
                    "
                    onmouseover="this.style.opacity='0.85';this.style.transform='scale(0.98)'"
                    onmouseout="this.style.opacity='1';this.style.transform='scale(1)'"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                    </svg>
                    Close Case
                </button>
            </div>
        `;
        myCasesContainer.appendChild(card);
    });

    document.querySelectorAll('.status-updater').forEach(select => {
        select.addEventListener('change', async (e) => {
            const assignmentId = e.target.getAttribute('data-assignment-id');
            const newVal = e.target.value;
            const token = getToken();

            try {
                const res = await fetch(`${API_BASE}/volunteers/cases/${assignmentId}/progress`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ progressStatus: newVal })
                });

                if (res.ok) {
                    const label = e.target.previousElementSibling;
                    const originalText = "Current Progress:";
                    label.textContent = "Saved ✅";
                    label.style.color = "var(--accent-clr)";
                    setTimeout(() => {
                        label.textContent = originalText;
                        label.style.color = "var(--text-clr)";
                    }, 1500);

                    // If In Treatment, open Vet Assign modal
                    if (newVal === 'in-treatment') {
                        const reportId = e.target.getAttribute('data-report-id');
                        openAssignVetModal(reportId, assignmentId);
                    }

                } else {
                    const data = await res.json();
                    if(typeof showToast === 'function') showToast(data.error || "Failed to save", "error");
                }
            } catch (err) {
                console.error(err);
            }
        });
    });

    document.querySelectorAll('.close-case-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const assignmentId = btn.getAttribute('data-assignment-id');
            const name = btn.getAttribute('data-name');
            if (!confirm(`Close case "${name}"? This will remove it from your active cases.`)) return;
            
            const token = getToken();
            try {
                const res = await fetch(`${API_BASE}/volunteers/cases/${assignmentId}/close`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const cardEl = btn.closest('.card');
                    if (cardEl) {
                        cardEl.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                        cardEl.style.opacity = '0';
                        cardEl.style.transform = 'scale(0.92)';
                        setTimeout(() => {
                            cardEl.remove();
                            loadVolunteerDashboard(); // reload to refresh history and counts
                        }, 380);
                    }
                } else {
                    const data = await res.json();
                    if(typeof showToast === 'function') showToast(data.error || "Failed to close case", "error");
                }
            } catch (err) {
                console.error(err);
            }
        });
    });
}

function renderHistoryList(history) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    if (history.length === 0) {
        historyList.innerHTML = '<p style="padding:16px;color:var(--secondary-text-clr);font-size:13px;">No completed cases yet.</p>';
        return;
    }

    historyList.innerHTML = history.map(entry => {
        const dateStr = entry.completed_at ? new Date(entry.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date';
        return `
        <div class="activity-item">
            <div class="activity-dot dot-green"></div>
            <div class="activity-text">
                <div>Closed <strong>${entry.animal_type || 'Case'}</strong></div>
                <div class="activity-time">${dateStr} &middot; ${entry.location || 'Unknown location'}</div>
            </div>
            <span class="activity-timestamp">✅</span>
        </div>
        `;
    }).join('');
}

function renderTasks(tasks) {
    const taskList = document.querySelector('.task-list');
    if (!taskList) return;

    taskList.innerHTML = tasks.map(task => {
        const isDone = task.is_done ? 'done' : '';
        const doneText = task.is_done ? 'done-text' : '';
        const priClass = { High: 'pri-high', Med: 'pri-med', Low: 'pri-low' }[task.priority] || 'pri-med';
        const checkIcon = task.is_done ? `<svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>` : '';
        
        return `
        <div class="task-item" data-task-id="${task.task_id}">
            <div class="task-check ${isDone}" onclick="toggleTask(this)">${checkIcon}</div>
            <span class="task-text ${doneText}">${escapeHtml(task.task_text)}</span>
            <span class="task-priority ${priClass}">${task.priority}</span>
        </div>`;
    }).join('');
}

async function toggleTask(checkEl) {
    const taskItem = checkEl.closest('.task-item');
    const taskId = taskItem.getAttribute('data-task-id');
    const isDoneNow = !checkEl.classList.contains('done');
    const token = getToken();

    try {
        const res = await fetch(`${API_BASE}/volunteers/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isDone: isDoneNow })
        });

        if (res.ok) {
            const textEl = taskItem.querySelector('.task-text');
            if (isDoneNow) {
                checkEl.classList.add('done');
                checkEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;
                if (textEl) textEl.classList.add('done-text');
            } else {
                checkEl.classList.remove('done');
                checkEl.innerHTML = '';
                if (textEl) textEl.classList.remove('done-text');
            }
        }
    } catch (err) {
        console.error(err);
    }
}

function initVolunteersExport() {
    document.querySelectorAll('.panel-action').forEach(btn => {
        if (btn.textContent.trim() === 'Export →') {
            btn.addEventListener('click', () => {
                if(typeof showToast === 'function') showToast('Activity history exported!', 'success');
            });
        }
        if (btn.textContent.trim() === '+ Add task') {
            btn.addEventListener('click', openAddTaskModal);
        }
    });
}

async function openAddTaskModal() {
    const taskText = prompt('Enter new task:');
    if (!taskText?.trim()) return;
    const priorityChoice = prompt('Priority? (High / Med / Low)', 'Med');
    const priority = ['High', 'Med', 'Low'].includes(priorityChoice) ? priorityChoice : 'Med';
    
    const token = getToken();
    try {
        const res = await fetch(`${API_BASE}/volunteers/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: taskText.trim(), priority })
        });

        if (res.ok) {
            if(typeof showToast === 'function') showToast('Task added!', 'success');
            loadVolunteerDashboard();
        } else {
            const data = await res.json();
            if(typeof showToast === 'function') showToast(data.error || 'Failed to add task', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

async function openAssignVetModal(reportId, assignmentId) {
    const modal = document.getElementById('assignVetModal');
    if (!modal) return;
    
    document.getElementById('assignVetCaseId').value = reportId;
    document.getElementById('assignVetAssignmentId').value = assignmentId;
    
    const select = document.getElementById('assignVetSelect');
    select.innerHTML = '<option value="">Loading veterinarians...</option>';
    
    modal.hidden = false;
    modal.style.display = 'flex'; // Ensure visibility
    
    try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/volunteers/vets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const vets = await res.json();
            if (vets.length === 0) {
                select.innerHTML = '<option value="">No active veterinarians found</option>';
            } else {
                select.innerHTML = '<option value="">Select a Veterinarian</option>';
                vets.forEach(v => {
                    select.innerHTML += `<option value="${v.user_id}">${escapeHtml(v.full_name)} (${escapeHtml(v.email)})</option>`;
                });
            }
        }
    } catch (e) {
        console.error(e);
        select.innerHTML = '<option value="">Error loading vets</option>';
    }
}

function closeAssignVetModal() {
    const modal = document.getElementById('assignVetModal');
    if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const closeAssignVetBtn = document.getElementById('closeAssignVetModal');
    const cancelAssignVetBtn = document.getElementById('cancelAssignVetBtn');
    const confirmAssignVetBtn = document.getElementById('confirmAssignVetBtn');
    const modal = document.getElementById('assignVetModal');

    if (closeAssignVetBtn) closeAssignVetBtn.addEventListener('click', closeAssignVetModal);
    if (cancelAssignVetBtn) cancelAssignVetBtn.addEventListener('click', closeAssignVetModal);
    
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeAssignVetModal();
        });
    }

    if (confirmAssignVetBtn) {
        confirmAssignVetBtn.addEventListener('click', async () => {
            const reportId = document.getElementById('assignVetCaseId').value;
            const vetId = document.getElementById('assignVetSelect').value;
            
            if (!vetId) {
                if(typeof showToast === 'function') showToast("Please select a veterinarian", "error");
                return;
            }
            
            const token = getToken();
            try {
                const res = await fetch(`${API_BASE}/volunteers/cases/${reportId}/assignVet`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ vetId })
                });
                if (res.ok) {
                    if(typeof showToast === 'function') showToast("Veterinarian assigned successfully", "success");
                    closeAssignVetModal();
                    loadVolunteerDashboard();
                } else {
                    const data = await res.json();
                    if(typeof showToast === 'function') showToast(data.error || "Failed to assign vet", "error");
                }
            } catch (e) {
                console.error(e);
            }
        });
    }
});