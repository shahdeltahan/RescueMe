const cases = [
    {
        id: 1,
        name: "Bella",
        status: "abused",
        location: "Cairo",
        description: "Small friendly cat, found wandering near park.",
        image: "https://th.bing.com/th/id/OIP.1Wgk3vF4o33ZrRncluxmuQHaE8",
        owner: { name: "Ahmed Ali", phone: "01011122233", email: "ahmed@example.com" }
    },
    {
        id: 2,
        name: "Max",
        status: "injured",
        location: "Alexandria",
        description: "Found injured, needs medical help.",
        image: "https://th.bing.com/th/id/OIP.wxQEga4w7c73JlStBBfeqAHaE8",
        owner: { name: "Sara Hassan", phone: "01233344455", email: "sara@example.com" }
    },
    {
        id: 3,
        name: "Luna",
        status: "sick",
        location: "Giza",
        description: "Appears quite sick, requires immediate vet check.",
        image: "https://th.bing.com/th/id/R.63a3eb3b4a330e52f204e7c04ca15299?rik=HD6Q1mY48gCBgQ&pid=ImgRaw&r=0",
        owner: { name: "RescueMe Shelter", phone: "01555566677", email: "shelter@rescueme.org" }
    }
];


const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get("id"));

const animal = cases.find(c => c.id === id);

const container = document.getElementById("detailsContainer");

if (animal) {
    container.innerHTML = `
        <button class="back-btn" onclick="window.location.href='cases.html'">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>
            Back to Cases
        </button>
        <div class="details-card">
            <img src="${animal.image}" alt="${animal.name}">
            <div class="details-content">
                <h2>${animal.name}</h2>
                <p class="info" style="display: flex; align-items: center; gap: 10px;">
                    <strong>Status:</strong> 
                    <span id="animal-status" class="status ${animal.status}" style="margin:0; padding:4px 10px; border-radius:5px; text-transform:capitalize;">${animal.status}</span>
                </p>
                <p class="info"><strong>Location:</strong> ${animal.location}</p>
                <p class="info">${animal.description}</p>

                <div class="actions">
                    ${(() => {
                        const accepted = JSON.parse(localStorage.getItem('acceptedCases')) || [];
                        if (accepted.some(a => a.id === animal.id)) {
                            return '<button id="acceptBtn" class="accept-btn" disabled style="background-color: #00a8ff; color: #fff;">Case Accepted ✅</button>';
                        } else {
                            return '<button id="acceptBtn" class="accept-btn" onclick="acceptCase(' + animal.id + ')">Accept Case</button>';
                        }
                    })()}
                    <button onclick="openContactModal()">Contact</button>
                </div>
            </div>
        </div>
    `;
}

function openContactModal() {
    if (document.getElementById('contactModal')) return;

    const modal = document.createElement('div');
    modal.id = 'contactModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeContactModal()">&times;</button>
            <h3>Contact Info for ${animal.name}</h3>
            <div style="background: var(--bg-color); padding: 15px; border-radius: 0.5em; border: 1px solid var(--line-clr); margin-top: 15px;">
                <p><strong>Owner/Finder:</strong> <br> ${animal.owner.name}</p>
                <hr style="border: 0; height: 1px; background: var(--line-clr); margin: 10px 0;">
                <p><strong>Phone:</strong> <br> 
                    <a href="tel:${animal.owner.phone}" style="color: var(--accent-clr); text-decoration: none; font-weight: bold;">
                        ${animal.owner.phone}
                    </a>
                </p>
                <hr style="border: 0; height: 1px; background: var(--line-clr); margin: 10px 0;">
                <p><strong>Email:</strong> <br> 
                    <a href="mailto:${animal.owner.email}" style="color: var(--accent-clr); text-decoration: none; font-weight: bold;">
                        ${animal.owner.email}
                    </a>
                </p>
            </div>
        </div>
    `;
    
    // Close modal if clicked outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeContactModal();
    });

    document.body.appendChild(modal);
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) modal.remove();
}

function acceptCase(id) {
    const btn = document.getElementById('acceptBtn');
    if (btn) {
        btn.textContent = 'Case Accepted ✅';
        btn.style.backgroundColor = '#00a8ff';
        btn.style.color = '#fff';
        btn.disabled = true;
    }

    // Save case to local storage so Volunteer page can pick it up
    const currentAnimal = cases.find(c => c.id === id);
    if (currentAnimal) {
        let acceptedCases = JSON.parse(localStorage.getItem('acceptedCases')) || [];
        // Prevent duplicate accepts
        if (!acceptedCases.some(a => a.id === id)) {
            // Assign a default progress
            currentAnimal.progressStatus = 'in-progress';
            acceptedCases.push(currentAnimal);
            localStorage.setItem('acceptedCases', JSON.stringify(acceptedCases));
        }
    }

    // Give visual cue
    alert('Thank you! This case has been accepted. You can track and update it in your Volunteer Dashboard.');
    
    // Check if the user wants to jump to volunteer page directly (optional)
    // window.location.href = 'volunteers.html';
}