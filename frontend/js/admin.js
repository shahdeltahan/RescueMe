function initAdmin() {
    loadAdminData();
    initUserManagement();
}
async function loadAdminData() {
    let donations = JSON.parse(localStorage.getItem('rescueMe_donations') || '[]');
    let totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const statDonations = document.getElementById('statDonations');
    const progDonations = document.getElementById('progDonations');
    if (statDonations) {
        statDonations.textContent = `$${totalDonations > 1000 ? (totalDonations/1000).toFixed(1) + 'K' : totalDonations.toFixed(2)}`;
        progDonations.style.width = `${Math.min(100, (totalDonations / 5000) * 100)}%`;
    }
    let reports = [];
    try {
        const token = localStorage.getItem('rescueMe_token');
        const res = await fetch("https://rescueme-backend-jjhr.onrender.com/api/cases", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (res.ok) {
            reports = await res.json();
        }
    } catch(e) {
        console.error("Failed to load reports", e);
    }
    const statCases = document.getElementById('statCases');
    const progCases = document.getElementById('progCases');
    if (statCases) {
        statCases.textContent = reports.length;
        progCases.style.width = `${Math.min(100, (reports.length / 50) * 100)}%`;
    }
    
    let adoptedCount = reports.filter(r => r.status_name === 'Closed' || r.status_name === 'closed').length;
    const statAdoptions = document.getElementById('statAdoptions');
    const progAdoptions = document.getElementById('progAdoptions');
    if (statAdoptions) {
        statAdoptions.textContent = adoptedCount;
        progAdoptions.style.width = `${reports.length > 0 ? (adoptedCount / reports.length) * 100 : 0}%`;
    }

    const reportsContainer = document.getElementById('reportsContainer');
    if (reportsContainer) {
        reportsContainer.innerHTML = '';
        if (reports.length === 0) {
            reportsContainer.innerHTML = '<p style="padding: 20px; color: var(--secondary-text-clr);">No reports found.</p>';
        } else {
            console.log("Reports loaded:", reports);
            reports.forEach(report => {
                const dateStr = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A';
                
                let urgencyClass = 'tag-pending';
                if (report.urgency_level) {
                    const u = report.urgency_level.toLowerCase();
                    if (u === 'high' || u === 'critical') urgencyClass = 'tag-canceled';
                    else if (u === 'low') urgencyClass = 'tag-confirmed';
                }

                let statusClass = 'tag-pending';
                if (report.status_name) {
                    const s = report.status_name.toLowerCase();
                    if (s === 'closed' || s === 'resolved') statusClass = 'tag-confirmed';
                    else if (s === 'in progress' || s === 'in treatment' || s === 'stable') statusClass = 'tag-active';
                }
                
                const html = `
                <div class="table-row" style="grid-template-columns: 0.5fr 1fr 1fr 1.5fr 0.8fr 1fr 1.2fr 1fr; min-width: 800px;">
                    <span class="table-name">#${report.report_id}</span>
                    <span class="table-email">${report.animal_type || 'N/A'}</span>
                    <span class="table-email">${report.animal_condition || 'N/A'}</span>
                    <span class="table-email" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${report.description || ''}">${report.description || 'N/A'}</span>
                    <span class="event-tag ${urgencyClass}">${report.urgency_level || 'N/A'}</span>
                    <span class="event-tag ${statusClass}">${report.status_name || 'Open'}</span>
                    <span class="table-email">${report.reported_by || 'Anonymous'}<br><small>${report.contact_phone || report.contact_email || ''}</small></span>
                    <span class="table-joined">${dateStr}</span>
                </div>`;
                reportsContainer.insertAdjacentHTML('beforeend', html);
            });
        }
    }

    try {
        const token = localStorage.getItem('rescueMe_token');
        const response = await fetch("https://rescueme-backend-jjhr.onrender.com/api/admin/users", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        if (!response.ok) throw new Error("Failed to fetch users");
        const users = await response.json();
        
        window.rescueMe_adminUsers = users;

        const statUsers = document.getElementById('statUsers');
        const progUsers = document.getElementById('progUsers');
        if (statUsers) {
            statUsers.textContent = users.length;
            progUsers.style.width = "100%";
        }

        const userTable = document.getElementById('userManagementRows');
        if (userTable) {
            userTable.innerHTML = '';
            users.forEach((user, index) => {
                const name = user.full_name || 'Unknown';
                const firstLetter = name.charAt(0).toUpperCase();
                const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently';
                const colors = ['purple', 'green', 'orange', 'gray'];
                const colorClass = colors[index % colors.length];
                
                let statusClass = "tag-confirmed";
                if (user.status_name === "locked") statusClass = "tag-pending";
                if (user.status_name === "disabled") statusClass = "tag-canceled";

                const html = `
                <div class="table-row">
                    <div class="table-user-cell">
                        <div class="table-avatar ${colorClass}">${firstLetter}</div>
                        <span class="table-name">${name}</span>
                    </div>
                    <span class="table-email">${user.email || 'N/A'}</span>
                    <span class="table-role" style="text-transform: capitalize;">${user.role_name || 'Volunteer'}</span>
                    <span class="event-tag ${statusClass}" style="text-transform: capitalize;">${user.status_name || 'Active'}</span>
                    <span class="table-joined">${joinedDate}</span>
                    <div class="table-actions">
                        <button class="btn-edit" onclick="openEditUser(${user.user_id})">Edit</button>
                        <button class="btn-del" onclick="deleteUser(${user.user_id})">Del</button>
                    </div>
                </div>`;
                userTable.insertAdjacentHTML('beforeend', html);
            });
        }
    } catch (err) {
        console.error("Error loading users:", err);
        if (typeof showToast === 'function') {
            showToast("Failed to load users from backend", "error");
        }
    }
    const approvalsList = document.getElementById('pendingApprovalsList');
    if (approvalsList) {
        approvalsList.innerHTML = '';
        let hasPendingItems = false;

        const pendingReports = reports.filter(r => r.status_name === 'open' || r.status_name === 'Open');
        if (pendingReports.length > 0) {
            hasPendingItems = true;
            pendingReports.forEach(rep => {
                const dateStr = rep.created_at ? new Date(rep.created_at).toLocaleDateString() : 'Today';
                const typeStr = rep.animal_type ? `Case Report (${rep.animal_type})` : `Case Report`;
                const html = `
                <div class="approval-item" data-id="${rep.report_id}" data-type="case-report">
                    <div>
                        <div class="approval-meta">
                            <span class="approval-tag">${typeStr}</span>
                            <span class="approval-date">${dateStr}</span>
                        </div>
                        <div class="approval-title">CR-${rep.report_id || 'XXX'} - Requires verification</div>
                    </div>
                    <div class="approval-btns">
                        <button class="btn-approve">Approve</button>
                        <button class="btn-reject">Reject</button>
                    </div>
                </div>
                `;
                approvalsList.insertAdjacentHTML('beforeend', html);
            });
        }

        try {
            const token = localStorage.getItem('rescueMe_token');
            const reqResponse = await fetch("https://rescueme-backend-jjhr.onrender.com/api/requests", {
                headers: {
                    "Authorization": "Bearer " + token
                }
            });
            if (reqResponse.ok) {
                const apiRequests = await reqResponse.json();
                const pendingApiRequests = apiRequests.filter(r => r.status === 'pending');
                if (pendingApiRequests.length > 0) {
                    hasPendingItems = true;
                    pendingApiRequests.forEach(req => {
                        const dateStr = req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : 'Today';
                        const typeStr = req.request_type === 'role_change' ? 'Role Change' : (req.request_type === 'account_unlock' ? 'Account Unlock' : 'User Request');
                        const html = `
                        <div class="approval-item" data-id="${req.request_id}" data-type="user-request">
                            <div>
                                <div class="approval-meta">
                                    <span class="approval-tag" style="background-color: var(--accent-clr); color: white;">${typeStr}</span>
                                    <span class="approval-date">${dateStr}</span>
                                </div>
                                <div class="approval-title">${req.title} (by ${req.submitted_by || 'Unknown'})</div>
                                ${req.description ? `<div style="font-size: 0.85rem; color: var(--secondary-text-clr); margin-top: 4px; font-style: italic;">Reason: ${req.description}</div>` : ''}
                            </div>
                            <div class="approval-btns">
                                <button class="btn-approve">Approve</button>
                                <button class="btn-reject">Reject</button>
                            </div>
                        </div>
                        `;
                        approvalsList.insertAdjacentHTML('beforeend', html);
                    });
                }
            }
        } catch (e) {
            console.error("Failed to load user requests", e);
        }

        if (!hasPendingItems) {
            approvalsList.innerHTML = '<p style="padding: 20px; color: var(--secondary-text-clr);">No pending approvals found.</p>';
        }
    }
    bindDynamicButtons();
}
function bindDynamicButtons() {
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => handleApproval(btn, true));
    });
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => handleApproval(btn, false));
    });
    document.querySelectorAll('.report-item').forEach(item => {
        item.style.cursor = 'pointer';
        const clone = item.cloneNode(true);
        item.replaceWith(clone);
        clone.addEventListener('click', () => {
            const title = clone.querySelector('.report-title')?.textContent || 'Report';
            showToast(`Generating: ${title}…`, 'info');
        });
    });
}
async function handleApproval(btn, approved) {
    const approvalItem = btn.closest('.approval-item');
    if (!approvalItem) return;
    const itemId = approvalItem.getAttribute('data-id');
    const itemType = approvalItem.getAttribute('data-type');
    const title = approvalItem.querySelector('.approval-title')?.textContent || 'Item';

    if (itemType === 'user-request') {
        const adminId = localStorage.getItem('rescueMe_user_id');
        if (!adminId) {
            if (typeof showToast === 'function') showToast('You must be logged in as an admin', 'error');
            return;
        }
        try {
            const status = approved ? 'approved' : 'rejected';
            const token = localStorage.getItem('rescueMe_token');
            const response = await fetch(`https://rescueme-backend-jjhr.onrender.com/api/requests/${itemId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ status: status, admin_id: adminId })
            });
            if (response.ok) {
                if (typeof showToast === 'function') {
                    showToast(
                        approved ? `✅ Approved: ${title}` : `❌ Rejected: ${title}`,
                        approved ? 'success' : 'error'
                    );
                }
                approvalItem.style.transition = 'opacity .4s';
                approvalItem.style.opacity    = '0';
                setTimeout(() => approvalItem.remove(), 450);
            } else {
                const errData = await response.json();
                if (typeof showToast === 'function') showToast(errData.error || 'Failed to update request', 'error');
            }
        } catch (e) {
            console.error(e);
            if (typeof showToast === 'function') showToast('Server connection error', 'error');
        }
    } else {
        if (itemId) {
            if (approved) {
                // Open assign volunteer modal
                document.getElementById('assignCaseId').value = itemId;
                document.getElementById('assignCaseTitle').value = title;
                
                const select = document.getElementById('assignVolunteerSelect');
                if (select && window.rescueMe_adminUsers) {
                    select.innerHTML = '<option value="">No assignment</option>';
                    const volunteers = window.rescueMe_adminUsers.filter(u => u.role_name === 'volunteer' && u.status_name === 'active');
                    volunteers.forEach(v => {
                        select.innerHTML += `<option value="${v.user_id}">${v.full_name} (${v.email})</option>`;
                    });
                }
                
                document.getElementById('assignVolunteerModal').hidden = false;
                document.body.classList.add('modal-open');
                
                // Save the approval item DOM element globally so we can remove it later
                window.currentApprovalItem = approvalItem;
            } else {
                try {
                    const token = localStorage.getItem('rescueMe_token');
                    const res = await fetch(`https://rescueme-backend-jjhr.onrender.com/api/cases/${itemId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ status: 'closed' })
                    });
                    if (res.ok) {
                        if (typeof showToast === 'function') {
                            showToast(`❌ Rejected: ${title}`, 'error');
                        }
                        approvalItem.style.transition = 'opacity .4s';
                        approvalItem.style.opacity    = '0';
                        setTimeout(() => {
                            approvalItem.remove();
                            loadAdminData();
                        }, 450);
                    } else {
                        const errData = await res.json();
                        if (typeof showToast === 'function') showToast(errData.message || 'Failed to update case', 'error');
                    }
                } catch (e) {
                    console.error(e);
                    if (typeof showToast === 'function') showToast('Server connection error', 'error');
                }
            }
        }
    }
}

function closeAssignModal() {
    document.getElementById('assignVolunteerModal').hidden = true;
    document.body.classList.remove('modal-open');
}

async function confirmApproveCase() {
    const itemId = document.getElementById('assignCaseId').value;
    const title = document.getElementById('assignCaseTitle').value;
    const volunteerId = document.getElementById('assignVolunteerSelect').value;
    
    try {
        const token = localStorage.getItem('rescueMe_token');
        const res = await fetch(`https://rescueme-backend-jjhr.onrender.com/api/cases/${itemId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ 
                status: 'in_progress',
                volunteer_id: volunteerId || null
            })
        });
        if (res.ok) {
            if (typeof showToast === 'function') {
                showToast(`✅ Approved: ${title}`, 'success');
            }
            if (window.currentApprovalItem) {
                window.currentApprovalItem.style.transition = 'opacity .4s';
                window.currentApprovalItem.style.opacity    = '0';
                setTimeout(() => {
                    window.currentApprovalItem.remove();
                    loadAdminData();
                }, 450);
            }
            closeAssignModal();
        } else {
            const errData = await res.json();
            if (typeof showToast === 'function') showToast(errData.message || 'Failed to update case', 'error');
        }
    } catch (e) {
        console.error(e);
        if (typeof showToast === 'function') showToast('Server connection error', 'error');
    }
}
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to disable this user?')) return;
    const adminId = localStorage.getItem('rescueMe_user_id');
    if (!adminId) {
        if (typeof showToast === 'function') showToast('You must be logged in as an admin', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('rescueMe_token');
        const statusRes = await fetch(`https://rescueme-backend-jjhr.onrender.com/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ new_status: 'disabled', admin_id: adminId })
        });
        if (statusRes.ok) {
            if (typeof showToast === 'function') showToast(`User disabled successfully.`, 'success');
            loadAdminData();
        } else {
            const data = await statusRes.json();
            if (typeof showToast === 'function') showToast(data.error || 'Failed to disable user', 'error');
        }
    } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Server connection error', 'error');
    }
}
function openEditUser(userId) {
    const user = window.rescueMe_adminUsers?.find(u => u.user_id === userId);
    if (!user) return;
    
    document.getElementById('editUserId').value = userId;
    document.getElementById('editName').value = user.full_name || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editRole').value = (user.role_name || 'volunteer').toLowerCase();
    
    const statusSelect = document.getElementById('editStatus');
    if (statusSelect) {
        statusSelect.value = (user.status_name || 'active').toLowerCase();
    }

    document.getElementById('editUserModal').hidden = false;
    document.body.classList.add('modal-open');
}
function closeEditUser() {
    document.getElementById('editUserModal').hidden = true;
    document.body.classList.remove('modal-open');
}
async function saveEditedUser() {
    const userId = document.getElementById('editUserId').value;
    const adminId = localStorage.getItem('rescueMe_user_id');
    const newRole = document.getElementById('editRole').value;
    
    const statusSelect = document.getElementById('editStatus');
    const newStatus = statusSelect ? statusSelect.value : null;

    if (!adminId) {
        if (typeof showToast === 'function') showToast('You must be logged in as an admin', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('rescueMe_token');
        const roleRes = await fetch(`https://rescueme-backend-jjhr.onrender.com/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ new_role: newRole, admin_id: adminId })
        });
        
        let statusOk = true;
        let errorMsg = '';

        if (newStatus) {
            const statusRes = await fetch(`https://rescueme-backend-jjhr.onrender.com/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ new_status: newStatus, admin_id: adminId })
            });
            if (!statusRes.ok) {
                statusOk = false;
                const statusData = await statusRes.json();
                errorMsg = statusData.error || 'Failed to update status';
            }
        }

        if (roleRes.ok && statusOk) {
            if (typeof showToast === 'function') showToast('User updated successfully!', 'success');
            closeEditUser();
            loadAdminData(); 
        } else {
            if (!roleRes.ok) {
                const roleData = await roleRes.json();
                errorMsg = roleData.error || 'Failed to update role';
            }
            if (typeof showToast === 'function') showToast(errorMsg, 'error');
        }
    } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Server connection error', 'error');
    }
}
function initUserManagement() {
    const closeBtn = document.getElementById('closeEditModal');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const saveBtn = document.getElementById('saveUserBtn');
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeEditUser);
        closeBtn.addEventListener('click', closeEditUser);
    }
    if (cancelBtn) {
        cancelBtn.removeEventListener('click', closeEditUser);
        cancelBtn.addEventListener('click', closeEditUser);
    }
    if (saveBtn) {
        saveBtn.removeEventListener('click', saveEditedUser);
        saveBtn.addEventListener('click', saveEditedUser);
    }
    const modal = document.getElementById('editUserModal');
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeEditUser();
        });
    }

    const closeAddBtn = document.getElementById('closeAddModal');
    const cancelAddBtn = document.getElementById('cancelAddBtn');
    const createBtn = document.getElementById('createUserBtn');
    if (closeAddBtn) {
        closeAddBtn.removeEventListener('click', closeAddUser);
        closeAddBtn.addEventListener('click', closeAddUser);
    }
    if (cancelAddBtn) {
        cancelAddBtn.removeEventListener('click', closeAddUser);
        cancelAddBtn.addEventListener('click', closeAddUser);
    }
    if (createBtn) {
        createBtn.removeEventListener('click', createNewUser);
        createBtn.addEventListener('click', createNewUser);
    }
    const addModal = document.getElementById('addUserModal');
    if (addModal) {
        window.addEventListener('click', (e) => {
            if (e.target === addModal) closeAddUser();
        });
    }

    const closeAssignBtn = document.getElementById('closeAssignModal');
    const cancelAssignBtn = document.getElementById('cancelAssignBtn');
    const confirmApproveBtn = document.getElementById('confirmApproveBtn');
    if (closeAssignBtn) {
        closeAssignBtn.removeEventListener('click', closeAssignModal);
        closeAssignBtn.addEventListener('click', closeAssignModal);
    }
    if (cancelAssignBtn) {
        cancelAssignBtn.removeEventListener('click', closeAssignModal);
        cancelAssignBtn.addEventListener('click', closeAssignModal);
    }
    if (confirmApproveBtn) {
        confirmApproveBtn.removeEventListener('click', confirmApproveCase);
        confirmApproveBtn.addEventListener('click', confirmApproveCase);
    }
    const assignModal = document.getElementById('assignVolunteerModal');
    if (assignModal) {
        window.addEventListener('click', (e) => {
            if (e.target === assignModal) closeAssignModal();
        });
    }
}

function openAddUser() {
    document.getElementById('addName').value = '';
    document.getElementById('addEmail').value = '';
    document.getElementById('addPhone').value = '';
    document.getElementById('addPassword').value = '';
    document.getElementById('addRole').value = '';

    document.getElementById('addUserModal').hidden = false;
    document.body.classList.add('modal-open');
}

function closeAddUser() {
    document.getElementById('addUserModal').hidden = true;
    document.body.classList.remove('modal-open');
}

async function createNewUser() {
    const full_name = document.getElementById('addName').value.trim();
    const email = document.getElementById('addEmail').value.trim();
    const phone_number = document.getElementById('addPhone').value.trim();
    const password = document.getElementById('addPassword').value;
    const role = document.getElementById('addRole').value;

    if (!full_name || !email || !password || !role) {
        if (typeof showToast === 'function') showToast('Please fill in all required fields.', 'error');
        return;
    }

    const token = localStorage.getItem('rescueMe_token');

    try {
        const response = await fetch("https://rescueme-backend-jjhr.onrender.com/api/admin/users", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                full_name,
                email,
                phone_number,
                password,
                role
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (typeof showToast === 'function') showToast('User created successfully!', 'success');
            closeAddUser();
            loadAdminData(); 
        } else {
            if (typeof showToast === 'function') showToast(data.error || 'Failed to create user', 'error');
        }
    } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Server connection error', 'error');
    }
}