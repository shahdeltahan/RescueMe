let activeCause = "Medical Care";

const API_BASE = "https://rescueme-backend-jjhr.onrender.com/api";

const campaignMap = {
  "Medical Care": 1,
  "Shelter": 2,
  "Food": 3,
  "Rescue": 4,
};

function getToken() {
  return (
    sessionStorage.getItem("rescueMe_token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("rescueMe_token") ||
    localStorage.getItem("token")
  );
}

function showMsg(message, type = "info") {
  if (typeof showToast === "function") {
    showToast(message, type);
  } else {
    alert(message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initDonate();
  loadDonateData();
});

function initDonate() {
  const donateBtn =
    document.getElementById("donateNowBtn") ||
    document.querySelector(".donate-now-btn");

  if (donateBtn) {
    donateBtn.addEventListener("click", handleDonateSubmit);
  }

  initAmountButtons();
  initCauseButtons();
  initPaymentMethodButtons();
  initPaymentInputsValidation();
}

function initAmountButtons() {
  document.querySelectorAll(".donate-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".donate-btn").forEach((b) => {
        b.classList.remove("active");
        b.style.border = "1px solid var(--line-clr)";
        b.style.background = "var(--base-clr)";
        b.style.color = "var(--text-clr)";
      });

      btn.classList.add("active");
      btn.style.border = "2px solid var(--accent-clr)";
      btn.style.background = "rgba(94,99,255,.12)";
      btn.style.color = "var(--accent-clr)";

      const amount = btn.textContent.replace("$", "").trim();
      const customInput = document.getElementById("custom-amount");
      if (customInput) customInput.value = amount;
    });
  });
}

function initCauseButtons() {
  document.querySelectorAll(".cause-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cause-btn").forEach((b) => {
        b.classList.remove("active");
        b.style.border = "1px solid var(--line-clr)";
        b.style.background = "var(--base-clr)";
        b.style.color = "var(--text-clr)";
      });

      btn.classList.add("active");
      btn.style.border = "2px solid var(--accent-clr)";
      btn.style.background = "rgba(94,99,255,.12)";
      btn.style.color = "var(--accent-clr)";

      activeCause = btn.textContent.replace(/[^\w\s-]/g, "").trim();
    });
  });
}

function initPaymentMethodButtons() {
  document.querySelectorAll(".payment-method-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".payment-method-btn").forEach((b) => {
        b.classList.remove("selected-payment");
        b.style.border = "1px solid var(--line-clr)";
        b.style.background = "var(--base-clr)";
        b.style.color = "var(--text-clr)";
      });

      btn.classList.add("selected-payment");
      btn.style.border = "2px solid var(--accent-clr)";
      btn.style.background = "rgba(94,99,255,.12)";
      btn.style.color = "var(--accent-clr)";

      updatePaymentFields();
    });
  });

  updatePaymentFields();
}

function getSelectedPaymentMethod() {
  const selectedBtn = document.querySelector(".payment-method-btn.selected-payment");
  return selectedBtn ? selectedBtn.dataset.method : "credit_card";
}

function updatePaymentFields() {
  const method = getSelectedPaymentMethod();

  const cardFields = document.getElementById("cardFields");
  const walletFields = document.getElementById("walletFields");
  const cashFields = document.getElementById("cashFields");

  if (cardFields) cardFields.style.display = method === "credit_card" ? "block" : "none";
  if (walletFields) walletFields.style.display = method === "wallet" ? "block" : "none";
  if (cashFields) cashFields.style.display = method === "cash" ? "block" : "none";
}

function initPaymentInputsValidation() {
  const cardNumberInput = document.getElementById("cardNumber");
  const cardExpiryInput = document.getElementById("cardExpiry");
  const cardCVVInput = document.getElementById("cardCVV");

  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", () => {
      let value = cardNumberInput.value.replace(/\D/g, "").slice(0, 19);
      value = value.replace(/(.{4})/g, "$1 ").trim();
      cardNumberInput.value = value;
    });
  }

  if (cardExpiryInput) {
    cardExpiryInput.addEventListener("input", () => {
      let value = cardExpiryInput.value.replace(/\D/g, "").slice(0, 4);
      if (value.length >= 3) {
        value = `${value.slice(0, 2)}/${value.slice(2)}`;
      }
      cardExpiryInput.value = value;
    });
  }

  if (cardCVVInput) {
    cardCVVInput.addEventListener("input", () => {
      cardCVVInput.value = cardCVVInput.value.replace(/\D/g, "").slice(0, 4);
    });
  }
}

function isValidCardNumber(cardNumber) {
  return /^\d{12,19}$/.test(cardNumber);
}

function isValidExpiry(expiry) {
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
}

function isValidCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

function getPaymentDetails(paymentMethod) {
  if (paymentMethod === "credit_card") {
    const cardNumber = document.getElementById("cardNumber")?.value.trim() || "";
    const cardExpiry = document.getElementById("cardExpiry")?.value.trim() || "";
    const cardCVV = document.getElementById("cardCVV")?.value.trim() || "";

    const digitsOnly = cardNumber.replace(/\D/g, "");

    if (!isValidCardNumber(digitsOnly)) {
      throw new Error("Please enter a valid card number.");
    }

    if (!isValidExpiry(cardExpiry)) {
      throw new Error("Please enter expiry date like 12/29.");
    }

    if (!isValidCVV(cardCVV)) {
      throw new Error("Please enter a valid CVV.");
    }

    return {
      masked_account: `****-****-****-${digitsOnly.slice(-4)}`,
      gateway_token: `card-token-${Date.now()}`,
    };
  }

  if (paymentMethod === "wallet") {
    const walletAccount = document.getElementById("walletAccount")?.value.trim() || "";

    if (!walletAccount) {
      throw new Error("Please enter wallet phone number or email.");
    }

    return {
      masked_account: walletAccount,
      gateway_token: `wallet-token-${Date.now()}`,
    };
  }

  return {
    masked_account: "cash-payment",
    gateway_token: `cash-token-${Date.now()}`,
  };
}

async function handleDonateSubmit() {
  const amountInput = document.getElementById("custom-amount");
  let amount = amountInput ? parseFloat(amountInput.value) : 0;

  if (!amount || amount <= 0) {
    const activeAmountBtn = document.querySelector(".donate-btn.active");
    if (activeAmountBtn) {
      amount = parseFloat(activeAmountBtn.textContent.replace("$", "").trim());
    }
  }

  if (!amount || amount <= 0) {
    showMsg("Please select or enter a donation amount.", "error");
    return;
  }

  const token = getToken();

  if (!token) {
    showMsg("Login token not found. Please login again.", "error");
    return;
  }

  try {
    const payment_method = getSelectedPaymentMethod();
    const paymentDetails = getPaymentDetails(payment_method);

    const paymentData = {
      amount,
      payment_type: "donation",
      payment_method,
      campaign_id: campaignMap[activeCause] || 1,
      masked_account: paymentDetails.masked_account,
      gateway_token: paymentDetails.gateway_token,
    };

    const res = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || "Donation failed.");
    }

    showMsg(`Thank you for your donation of $${amount.toFixed(2)}! 🐾`, "success");

    if (amountInput) amountInput.value = "";

    await loadDonateData();
  } catch (error) {
    console.error("Donation error:", error);
    showMsg(error.message || "Donation failed.", "error");
  }
}

async function fetchDonations() {
  const token = getToken();

  if (!token) return [];

  const res = await fetch(`${API_BASE}/payments/my`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const rows = Array.isArray(data) ? data : data.payments || data.donations || [];

  return rows.filter((item) => {
    return item.payment_type === "donation" || item.donation_id;
  });
}

async function loadDonateData() {
  try {
    const donations = await fetchDonations();

    const formattedDonations = donations.map((d) => ({
      amount: Number(d.amount || 0),
      cause: d.campaign_title || d.title || d.cause || "Medical Care",
      date: d.donated_at || d.created_at || d.date || new Date().toISOString(),
    }));

    const total = formattedDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const count = formattedDonations.length;

    const raisedEl = document.getElementById("donateTotalRaised");
    if (raisedEl) raisedEl.textContent = `$${total.toFixed(2)}`;

    const progRaisedEl = document.getElementById("donateProgRaised");
    if (progRaisedEl) progRaisedEl.style.width = `${Math.min(100, (total / 5000) * 100)}%`;

    const donorsEl = document.getElementById("donateTotalDonors");
    if (donorsEl) donorsEl.textContent = count;

    const animalsEl = document.getElementById("donateAnimalsHelped");
    if (animalsEl) animalsEl.textContent = count;

    const myTotalDonated = document.getElementById("myTotalDonated");
    if (myTotalDonated) myTotalDonated.textContent = `$${total.toFixed(2)}`;

    const myDonationsCount = document.getElementById("myDonationsCount");
    if (myDonationsCount) myDonationsCount.textContent = count;

    const myDonationsList = document.getElementById("myDonationsList");
    if (myDonationsList) {
      myDonationsList.innerHTML = "";

      if (!formattedDonations.length) {
        myDonationsList.innerHTML =
          '<p style="padding: 10px; color: var(--secondary-text-clr);">No donations yet. Make one to save lives!</p>';
      } else {
        formattedDonations.reverse().forEach((d) => {
          const row = document.createElement("div");
          row.className = "activity-item";
          row.innerHTML = `
            <div class="activity-text">
              <div><strong>${d.cause}</strong></div>
              <div class="activity-time">${new Date(d.date).toLocaleDateString()}</div>
            </div>
            <span class="donation-amount">$${Number(d.amount).toFixed(2)}</span>
          `;
          myDonationsList.appendChild(row);
        });
      }
    }

    renderTransparency(total, count);
  } catch (error) {
    console.error("Load donations error:", error);
  }
}

function renderTransparency(total, count) {
  const transContent = document.getElementById("transparencyContent");

  if (transContent) {
    transContent.innerHTML = `
      <div class="section-label" style="margin-bottom:10px;">How Funds Are Used</div>

      <div style="margin-bottom:10px;">
        <div class="progress-label-row">
          <span>🏥 Medical Care</span>
          <span style="color:var(--accent-clr);">45%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:45%;"></div>
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <div class="progress-label-row">
          <span>🏠 Shelter & Housing</span>
          <span style="color:var(--success-clr);">25%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill green" style="width:25%;"></div>
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <div class="progress-label-row">
          <span>🍽️ Food & Supplies</span>
          <span style="color:var(--warning-clr);">20%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill orange" style="width:20%;"></div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div class="progress-label-row">
          <span>⚙️ Operations</span>
          <span style="color:var(--secondary-text-clr);">10%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:10%;background:var(--secondary-text-clr);"></div>
        </div>
      </div>
    `;
  }

  const transGrid = document.getElementById("transparencyGrid");

  if (transGrid) {
    const spent = total * 0.85;
    const balance = total - spent;

    transGrid.innerHTML = `
      <div class="transparency-stat">
        <div class="transparency-stat-val">$${total.toFixed(2)}</div>
        <div class="transparency-stat-label">Total Raised</div>
      </div>
      <div class="transparency-stat">
        <div class="transparency-stat-val">${count}</div>
        <div class="transparency-stat-label">Total Donors</div>
      </div>
      <div class="transparency-stat">
        <div class="transparency-stat-val green">$${spent.toFixed(2)}</div>
        <div class="transparency-stat-label">Funds Spent</div>
      </div>
      <div class="transparency-stat">
        <div class="transparency-stat-val blue">$${balance.toFixed(2)}</div>
        <div class="transparency-stat-label">Balance</div>
      </div>
    `;
  }
}