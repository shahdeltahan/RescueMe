const API_BASE = "https://rescueme-backend-jjhr.onrender.com/api";
function getToken() {
    return localStorage.getItem("rescueMe_token") || localStorage.getItem("token");
}

const SVGs = {
    alert: '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>',
    update: '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>',
    system: '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z"/></svg>'
};

document.addEventListener('DOMContentLoaded', loadNotifications);

async function loadNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    list.innerHTML = '';
    
    const token = getToken();
    if (!token) {
        if(typeof showToast === 'function') showToast("Please log in to see notifications.", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load notifications");
        
        const notifications = await res.json();

        if (notifications.length === 0) {
            list.innerHTML = '';
            updateCounts();
            checkEmpty();
            return;
        }

        notifications.forEach(notif => {
            const dateObj = new Date(notif.time);
            let timeStr = dateObj.toLocaleDateString();
            const now = new Date();
            const diffSecs = Math.floor((now - dateObj) / 1000);
            if (diffSecs < 60) timeStr = 'Just now';
            else if (diffSecs < 3600) timeStr = `${Math.floor(diffSecs/60)} minutes ago`;
            else if (diffSecs < 86400) timeStr = `${Math.floor(diffSecs/3600)} hours ago`;
            
            const unreadClass = notif.unread ? 'unread' : '';
            const unreadDot = notif.unread ? '<span class="unread-dot"></span>' : '';
            const typeClass = notif.type || 'system';
            
            const html = `
            <div class="notif-card ${unreadClass}" data-type="${typeClass}" data-id="${notif.id}">
                <div class="notif-icon-wrap ${typeClass}-icon">
                    ${SVGs[typeClass] || SVGs.system}
                </div>
                <div class="notif-body">
                    <div class="notif-top">
                        <span class="notif-title">${notif.title || 'Notification'}</span>
                        ${unreadDot}
                    </div>
                    <p class="notif-desc">${notif.desc}</p>
                    <span class="notif-time">${timeStr}</span>
                </div>
                <button class="notif-dismiss" onclick="dismissNotif(this, ${notif.id})" title="Dismiss">
                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#b0b3c1"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </button>
            </div>`;
            list.insertAdjacentHTML('beforeend', html);
        });

        updateCounts();
        checkEmpty();
    } catch (error) {
        console.error("Error loading notifications:", error);
    }
}

function updateCounts() {
    const all = document.querySelectorAll('.notif-card').length;
    const unread = document.querySelectorAll('.notif-card.unread').length;
    const tabs = document.querySelectorAll('.tab-count');
    if (tabs.length >= 2) {
        tabs[0].textContent = all;
        tabs[1].textContent = unread;
    }
     const notifBadge = document.getElementById('notifBadge');
     if (notifBadge) {
         notifBadge.textContent = unread;
         notifBadge.style.display = unread > 0 ? 'flex' : 'none';
     }
}

async function markAllRead() {
    const token = getToken();
    try {
        await fetch(`${API_BASE}/notifications/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        document.querySelectorAll('.notif-card.unread').forEach(card => {
            card.classList.remove('unread');
            const dot = card.querySelector('.unread-dot');
            if (dot) dot.remove();
        });
        updateCounts();
    } catch(e) {
        console.error(e);
    }
}

async function dismissNotif(btn, id) {
    const token = getToken();
    try {
        await fetch(`${API_BASE}/notifications/${id}/dismiss`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const card = btn.closest('.notif-card');
        card.style.opacity = '0';
        card.style.transform = 'translateX(30px)';
        setTimeout(() => {
            card.remove();
            updateCounts();
            checkEmpty();
        }, 300);
    } catch(e) {
        console.error(e);
    }
}

function filterNotifs(type, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.notif-card').forEach(card => {
        if (type === 'all') {
            card.style.display = 'flex';
        } else if (type === 'unread') {
            card.style.display = card.classList.contains('unread') ? 'flex' : 'none';
        } else {
            card.style.display = card.dataset.type === type ? 'flex' : 'none';
        }
    });
    checkEmpty();
}

function checkEmpty() {
    const visible = [...document.querySelectorAll('.notif-card')].filter(c => c.style.display !== 'none');
    document.getElementById('empty-state').style.display = visible.length === 0 ? 'flex' : 'none';
}
