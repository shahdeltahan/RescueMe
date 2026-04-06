

/* ── report-animal.js ────────────────────────────────────────
   Handles all interactions on the Report Animal page:
   - Image upload + drag-and-drop preview
   - Urgency select color change
   - Form validation + submit
──────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {

    /* ── 1. Image upload via click ── */
    var imgInput   = document.getElementById('image-input');
    var preview    = document.getElementById('image-preview');
    var uploadArea = document.querySelector('.upload-area');

    if (imgInput && preview) {
        imgInput.addEventListener('change', function () {
            var file = imgInput.files[0];
            if (file && file.type.startsWith('image/')) {
                showPreview(file);
            }
        });
    }

    /* ── 2. Drag-and-drop ── */
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--accent-clr)';
            uploadArea.style.background  = 'var(--hover-clr)';
        });

        uploadArea.addEventListener('dragleave', function () {
            uploadArea.style.borderColor = '';
            uploadArea.style.background  = '';
        });

        uploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background  = '';
            var file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                showPreview(file);
                /* Also set it on the real input so FormData picks it up */
                var dt = new DataTransfer();
                dt.items.add(file);
                if (imgInput) imgInput.files = dt.files;
            }
        });
    }

    function showPreview(file) {
        if (!preview) return;
        var url = URL.createObjectURL(file);
        preview.src = url;
        preview.style.display = 'block';
        /* Free old object URL when a new one is set */
        preview.onload = function () { URL.revokeObjectURL(url); };
    }

    /* ── 3. Urgency select — colour state ── */
    var urgencySelect = document.getElementById('urgency');
    if (urgencySelect) {
        urgencySelect.addEventListener('change', function () {
            this.classList.remove('high', 'medium', 'low');
            if (this.value) this.classList.add(this.value);
        });
    }

    /* ── 4. Form validation + submit ── */
    var form = document.getElementById('reportForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            /* Gather values */
            var animalType = (document.getElementById('animalType')      || {}).value || '';
            var condition  = (document.getElementById('animalCondition') || {}).value || '';
            var urgency    = (document.getElementById('urgency')         || {}).value || '';
            var location   = (document.getElementById('location')        || {}).value.trim();
            var description= (document.getElementById('description')     || {}).value.trim();

            /* Basic validation */
            var errors = [];
            if (!animalType)  errors.push('Please select an animal type.');
            if (!condition)   errors.push('Please select the animal\'s condition.');
            if (!urgency)     errors.push('Please select an urgency level.');
            if (!location)    errors.push('Please enter a location.');
            if (!description) errors.push('Please add a description.');

            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }

            /* Build report object */
            var report = {
                id:          'RPT-' + Date.now(),
                animalType:  animalType,
                condition:   condition,
                urgency:     urgency,
                location:    location,
                description: description,
                reportedBy:  localStorage.getItem('rescueMe_name') || 'Anonymous',
                timestamp:   new Date().toISOString()
            };

            /* Save to localStorage (replace with a real API call when ready) */
            var reports = [];
            try {
                reports = JSON.parse(localStorage.getItem('rescueMe_reports') || '[]');
            } catch (_) { reports = []; }
            reports.unshift(report);
            localStorage.setItem('rescueMe_reports', JSON.stringify(reports));

            /* Feedback + redirect */
            alert('Report submitted successfully! ID: ' + report.id);
            form.reset();
            if (preview) { preview.src = ''; preview.style.display = 'none'; }
            if (urgencySelect) urgencySelect.classList.remove('high', 'medium', 'low');

            /* Redirect to cases page after short delay */
            setTimeout(function () {
                window.location.href = '/html/cases.html';
            }, 500);
        });
    }

});


/* ================ FORM VALIDATION ================ */

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


/* ================ SIDEBAR ================ */

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

    const submenu = button.nextElementSibling;
    if (submenu) submenu.classList.toggle('show');
    button.classList.toggle('rotate');

    // If sidebar is closed, open it so the submenu is visible
    if (sidebar && sidebar.classList.contains('close')) {
        sidebar.classList.remove('close');
        if (toggleButton) toggleButton.classList.remove('rotate');
    }
}


/* ================ TOAST NOTIFICATION ================ */

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


/* ================ INIT ================ */
/*
 * This is the single entry point for the whole app.
 * Each page only includes the JS files it actually needs,
 * but script.js is ALWAYS included on every page.
 */
document.addEventListener('DOMContentLoaded', () => {
    // theme.js must also be included on every page
    if (typeof initTheme === 'function') initTheme();

    // Form validation — runs on login / signup pages
    initFormValidation();

    // Volunteers page
    if (document.querySelector('.task-list') &&
        typeof initVolunteersExport === 'function') {
        initVolunteersExport();
    }

    // Veterinary page
    if (document.querySelector('.activity-item button') &&
        typeof initVeterinary === 'function') {
        initVeterinary();
    }

    // Donate page
    if ((document.getElementById('custom-amount') ||
         document.querySelector('.donate-btn')    ||
         document.querySelector('[onclick^="selectAmount"]')) &&
        typeof initDonate === 'function') {
        initDonate();
    }

    // Admin page
    if ((document.querySelector('.btn-approve') ||
         document.querySelector('.btn-reject')  ||
         document.querySelector('.report-item')) &&
        typeof initAdmin === 'function') {
        initAdmin();
    }
});

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

