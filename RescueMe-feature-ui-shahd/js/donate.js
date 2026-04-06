
/* ================ DONATE PAGE ================ */
 

function selectAmount(btn, amount) {
    document.querySelectorAll('.panel button[onclick^="selectAmount"]').forEach(b => {
        b.style.border     = '1px solid var(--line-clr)';
        b.style.background = 'var(--base-clr)';
        b.style.color      = 'var(--text-clr)';
    });
    btn.style.border     = '2px solid var(--accent-clr)';
    btn.style.background = 'rgba(94,99,255,.12)';
    btn.style.color      = 'var(--accent-clr)';

    const customInput = document.getElementById('custom-amount');
    if (customInput) customInput.value = amount;
}

function selectCause(btn) {
    document.querySelectorAll('.panel button[onclick^="selectCause"]').forEach(b => {
        b.style.border     = '1px solid var(--line-clr)';
        b.style.background = 'var(--base-clr)';
        b.style.color      = 'var(--text-clr)';
    });
    btn.style.border     = '2px solid var(--accent-clr)';
    btn.style.background = 'rgba(94,99,255,.12)';
    btn.style.color      = 'var(--accent-clr)';
}

function initDonate() {
    const donateBtn = document.getElementById('donate-btn') || document.querySelector('.donate-btn');
    if (donateBtn) donateBtn.addEventListener('click', handleDonateSubmit);

    document.querySelectorAll('.panel-action').forEach(btn => {
        if (btn.textContent.includes('Full Report')) {
            btn.addEventListener('click', () => showToast('Full transparency report coming soon!', 'info'));
        }
    });
}

function handleDonateSubmit() {
    const amountInput = document.getElementById('custom-amount');
    const amount      = amountInput ? parseFloat(amountInput.value) : 0;

    if (!amount || amount <= 0) {
        showToast('Please select or enter a donation amount.', 'error');
        return;
    }
    showToast(`Thank you for your donation of $${amount.toFixed(2)}! 🐾`, 'success');
    if (amountInput) amountInput.value = '';
    document.querySelectorAll('.panel button[onclick^="selectAmount"]').forEach(b => {
        b.style.border     = '1px solid var(--line-clr)';
        b.style.background = 'var(--base-clr)';
        b.style.color      = 'var(--text-clr)';
    });
}