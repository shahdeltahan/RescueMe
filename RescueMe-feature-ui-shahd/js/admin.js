/* ================ ADMIN PAGE ================ */

function initAdmin() {
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => handleApproval(btn, true));
    });
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => handleApproval(btn, false));
    });

    document.querySelectorAll('.report-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const title = item.querySelector('.report-title')?.textContent || 'Report';
            showToast(`Generating: ${title}…`, 'info');
        });
    });
}

function handleApproval(btn, approved) {
    const approvalItem = btn.closest('.approval-item');
    if (!approvalItem) return;

    const title = approvalItem.querySelector('.approval-title')?.textContent || 'Item';
    showToast(
        approved ? `✅ Approved: ${title}` : `❌ Rejected: ${title}`,
        approved ? 'success' : 'error'
    );

    approvalItem.style.transition = 'opacity .4s';
    approvalItem.style.opacity    = '0';
    setTimeout(() => approvalItem.remove(), 450);
}
