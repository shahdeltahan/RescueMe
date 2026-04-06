/* ── navbar.js ───────────────────────────────────────────────
   Reads signup/role data from localStorage and populates the
   navbar profile pill + dropdown.

   Expected localStorage keys (set during signup):
     rescueMe_name   – full name,  e.g. "Shahd Khaled"
     rescueMe_role   – role,       e.g. "Volunteer" | "Admin" | "Veterinary"
     rescueMe_avatar – (optional) base64 image string

   Fall-back values are used when nothing is stored.
──────────────────────────────────────────────────────────── */

(function () {
    /* ── 1. Read stored user data ── */
    const name   = localStorage.getItem('rescueMe_name')   || 'Shahd Khaled';
    const role   = localStorage.getItem('rescueMe_role')   || 'Volunteer';
    const avatar = localStorage.getItem('rescueMe_avatar') || null;

    /* ── 2. Populate profile pill ── */
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const dropName    = document.getElementById('dropName');
    const dropRole    = document.getElementById('dropRole');

    if (profileName) profileName.textContent = name;
    if (profileRole) profileRole.textContent = role;
    if (dropName)    dropName.textContent    = name;
    if (dropRole)    dropRole.textContent    = role;

    /* ── 3. If an avatar image was stored, show it ── */
    if (avatar) {
        [document.getElementById('avatarEl'), document.getElementById('dropAvatarEl')]
            .forEach(el => {
                if (!el) return;
                el.innerHTML = `<img src="${avatar}" alt="avatar"
                    style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            });
    }

    /* ── 4. Toggle dropdown ── */
    const profileBtn      = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = profileBtn.getAttribute('aria-expanded') === 'true';
            profileBtn.setAttribute('aria-expanded', String(!isOpen));
            profileDropdown.hidden = isOpen;
        });

        /* Close on outside click */
        document.addEventListener('click', () => {
            profileBtn.setAttribute('aria-expanded', 'false');
            profileDropdown.hidden = true;
        });

        /* Prevent dropdown clicks from closing it */
        profileDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    /* ── 5. Sign-out button ── */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('rescueMe_name');
            localStorage.removeItem('rescueMe_role');
            localStorage.removeItem('rescueMe_avatar');
            window.location.href = 'login.html';   /* adjust path as needed */
        });
    }

    /* ── 6. Notification badge: hide if 0 ── */
    const badge = document.getElementById('notifBadge');
    if (badge && badge.textContent === '0') badge.style.display = 'none';

})();

/* ── Helper: call this from your signup form to persist user data ──
   Example usage in signup.js:
   
   import { saveUserSession } from './navbar.js';
   saveUserSession('Shahd Khaled', 'Volunteer');
──────────────────────────────────────────────────────────── */
function saveUserSession(name, role, avatarBase64 = null) {
    localStorage.setItem('rescueMe_name', name);
    localStorage.setItem('rescueMe_role', role);
    if (avatarBase64) localStorage.setItem('rescueMe_avatar', avatarBase64);
}