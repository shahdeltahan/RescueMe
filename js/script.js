function initFormValidation() {
    const form                   = document.getElementById('form');
    const fullname_input         = document.getElementById('fullname-input');
    const email_input            = document.getElementById('email-input');
    const phone_input            = document.getElementById('phone-input');
    const password_input         = document.getElementById('password-input');
    const confirm_password_input = document.getElementById('confirm-password-input');
    const role_input             = document.getElementById('role-input');
    const error_message          = document.getElementById('error-message');

    if (!form || !email_input || !password_input) return;

    form.addEventListener('submit', e => {
        let errors = [];

        if (fullname_input) {
            errors = getSignupFormErrors(
                fullname_input.value,
                email_input.value,
                phone_input  ? phone_input.value  : '',
                password_input.value,
                confirm_password_input ? confirm_password_input.value : '',
                role_input   ? role_input.value   : ''
            );
        } else {
            errors = getLoginFormErrors(email_input.value, password_input.value);
        }

        if (errors.length > 0) {
            e.preventDefault();
            if (error_message) error_message.innerText = errors.join('. ');
        }
    });

    const allInputs = [
        fullname_input, email_input, phone_input,
        password_input, confirm_password_input, role_input
    ].filter(Boolean);

    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            input.parentElement.classList.remove('incorrect');
            if (error_message) error_message.innerText = '';
        });
    });
}

function getSignupFormErrors(fullname, email, phone, password, confirmPassword, role) {
    const errors = [];
    const fi = id => document.getElementById(id);

    if (!fullname) {
        errors.push('Full name is required');
        fi('fullname-input')?.parentElement.classList.add('incorrect');
    }
    if (!email) {
        errors.push('Email is required');
        fi('email-input')?.parentElement.classList.add('incorrect');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please enter a valid email address');
        fi('email-input')?.parentElement.classList.add('incorrect');
    }
    if (!phone) {
        errors.push('Phone number is required');
        fi('phone-input')?.parentElement.classList.add('incorrect');
    }
    if (!password) {
        errors.push('Password is required');
        fi('password-input')?.parentElement.classList.add('incorrect');
    } else if (password.length < 8) {
        errors.push('Password must have at least 8 characters');
        fi('password-input')?.parentElement.classList.add('incorrect');
    }
    if (!confirmPassword) {
        errors.push('Please confirm your password');
        fi('confirm-password-input')?.parentElement.classList.add('incorrect');
    } else if (password !== confirmPassword) {
        errors.push('Passwords do not match');
        fi('confirm-password-input')?.parentElement.classList.add('incorrect');
    }
    if (!role) {
        errors.push('Please select a role');
        fi('role-input')?.parentElement.classList.add('incorrect');
    }
    return errors;
}

function getLoginFormErrors(email, password) {
    const errors = [];
    const fi = id => document.getElementById(id);

    if (!email) {
        errors.push('Email is required');
        fi('email-input')?.parentElement.classList.add('incorrect');
    }
    if (!password) {
        errors.push('Password is required');
        fi('password-input')?.parentElement.classList.add('incorrect');
    }
    return errors;
}


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
    const priority = ['High','Med','Low'].includes(priorityChoice) ? priorityChoice : 'Med';
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


/* ================ VETERINARY PAGE ================*/

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


/* ================ DONATE PAGE ================ */
function selectAmount(btn, amount) {
    document.querySelectorAll('.panel button[onclick^="selectAmount"]').forEach(b => {
        b.style.border     = '1px solid var(--line-clr)';
        b.style.background = 'var(--base-clr)';
        b.style.color      = 'var(--text-clr)';
    });
    btn.style.border     = '2px solid var(--accent-clr)';
    btn.style.background = 'rgba(94,99,255,.12)';
    btn.style.color      = 'var(--accent-clr)';

    const customInput = document.getElementById('custom-amount');
    if (customInput) customInput.value = amount;
}

function selectCause(btn) {
    document.querySelectorAll('.panel button[onclick^="selectCause"]').forEach(b => {
        b.style.border     = '1px solid var(--line-clr)';
        b.style.background = 'var(--base-clr)';
        b.style.color      = 'var(--text-clr)';
    });
    btn.style.border     = '2px solid var(--accent-clr)';
    btn.style.background = 'rgba(94,99,255,.12)';
    btn.style.color      = 'var(--accent-clr)';
}

function initDonate() {
    const donateBtn = document.getElementById('donate-btn') || document.querySelector('.donate-btn');
    if (donateBtn) donateBtn.addEventListener('click', handleDonateSubmit);

    document.querySelectorAll('.panel-action').forEach(btn => {
        if (btn.textContent.includes('Full Report')) {
            btn.addEventListener('click', () => showToast('Full transparency report coming soon!', 'info'));
        }
    });
}

function handleDonateSubmit() {
    const amountInput = document.getElementById('custom-amount');
    const amount      = amountInput ? parseFloat(amountInput.value) : 0;

    if (!amount || amount <= 0) {
        showToast('Please select or enter a donation amount.', 'error');
        return;
    }
    showToast(`Thank you for your donation of $${amount.toFixed(2)}! 🐾`, 'success');
    if (amountInput) amountInput.value = '';
    document.querySelectorAll('.panel button[onclick^="selectAmount"]').forEach(b => {
        b.style.border     = '1px solid var(--line-clr)';
        b.style.background = 'var(--base-clr)';
        b.style.color      = 'var(--text-clr)';
    });
}


/* ================ ADMIN PAGE ================ */

function initAdmin() {
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => handleApproval(btn, true));
    });
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => handleApproval(btn, false));
    });

    document.querySelectorAll('.report-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const title = item.querySelector('.report-title')?.textContent || 'Report';
            showToast(`Generating: ${title}…`, 'info');
        });
    });
}

function handleApproval(btn, approved) {
    const approvalItem = btn.closest('.approval-item');
    if (!approvalItem) return;

    const title = approvalItem.querySelector('.approval-title')?.textContent || 'Item';
    showToast(approved ? `✅ Approved: ${title}` : `❌ Rejected: ${title}`,
              approved ? 'success' : 'error');

    approvalItem.style.transition = 'opacity .4s';
    approvalItem.style.opacity    = '0';
    setTimeout(() => approvalItem.remove(), 450);
}


/* ================ TOAST NOTIFICATION ================
 */
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        Object.assign(container.style, {
            position: 'fixed', bottom: '24px', right: '24px',
            zIndex: '9999', display: 'flex', flexDirection: 'column', gap: '10px'
        });
        document.body.appendChild(container);
    }

    const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' };
    const toast  = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
        background: colors[type] || colors.info,
        color: '#fff', padding: '12px 18px', borderRadius: '10px',
        fontSize: '0.875rem', fontWeight: '600',
        boxShadow: '0 4px 14px rgba(0,0,0,.25)',
        opacity: '0', transform: 'translateY(10px)',
        transition: 'opacity .3s, transform .3s',
        maxWidth: '300px', cursor: 'pointer'
    });

    toast.addEventListener('click', () => removeToast(toast));
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => removeToast(toast), 4000);
}

function removeToast(toast) {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
}


/* ================ UTILITY ================ */

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


/*================ INIT ================ */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initFormValidation();

    if (document.querySelector('.task-list'))            initVolunteersExport();
    if (document.querySelector('.activity-item button')) initVeterinary();
    if (document.getElementById('custom-amount') ||
        document.querySelector('.donate-btn')    ||
        document.querySelector('[onclick^="selectAmount"]')) initDonate();
    if (document.querySelector('.btn-approve') ||
        document.querySelector('.btn-reject')  ||
        document.querySelector('.report-item')) initAdmin();
});


/*================ SIDEBAR ================*/
function toggleSidebar() {
    const sidebar      = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggle-btn');
    if (!sidebar || !toggleButton) return;

    sidebar.classList.toggle('close');
    toggleButton.classList.toggle('rotate');

    // Close any open submenus when collapsing the sidebar
    Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
        ul.classList.remove('show');
        if (ul.previousElementSibling) {
            ul.previousElementSibling.classList.remove('rotate');
        }
    });
}

function toggleSubmenu(button) {
    const sidebar      = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggle-btn');
    if (!button) return;

    const submenu = button.nextElementSibling; // was: nextEkementSibling (typo fixed)
    if (submenu) submenu.classList.toggle('show');
    button.classList.toggle('rotate');

    // If sidebar is closed, open it so the submenu is visible
    if (sidebar && sidebar.classList.contains('close')) {
        sidebar.classList.remove('close');
        if (toggleButton) toggleButton.classList.remove('rotate');
    }
}


/*  ================ THEME  (Dark <-> Light) ================ */
function initTheme() {
    const saved       = localStorage.getItem('theme');   // 'light' | 'dark' | null
    const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const startLight  = saved === 'light' || (saved === null && systemLight);

    applyTheme(startLight, false); // false = don't persist (initial load)

    // Toggle button
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isLight = !document.documentElement.classList.contains('light-mode');
            applyTheme(isLight, true); // persist user choice
        });
    }

    // React to OS theme changes in real time (only when no manual override exists)
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches, false);
        }
    });
}

function applyTheme(isLight, persist) {
    const html = document.documentElement;

    if (isLight) {
        html.classList.add('light-mode');
        html.setAttribute('data-theme', 'light');
    } else {
        html.classList.remove('light-mode');
        html.setAttribute('data-theme', 'dark');
    }

    if (persist) {
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    updateThemeUI(isLight);
}

/* Syncs every visible piece of the toggle button */
function updateThemeUI(isLight) {
    const label       = document.getElementById('toggleLabel');
    const iconMoon    = document.getElementById('iconMoon');
    const iconSun     = document.getElementById('iconSun');
    const toggleTrack = document.getElementById('toggleTrack');
    const themeBtn    = document.getElementById('themeBtn');

    if (label)        label.textContent               = isLight ? 'Dark Mode'  : 'Light Mode';
    if (iconMoon)     iconMoon.style.display           = isLight ? 'none'  : 'block';
    if (iconSun)      iconSun.style.display            = isLight ? 'block' : 'none';
    if (toggleTrack)  toggleTrack.classList.toggle('on', isLight);

    // Accessibility
    if (themeBtn) {
        themeBtn.setAttribute('aria-label',
            isLight ? 'Switch to dark mode' : 'Switch to light mode');
        themeBtn.setAttribute('aria-pressed', String(isLight));
    }
}