const API_BASE = API_BASE_URL + "/api";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("rescueMe_token") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("rescueMe_token") ||
    sessionStorage.getItem("jwt")
  );
}

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const container = document.getElementById("detailsContainer");

document.addEventListener("DOMContentLoaded", function () {
  loadCaseDetails();
});

async function loadCaseDetails() {
  if (!container) return;

  const token = getToken();

  if (!token) {
    container.innerHTML = "<p>Please login to view case details.</p>";
    return;
  }

  if (!id) {
    container.innerHTML = "<p>Case ID not found.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/cases/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const animal = await res.json();

    if (!res.ok) {
      throw new Error(animal.message || animal.error || "Failed to load case details.");
    }

    renderCaseDetails(animal);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p>${error.message || "Failed to load case details."}</p>`;
  }
}

function renderCaseDetails(animal) {
  const name = animal.animal_type || "Unknown Animal";
  const status = animal.status_name || animal.animal_condition || "unknown";
  const image =
    animal.image_url ||
    "https://placehold.co/600x400/333333/888888?text=No+Photo";
  
  const statusClass = status.toLowerCase().replace(/\s+/g, '-');

  const userRole = (localStorage.getItem("rescueMe_role") || "").toLowerCase();
  const canAccept = userRole === "admin" || userRole === "volunteer";
  const alreadyAccepted = status === "in_progress";

  container.innerHTML = `
    <button class="back-btn" onclick="window.location.href='cases.html'">
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
        <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/>
      </svg>
      Back to Cases
    </button>

    <div class="details-card">
      <img src="${image}" alt="${name}">

      <div class="details-content">
        <h2>${name}</h2>

        <p class="info" style="display: flex; align-items: center; gap: 10px;">
          <strong>Status:</strong>
          <span id="animal-status" class="status ${statusClass}" style="margin:0; padding:4px 10px; border-radius:5px; text-transform:capitalize;">
            ${status}
          </span>
        </p>

        <p class="info"><strong>Condition:</strong> ${animal.animal_condition || "Unknown"}</p>
        <p class="info"><strong>Urgency:</strong> ${animal.urgency_level || "Unknown"}</p>
        <p class="info"><strong>Location:</strong> ${animal.location || "Unknown location"}</p>
        <p class="info">${animal.description || "No description provided."}</p>

        <div class="actions">
          ${
            canAccept
              ? alreadyAccepted
                ? '<button id="acceptBtn" class="accept-btn" disabled style="background-color: #00a8ff; color: #fff;">Case Accepted ✅</button>'
                : `<button id="acceptBtn" class="accept-btn" onclick="acceptCase('${animal.report_id}')">Accept Case</button>`
              : ""
          }

          <button onclick="openContactModal()">Contact</button>
        </div>
      </div>
    </div>
  `;

  window.currentCase = animal;
}

function openContactModal() {
  const animal = window.currentCase;

  if (!animal) return;
  if (document.getElementById("contactModal")) return;

  const name = animal.animal_type || "Unknown Animal";

  const modal = document.createElement("div");
  modal.id = "contactModal";
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="closeContactModal()">&times;</button>

      <h3>Contact Info for ${name}</h3>

      <div style="background: var(--bg-color); padding: 15px; border-radius: 0.5em; border: 1px solid var(--line-clr); margin-top: 15px;">
        <p><strong>Owner/Finder:</strong><br>${animal.reported_by || "Anonymous"}</p>

        <hr style="border: 0; height: 1px; background: var(--line-clr); margin: 10px 0;">

        <p><strong>Phone:</strong><br>
          <a href="tel:${animal.contact_phone || ""}" style="color: var(--accent-clr); text-decoration: none; font-weight: bold;">
            ${animal.contact_phone || "Not provided"}
          </a>
        </p>

        <hr style="border: 0; height: 1px; background: var(--line-clr); margin: 10px 0;">

        <p><strong>Email:</strong><br>
          <a href="mailto:${animal.contact_email || ""}" style="color: var(--accent-clr); text-decoration: none; font-weight: bold;">
            ${animal.contact_email || "Not provided"}
          </a>
        </p>
      </div>
    </div>
  `;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeContactModal();
  });

  document.body.appendChild(modal);
}

function closeContactModal() {
  const modal = document.getElementById("contactModal");
  if (modal) modal.remove();
}

async function acceptCase(id) {
  const token = getToken();

  if (!token) {
    alert("Login token not found. Please login again.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/volunteers/cases/${id}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || "Failed to accept case.");
    }

    const btn = document.getElementById("acceptBtn");

    if (btn) {
      btn.textContent = "Case Accepted ✅";
      btn.style.backgroundColor = "#00a8ff";
      btn.style.color = "#fff";
      btn.disabled = true;
    }

    const statusEl = document.getElementById("animal-status");
    if (statusEl) {
      statusEl.textContent = "in_progress";
    }

    alert("Thank you! This case has been accepted.");
  } catch (error) {
    console.error(error);
    alert(error.message || "Failed to accept case.");
  }
}