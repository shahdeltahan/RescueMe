const API_BASE = "https://rescueme-backend-jjhr.onrender.com/api";

function getToken() {
    return localStorage.getItem("rescueMe_token") || localStorage.getItem("token");
}

let selectedPetId = null;

async function getAdoptionPets() {
    const token = getToken();
    try {
        const res = await fetch(`${API_BASE}/adoption/pets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.error("Failed to load adoption pets", e);
    }
    return [];
}

async function renderAdoptionCards(filter = 'all') {
    const grid = document.getElementById('adoptionGrid');
    const emptyState = document.getElementById('emptyState');
    if (!grid || !emptyState) return;

    grid.innerHTML = '';
    const fullPets = await getAdoptionPets();
    
    const filteredPets = fullPets.filter(pet => {
        const matchesSpecies = filter === 'all' || pet.species === filter;
        return matchesSpecies;
    });

    if (filteredPets.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        filteredPets.forEach(pet => {
            const card = document.createElement('div');
            card.className = 'pet-card';
            card.innerHTML = `
                <img src="${pet.image}" alt="${pet.name}" class="pet-card-image">
                <div class="pet-card-content">
                    <div class="pet-card-header">
                        <h3 class="pet-card-title">${pet.name}</h3>
                    </div>
                    <p class="pet-card-subtitle">${pet.breed}</p>
                    <div class="pet-card-info">
                        <div class="pet-info-item">
                            <!-- Age/Time Icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q150 0 255 105t105 255q0 150-105 255T480-120Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-360Z"/></svg>
                            ${pet.age}
                        </div>
                        <div class="pet-info-item">
                            <!-- Profile/Gender Icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 129-46.5T480-440q68 0 135 15.5T744-378q29 15 46.5 43.5T808-272v112H160Z"/></svg>
                            ${pet.gender}
                        </div>
                    </div>
                    <div class="pet-card-actions">
                        ${pet.adopted 
                            ? `<button class="btn-adopt" disabled>Adopted</button>` 
                            : `<button class="btn-adopt" onclick="openAdoptModal('${pet.id}')">Adopt Me</button>`
                        }
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

window.openAdoptModal = async function(petId) {
    const fullPets = await getAdoptionPets();
    const pet = fullPets.find(p => p.id === petId || p.id === parseInt(petId));
    if (!pet) return;
    
    selectedPetId = pet.id;
    document.getElementById('modalTitle').textContent = `Adopt ${pet.name}`;
    document.getElementById('modalDesc').textContent = `You are applying to adopt ${pet.name} (${pet.breed}). Please provide your details, and our team will contact you soon.`;
    
    const modal = document.getElementById('adoptionModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
};

window.closeModal = function() {
    const modal = document.getElementById('adoptionModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('adoptForm').reset();
        selectedPetId = null;
    }, 300);
};

document.addEventListener('DOMContentLoaded', () => {
    renderAdoptionCards('all');

    const speciesFilter = document.getElementById('speciesFilter');
    if (speciesFilter) {
        speciesFilter.addEventListener('change', (e) => {
            renderAdoptionCards(e.target.value);
        });
    }

    const adoptForm = document.getElementById('adoptForm');
    if (adoptForm) {
        adoptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('adoptName').value;
            const token = getToken();

            try {
                const res = await fetch(`${API_BASE}/adoption/request/${selectedPetId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    if (typeof showToast === 'function') {
                        showToast(`Thank you ${name}! Your application for adoption was submitted.`, 'success');
                    } else {
                        alert(`Thank you ${name}! Your application for adoption was submitted.`);
                    }

                    const currentFilter = document.getElementById('speciesFilter') ? document.getElementById('speciesFilter').value : 'all';
                    renderAdoptionCards(currentFilter);
                } else {
                    const data = await res.json();
                    if(typeof showToast === 'function') showToast(data.error || "Failed to submit request", "error");
                }
            } catch (err) {
                console.error(err);
            }

            closeModal();
        });
    }

    const modal = document.getElementById('adoptionModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});