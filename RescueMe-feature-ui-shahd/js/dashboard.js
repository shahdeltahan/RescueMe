// ===== dashboard.js =====
// Person 2 – Dashboard logic: stats, activity feed, live clock

document.addEventListener('DOMContentLoaded', () => {
    renderStats();
    renderActivityFeed();
    startLiveClock();
    animateCounters();
});

// ─── Stats Data ───────────────────────────────────────────────
const statsData = {
    totalCases:     { value: 248, change: '+12 this week',  positive: true },
    rescuedAnimals: { value: 184, change: '+8 this week',   positive: true },
    volunteers:     { value: 63,  change: '+5 this month',  positive: true },
    donations:      { value: 12480, change: '+$940 this month', positive: true, isCurrency: true }
};

function renderStats() {
    const map = {
        'total-cases':      statsData.totalCases,
        'rescued-animals':  statsData.rescuedAnimals,
        'total-volunteers': statsData.volunteers,
        'total-donations':  statsData.donations
    };
    for (const [id, data] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (!el) continue;
        el.dataset.target = data.value;
        el.textContent = data.isCurrency ? '$0' : '0';
    }
}

// ─── Animated Counters ────────────────────────────────────────
function animateCounters() {
    const duration = 1200;
    const elements = document.querySelectorAll('.stat-value[data-target]');
    elements.forEach(el => {
        const target = parseInt(el.dataset.target);
        const isCurrency = el.id === 'total-donations';
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = Math.floor(eased * target);
            el.textContent = isCurrency
                ? '$' + current.toLocaleString()
                : current.toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// ─── Activity Feed Data ───────────────────────────────────────
const activityData = [
    {
        title: 'Injured dog found near highway',
        severity: 'urgent',
        label: 'Urgent',
        reporter: 'Ahmed Hassan',
        location: 'Cairo, Maadi',
        time: '20 min ago'
    },
    {
        title: 'Stray cat with kittens near school',
        severity: 'medium',
        label: 'Moderate',
        reporter: 'Sara Mohamed',
        location: 'Giza, Dokki',
        time: '1 hr ago'
    },
    {
        title: 'Abandoned rabbit in park',
        severity: 'low',
        label: 'Low',
        reporter: 'Omar Khalil',
        location: 'Alexandria',
        time: '3 hrs ago'
    },
    {
        title: 'Bird with broken wing on rooftop',
        severity: 'urgent',
        label: 'Urgent',
        reporter: 'Nour Ali',
        location: 'Cairo, Heliopolis',
        time: '5 hrs ago'
    },
    {
        title: 'Lost dog spotted near metro station',
        severity: 'medium',
        label: 'Moderate',
        reporter: 'Mona Samir',
        location: 'Cairo, Nasr City',
        time: 'Yesterday'
    }
];

function renderActivityFeed() {
    const list = document.getElementById('activity-list');
    if (!list) return;
    list.innerHTML = '';

    activityData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.innerHTML = `
            <div class="activity-status ${item.severity}"></div>
            <div class="activity-content">
                <div class="activity-top">
                    <span class="activity-title">${item.title}</span>
                    <span class="activity-badge ${item.severity}-badge">${item.label}</span>
                </div>
                <p class="activity-meta">
                    Reported by ${item.reporter} &bull; ${item.location} &bull; ${item.time}
                </p>
            </div>
            <a href="cases.html" class="activity-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#b0b3c1">
                    <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/>
                </svg>
            </a>
        `;
        list.appendChild(div);
    });
}

// ─── Live Clock in Header ─────────────────────────────────────
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

// ─── Notification Badge: fetch unread count ───────────────────
function updateNotifBadge() {
    // Simulated unread count — replace with real API call when backend is ready
    const unreadCount = 3;
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
}
updateNotifBadge();