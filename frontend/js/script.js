const toggleButton = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
function toggleSidebar() {
    sidebar.classList.toggle("close");
    toggleButton.classList.toggle("rotate");
    Array.from(sidebar.getElementsByClassName("show")).forEach((ul) => {
        ul.classList.remove("show");
        ul.previousElementSibling.classList.remove("rotate");
    });
}
function toggleSubmenu(button) {
    button.nextElementSibling.classList.toggle("show");
    button.classList.toggle("rotate");
    if (sidebar.classList.contains('close')) {
        sidebar.classList.toggle('close');
        toggleButton.classList.toggle('rotate');
    }
}
const form = document.getElementById('form');
const fullname_input = document.getElementById('fullname-input');
const email_input = document.getElementById('email-input');
const phone_input = document.getElementById('phone-input');
const password_input = document.getElementById('password-input');
const confirm_password_input = document.getElementById('confirm-password-input');
const role_input = document.getElementById('role-input');
const error_message = document.getElementById('error-message')
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        let errors = [];

        if (fullname_input) {
            errors = getSignupFormErrors(
                fullname_input.value.trim(),
                email_input.value.trim(),
                phone_input ? phone_input.value.trim() : "",
                password_input.value,
                confirm_password_input ? confirm_password_input.value : "",
                role_input ? role_input.value : ""
            );
        } else {
            errors = getLoginFormErrors(
                email_input.value.trim(),
                password_input.value
            );
        }

        if (errors.length > 0) {
            if (error_message) {
                error_message.innerText = errors.join(". ");
                error_message.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
        }

        const existingUnlockBtn = document.getElementById('unlock-btn');
        if (existingUnlockBtn) existingUnlockBtn.remove();

        if (fullname_input) {
            try {
                console.log("Sending role:", role_input.value);
                const response = await fetch("https://rescueme-backend-jjhr.onrender.com/api/auth/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        full_name: fullname_input.value.trim(),
                        email: email_input.value.trim(),
                        phone_number: phone_input ? phone_input.value.trim() : "",
                        password: password_input.value,
                        role: role_input.value
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast("Account created successfully!", "success");

                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 1000);
                } else {
                    error_message.innerText = data.error || "Signup failed";
                }
            } catch (err) {
                console.error(err);
                error_message.innerText = "Server connection error";
            }
        } else {
            try {
                const response = await fetch("https://rescueme-backend-jjhr.onrender.com/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email_input.value.trim(),
                        password: password_input.value
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem("rescueMe_token", data.token);
                    localStorage.setItem("rescueMe_user_id", data.user.user_id);
                    localStorage.setItem("rescueMe_name", data.user.full_name);
                    localStorage.setItem("rescueMe_role", data.user.role);
                    localStorage.setItem("rescueMe_email", data.user.email);

                    showToast("Login successful!", "success");

                    setTimeout(() => {
                        window.location.href = "sidebar.html";
                    }, 800);
                } else {
                    error_message.textContent = data.error || "Login failed";
                    if (response.status === 403 && data.user_id) {
                        form.style.display = 'none'; // Hide form to prevent browser autofill from interfering
                        
                        let unlockBtn = document.getElementById('unlock-btn');
                        if (!unlockBtn) {
                            unlockBtn = document.createElement('button');
                            unlockBtn.id = 'unlock-btn';
                            unlockBtn.textContent = "Request Account Unlock";
                            unlockBtn.style.cssText = "display: block; margin-top: 20px; background: var(--accent-clr, #3b82f6); color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%;";
                            unlockBtn.type = "button";
                            error_message.parentNode.insertBefore(unlockBtn, error_message.nextSibling);
                        }
                        
                        let backBtn = document.getElementById('back-btn');
                        if (!backBtn) {
                            backBtn = document.createElement('button');
                            backBtn.id = 'back-btn';
                            backBtn.textContent = "Try Another Account";
                            backBtn.style.cssText = "display: block; margin-top: 10px; background: transparent; color: var(--secondary-text-clr, #888); border: 1px solid var(--border-clr, #444); padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%;";
                            backBtn.type = "button";
                            backBtn.onclick = () => window.location.reload();
                            unlockBtn.parentNode.insertBefore(backBtn, unlockBtn.nextSibling);
                        }

                        unlockBtn.onclick = async () => {
                            try {
                                unlockBtn.disabled = true;
                                unlockBtn.textContent = "Sending Request...";
                                const reqRes = await fetch("https://rescueme-backend-jjhr.onrender.com/api/requests", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        user_id: data.user_id,
                                        request_type: 'account_unlock',
                                        title: 'Account Unlock Request',
                                        description: 'User requested account unlock from login screen'
                                    })
                                });
                                if (reqRes.ok) {
                                    showToast("Unlock request sent to admins!", "success");
                                    unlockBtn.textContent = "Request Sent";
                                    setTimeout(() => window.location.reload(), 2500);
                                } else {
                                    showToast("Failed to send unlock request.", "error");
                                    unlockBtn.textContent = "Request Account Unlock";
                                    unlockBtn.disabled = false;
                                }
                            } catch (e) {
                                showToast("Server connection error.", "error");
                                unlockBtn.textContent = "Request Account Unlock";
                                unlockBtn.disabled = false;
                            }
                        };
                    }
                }

            } catch (err) {
                console.error(err);
                error_message.innerText = "Server connection error";
            }
        }
    });
}

function getSignupFormErrors(fullname, email, phone, password, confirmPassword, role) {
    let errors = []
    if (fullname === '' || fullname == null) {
        errors.push('Fullname is required')
        fullname_input.parentElement.classList.add('incorrect')
    }
    if (email === '' || email == null) {
        errors.push('Email is required')
        email_input.parentElement.classList.add('incorrect')
    }
    if (phone_input) {
        if (!phone) {
            errors.push("Phone number is required");
            phone_input.parentElement.classList.add("incorrect");
        } else if (!/^\+?[\d\s\-]{10,15}$/.test(phone)) {
            errors.push("Phone number must be 10–15 digits");
            phone_input.parentElement.classList.add("incorrect");
        }
    }
    if (password === '' || password == null) {
        errors.push('Password is required')
        password_input.parentElement.classList.add('incorrect')
    }
    else if (password.length < 8) {
        errors.push('Password must have at least 8 characters')
        password_input.parentElement.classList.add('incorrect')
    }
    else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        errors.push("Password must contain a letter and a number");
        password_input.parentElement.classList.add("incorrect");
    }
    if (confirmPassword === '' || confirmPassword == null) {
        errors.push('Please confirm your password')
        confirm_password_input.parentElement.classList.add('incorrect')
    }
    else if (password !== confirmPassword) {
        errors.push('Passwords do not match')
        confirm_password_input.parentElement.classList.add('incorrect')
    }
    if (role_input && !role) {
        errors.push("Please select a role");
        role_input.parentElement.classList.add("incorrect");
    }
    return errors;
}
function getLoginFormErrors(email, password) {
    let errors = []
    if (email === '' || email == null) {
        errors.push('Email is required')
        email_input.parentElement.classList.add('incorrect')
    }
    if (password === '' || password == null) {
        errors.push('Password is required')
        password_input.parentElement.classList.add('incorrect')
    }
    return errors;
}
const allInputs = [
    fullname_input, email_input, phone_input, password_input, confirm_password_input, role_input,
].filter(input => input != null);
allInputs.forEach((input) => {
    input.addEventListener("input", () => {
        if (input.parentElement.classList.contains("incorrect")) {
            input.parentElement.classList.remove("incorrect");
        }
        const anyIncorrect = allInputs.some((i) =>
            i.parentElement.classList.contains("incorrect")
        );
        if (!anyIncorrect) {
            error_message.innerText = "";
        }
    });
});


/*---*/
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
    const toast = document.createElement('div');
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
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => removeToast(toast), 4000);
}
function removeToast(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
}
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initTheme === 'function') initTheme();
    if (typeof initFormValidation === 'function') initFormValidation();
    if (document.querySelector('.task-list') &&
        typeof initVolunteersExport === 'function') {
        initVolunteersExport();
    }
    if (document.querySelector('.activity-item button') &&
        typeof initVeterinary === 'function') {
        initVeterinary();
    }
    if ((document.getElementById('custom-amount') ||
        document.querySelector('.donate-btn') ||
        document.querySelector('[onclick^="selectAmount"]')) &&
        typeof initDonate === 'function') {
        initDonate();
    }
    if ((document.querySelector('.btn-approve') ||
        document.querySelector('.btn-reject') ||
        document.querySelector('.report-item')) &&
        typeof initAdmin === 'function') {
        initAdmin();
    }
    startLiveClock();
});
function initTheme() {
    const saved = localStorage.getItem('theme');
    const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const startLight = saved === 'light' || (saved === null && systemLight);
    applyTheme(startLight, false);
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isLight = !document.documentElement.classList.contains('light-mode');
            applyTheme(isLight, true);
        });
    }
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
function updateThemeUI(isLight) {
    const label = document.getElementById('toggleLabel');
    const iconMoon = document.getElementById('iconMoon');
    const iconSun = document.getElementById('iconSun');
    const toggleTrack = document.getElementById('toggleTrack');
    const themeBtn = document.getElementById('themeBtn');
    if (label) label.textContent = isLight ? 'Dark Mode' : 'Light Mode';
    if (iconMoon) iconMoon.style.display = isLight ? 'none' : 'block';
    if (iconSun) iconSun.style.display = isLight ? 'block' : 'none';
    if (toggleTrack) toggleTrack.classList.toggle('on', isLight);
    if (themeBtn) {
        themeBtn.setAttribute('aria-label',
            isLight ? 'Switch to dark mode' : 'Switch to light mode');
        themeBtn.setAttribute('aria-pressed', String(isLight));
    }
}
document.addEventListener("DOMContentLoaded", async function () {
    var activityList = document.getElementById("activity-list");
    if (activityList) {
        const token = localStorage.getItem('rescueMe_token');
        
        let reports = [];
        try {
            const res = await fetch("https://rescueme-backend-jjhr.onrender.com/api/cases", {
                headers: { "Authorization": "Bearer " + token }
            });
            if (res.ok) reports = await res.json();
        } catch (e) { console.error("Failed to fetch cases", e); }
        
        var totalCasesEl = document.getElementById('total-cases');
        if (totalCasesEl) totalCasesEl.textContent = reports.length;
        
        const rescuedCount = reports.filter(r => r.status_name === 'Closed' || r.status_name === 'closed' || r.status_name === 'Stable').length;
        const rescuedEl = document.getElementById('rescued-animals');
        if (rescuedEl) rescuedEl.textContent = rescuedCount;
        
        let volunteerCount = 0;
        try {
            const res = await fetch("https://rescueme-backend-jjhr.onrender.com/api/admin/users", {
                headers: { "Authorization": "Bearer " + token }
            });
            if (res.ok) {
                const users = await res.json();
                volunteerCount = users.filter(u => (u.role_name || u.role) === "volunteer").length;
            } else {
                const users = JSON.parse(localStorage.getItem('rescueMe_users') || '[]');
                volunteerCount = users.filter(u => u.role === "Volunteer" || u.role_name === "volunteer").length;
            }
        } catch (e) { console.error(e); }
        const volunteersEl = document.getElementById('total-volunteers');
        if (volunteersEl) volunteersEl.textContent = volunteerCount;

        let totalDonations = 0;
        try {
            const res = await fetch("https://rescueme-backend-jjhr.onrender.com/api/payments", {
                headers: { "Authorization": "Bearer " + token }
            });
            if (res.ok) {
                const payments = await res.json();
                totalDonations = payments.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
            } else {
                const donations = JSON.parse(localStorage.getItem('rescueMe_donations') || '[]');
                totalDonations = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
            }
        } catch (e) { console.error(e); }
        
        const donationsEl = document.getElementById('total-donations');
        if (donationsEl) {
            donationsEl.textContent = '$' + totalDonations.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }
        
        const dashboardNotifBadge = document.getElementById('notif-badge');
        if (dashboardNotifBadge) {
            const unreadCount = reports.filter(r => r.status_name === 'Open' || r.status_name === 'open').length;
            dashboardNotifBadge.textContent = unreadCount;
            dashboardNotifBadge.parentElement.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        
        activityList.innerHTML = '';
        if (reports.length === 0) {
            activityList.innerHTML = '<p style="padding: 20px; color: var(--secondary-text-clr);">No recent reports available. Add some via Report Animal!</p>';
            return;
        }
        
        var latestReports = reports.slice(0, 5);
        latestReports.forEach(function (report) {
            var urgencyClass = "low";
            var badgeClass = "low-badge";
            var urgencyText = "Low";
            
            if (report.urgency_level) {
                const u = report.urgency_level.toLowerCase();
                if (u === 'high' || u === 'critical') {
                    urgencyClass = "urgent";
                    badgeClass = "urgent-badge";
                    urgencyText = "Urgent";
                } else if (u === 'medium') {
                    urgencyClass = "medium";
                    badgeClass = "medium-badge";
                    urgencyText = "Moderate";
                }
            }
            
            var timeAgo = "Just now";
            if (report.created_at) {
                var diffMin = Math.round((new Date() - new Date(report.created_at)) / 60000);
                if (diffMin > 60 && diffMin < 1440) {
                    timeAgo = Math.round(diffMin / 60) + " hrs ago";
                } else if (diffMin >= 1440) {
                    timeAgo = Math.round(diffMin / 1440) + " days ago";
                } else if (diffMin > 0) {
                    timeAgo = diffMin + " min ago";
                }
            }
            var itemHTML = `
                <div class="activity-item">
                    <div class="activity-status ${urgencyClass}"></div>
                    <div class="activity-content">
                        <div class="activity-top">
                            <span class="activity-title">${report.animal_type || 'Animal'} (${report.animal_condition || 'Unknown'})</span>
                            <span class="activity-badge ${badgeClass}">${urgencyText}</span>
                        </div>
                        <p class="activity-meta">Reported by ${report.reported_by || 'Anonymous'} &bull; ${report.location || 'Unknown location'} &bull; ${timeAgo}</p>
                    </div>
                    <a href="cases_details.html?id=${report.report_id}" class="activity-arrow">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#b0b3c1"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>
                    </a>
                </div>
            `;
            activityList.insertAdjacentHTML('beforeend', itemHTML);
        });
    }
});

function startLiveClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;
    function tick() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }
    tick();
    setInterval(tick, 1000);
}