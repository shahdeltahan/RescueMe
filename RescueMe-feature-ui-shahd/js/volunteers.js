document.addEventListener("DOMContentLoaded", () => {
    const myCasesContainer = document.getElementById("myCasesContainer");
    const noCasesMsg = document.getElementById("no-cases-msg");

    // Load from local storage
    const acceptedCases = JSON.parse(localStorage.getItem('acceptedCases')) || [];

    if (acceptedCases.length > 0) {
        noCasesMsg.style.display = "none";
    }

    acceptedCases.forEach(animal => {
        const card = document.createElement("div");
        card.classList.add("card");

        // The card shows the animal details, plus an update status dropdown
        card.innerHTML = `
            <img src="${animal.image}" alt="${animal.name}">
            <div class="card-content">
                <h3>${animal.name}</h3>
                
                <p style="margin-bottom: 10px; color: var(--secondary-text-clr); font-size: 14px;">
                    Original Issue: <span class="status ${animal.status}" style="padding:2px 8px; border-radius:5px; font-size: 12px; margin-left: 5px;">${animal.status}</span>
                </p>

                <div style="margin-top: 15px;">
                    <label style="font-size: 14px; color: var(--text-clr);">Current Progress:</label>
                    <select class="status-updater" data-id="${animal.id}" style="width: 100%; margin-top: 5px;">
                        <option value="in-progress" ${animal.progressStatus === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="in-treatment" ${animal.progressStatus === 'in-treatment' ? 'selected' : ''}>In Treatment</option>
                        <option value="stable" ${animal.progressStatus === 'stable' ? 'selected' : ''}>Stable / Good Condition</option>
                        <option value="closed" ${animal.progressStatus === 'closed' ? 'selected' : ''}>Closed / Resolved</option>
                    </select>
                </div>
            </div>
        `;

        myCasesContainer.appendChild(card);
    });

    // Add event listeners tracking
    document.querySelectorAll('.status-updater').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            const newVal = e.target.value;
            
            let acceptedCases = JSON.parse(localStorage.getItem('acceptedCases')) || [];
            const index = acceptedCases.findIndex(c => c.id === id);
            
            if (index > -1) {
                if (newVal === 'closed') {
                    acceptedCases.splice(index, 1);
                    localStorage.setItem('acceptedCases', JSON.stringify(acceptedCases));
                    
                    const card = e.target.closest('.card');
                    if (card) card.remove();
                    
                    const noCasesMsg = document.getElementById("no-cases-msg");
                    if (acceptedCases.length === 0 && noCasesMsg) {
                        noCasesMsg.style.display = "block";
                    }
                } else {
                    acceptedCases[index].progressStatus = newVal;
                    localStorage.setItem('acceptedCases', JSON.stringify(acceptedCases));
                    
                    // Show tiny visual feedback
                    const label = e.target.previousElementSibling;
                    const originalText = "Current Progress:";
                    label.textContent = "Saved ✅";
                    label.style.color = "var(--accent-clr)";
                    setTimeout(() => {
                        label.textContent = originalText;
                        label.style.color = "var(--text-clr)";
                    }, 1500);
                }
            }
        });
    });
});

/* ================ VOLUNTEERS PAGE ================ */

function toggleTask(checkEl) {
    const taskItem = checkEl.closest('.task-item');
    const textEl   = taskItem ? taskItem.querySelector('.task-text') : null;
    const isDone   = checkEl.classList.toggle('done');

    if (isDone) {
        checkEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;
        if (textEl) textEl.classList.add('done-text');
    } else {
        checkEl.innerHTML = '';
        if (textEl) textEl.classList.remove('done-text');
    }
}

function initVolunteersExport() {
    document.querySelectorAll('.panel-action').forEach(btn => {
        if (btn.textContent.trim() === 'Export →') {
            btn.addEventListener('click', () => showToast('Activity history exported!', 'success'));
        }
        if (btn.textContent.trim() === '+ Add task') {
            btn.addEventListener('click', openAddTaskModal);
        }
    });
}

function openAddTaskModal() {
    const taskText = prompt('Enter new task:');
    if (!taskText?.trim()) return;

    const priorityChoice = prompt('Priority? (High / Med / Low)', 'Med');
    const priority = ['High', 'Med', 'Low'].includes(priorityChoice) ? priorityChoice : 'Med';
    const priClass = { High: 'pri-high', Med: 'pri-med', Low: 'pri-low' }[priority];

    const taskList = document.querySelector('.task-list');
    if (!taskList) return;

    const item = document.createElement('div');
    item.className = 'task-item';
    item.innerHTML = `
        <div class="task-check" onclick="toggleTask(this)"></div>
        <span class="task-text">${escapeHtml(taskText.trim())}</span>
        <span class="task-priority ${priClass}">${priority}</span>`;
    taskList.appendChild(item);
    showToast('Task added!', 'success');
}