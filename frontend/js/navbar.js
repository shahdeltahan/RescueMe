(function () {
    const name   = localStorage.getItem('rescueMe_name')   || 'Shahd Khaled';
    const role   = localStorage.getItem('rescueMe_role')   || 'Volunteer';
    const avatar = localStorage.getItem('rescueMe_avatar') || null;
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const dropName    = document.getElementById('dropName');
    const dropRole    = document.getElementById('dropRole');
    if (profileName) profileName.textContent = name;
    if (profileRole) profileRole.textContent = role;
    if (dropName)    dropName.textContent    = name;
    if (dropRole)    dropRole.textContent    = role;
    if (avatar) {
        [document.getElementById('avatarEl'), document.getElementById('dropAvatarEl')]
            .forEach(el => {
                if (!el) return;
                el.innerHTML = `<img src="${avatar}" alt="avatar"
                    style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            });
    }
    const profileBtn      = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = profileBtn.getAttribute('aria-expanded') === 'true';
            profileBtn.setAttribute('aria-expanded', String(!isOpen));
            profileDropdown.hidden = isOpen;
        });
        document.addEventListener('click', () => {
            profileBtn.setAttribute('aria-expanded', 'false');
            profileDropdown.hidden = true;
        });
        profileDropdown.addEventListener('click', (e) => e.stopPropagation());
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('rescueMe_name');
            localStorage.removeItem('rescueMe_role');
            localStorage.removeItem('rescueMe_avatar');
            window.location.href = 'login.html';   
        });
    }
    updateNotificationBadge();
})();
async function updateNotificationBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    
    const token = localStorage.getItem("rescueMe_token") || localStorage.getItem("token");
    if (!token) {
        badge.style.display = 'none';
        return;
    }

    try {
        const res = await fetch("https://rescueme-backend-jjhr.onrender.com/api/notifications", {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const notifications = await res.json();
        const unreadCount = notifications.filter(n => n.unread).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    } catch (e) {
        console.error("Failed to fetch notification badge count:", e);
    }
}
function saveUserSession(name, role, avatarBase64 = null) {
    localStorage.setItem('rescueMe_name', name);
    localStorage.setItem('rescueMe_role', role);
    if (avatarBase64) localStorage.setItem('rescueMe_avatar', avatarBase64);
}