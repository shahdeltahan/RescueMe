const container = document.getElementById("casesContainer");

async function loadCases() {
    try {
        const token = localStorage.getItem('rescueMe_token');
        const res = await fetch(API_BASE_URL + "/api/cases", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (res.ok) {
            const reports = await res.json();
            // Filter out 'open' since those are pending approval
            const dynamicCases = reports.filter(r => !r.status_name || r.status_name.toLowerCase() !== 'open').map(report => ({
                id: report.report_id,
                name: report.animal_type || "Unknown Animal",
                status: report.status_name || report.animal_condition || "unknown",
                image: report.image_url || "https://placehold.co/600x400/333333/888888?text=No+Photo"
            }));
            renderCases(dynamicCases);
        }
    } catch (e) {
        console.error("Failed to load cases:", e);
    }
}

function renderCases(allCases) {
    container.innerHTML = '';
    allCases.forEach(animal => {
        const card = document.createElement("div");
        card.classList.add("card");
        const statusClass = animal.status ? animal.status.toLowerCase().replace(/\s+/g, '-') : '';
        card.innerHTML = `
        <img src="${animal.image}" alt="${animal.name}">
        <div class="card-content">
          <h3>${animal.name}</h3>
          <span class="status ${statusClass}">${animal.status}</span>
          <button onclick="viewDetails('${animal.id}')">View Details</button>
        </div>
        `;
        container.appendChild(card);
    });
}

function viewDetails(id) {
   window.location.href = `cases_details.html?id=${id}`;
}

document.addEventListener('DOMContentLoaded', loadCases);