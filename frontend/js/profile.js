document.addEventListener('DOMContentLoaded', function () {
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarError = document.getElementById('avatarError');
    const fullName = document.getElementById('fullName');
    const emailAddr = document.getElementById('emailAddr');
    const phoneNum = document.getElementById('phoneNum');
    const addressField = document.getElementById('addressField');
    const bioText = document.getElementById('bioText');
    const bioCount = document.getElementById('bioCount');
    const saveBtn = document.getElementById('saveProfileBtn');
    const saveFeedback = document.getElementById('saveFeedback');
    const deletePhotoBtn = document.getElementById('deletePhotoBtn');
    const currentRoleDisplay = document.getElementById('currentRoleDisplay');
    let currentAvatarData = '';

    if (currentRoleDisplay) {
        currentRoleDisplay.textContent = localStorage.getItem('rescueMe_role') || 'Unknown';
    }

    // Load from database if token exists
    const token = localStorage.getItem("rescueMe_token");
    if (token) {
        fetch("https://rescueme-backend-jjhr.onrender.com/api/auth/profile", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load profile');
            return res.json();
        })
        .then(data => {
            if (data.full_name) fullName.value = data.full_name;
            if (data.email) emailAddr.value = data.email;
            if (data.phone_number) phoneNum.value = data.phone_number;
            if (data.address) addressField.value = data.address;
            if (data.bio) {
                bioText.value = data.bio;
                bioCount.textContent = data.bio.length;
            }
            if (data.profile_picture) {
                currentAvatarData = data.profile_picture;
                setAvatarImage(currentAvatarData);
                const avatarEl = document.getElementById('avatarEl');
                const dropAvatarEl = document.getElementById('dropAvatarEl');
                [avatarEl, dropAvatarEl].forEach(el => {
                    if (el) {
                        el.innerHTML = `<img src="${currentAvatarData}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                    }
                });
            }
            const profileName = document.getElementById('profileName');
            const dropName = document.getElementById('dropName');
            if (profileName) profileName.textContent = data.full_name || 'User';
            if (dropName) dropName.textContent = data.full_name || 'User';
        })
        .catch(console.error);
    } else {
        // Fallback for no token
        const saved = JSON.parse(localStorage.getItem('rescueMe_profile') || '{}');
        if (!saved.name) saved.name = localStorage.getItem('rescueMe_name') || '';
        currentAvatarData = localStorage.getItem('rescueMe_avatar') || '';
        if (saved.name) fullName.value = saved.name;
        if (saved.email) emailAddr.value = saved.email;
        if (saved.phone) phoneNum.value = saved.phone;
        if (saved.address) addressField.value = saved.address;
        if (saved.bio) {
            bioText.value = saved.bio;
            bioCount.textContent = saved.bio.length;
        }
        if (currentAvatarData) setAvatarImage(currentAvatarData);
    }

    bioText.addEventListener('input', function () {
        bioCount.textContent = bioText.value.length;
    });
    avatarInput.addEventListener('change', function () {
        const file = avatarInput.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            avatarError.hidden = false;
            avatarInput.value = '';
            if (typeof showToast === 'function') {
                showToast('File exceeds 2MB limit.', 'error');
            }
            return;
        }
        avatarError.hidden = true;
        const reader = new FileReader();
        reader.onload = function (e) {
            currentAvatarData = e.target.result;
            setAvatarImage(currentAvatarData);
        };
        reader.readAsDataURL(file);
    });
    if (deletePhotoBtn) {
        deletePhotoBtn.addEventListener('click', function () {
            currentAvatarData = '';
            avatarInput.value = '';
            avatarError.hidden = true;
            const existing = avatarPreview.querySelector('img');
            if (existing) existing.remove();
            const svg = avatarPreview.querySelector('svg');
            if (svg) svg.style.display = 'block';
            if (typeof showToast === 'function') {
                showToast('Photo removed from preview. Click Save to persist.', 'info');
            }
        });
    }
    saveBtn.addEventListener('click', async function () {
        const nameVal = fullName.value.trim();
        const emailVal = emailAddr.value.trim();
        const phoneVal = phoneNum.value.trim();
        if (!nameVal) {
            if (typeof showToast === 'function') showToast('Full Name cannot be empty.', 'error');
            fullName.focus();
            return;
        }
        if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            if (typeof showToast === 'function') showToast('Please enter a valid email address.', 'error');
            emailAddr.focus();
            return;
        }
        if (phoneVal && !/^\+?[\d\s\-]{8,15}$/.test(phoneVal)) {
            if (typeof showToast === 'function') showToast('Please enter a valid phone number (8-15 digits).', 'error');
            phoneNum.focus();
            return;
        }

        if (!token) {
            if (typeof showToast === 'function') showToast('Please login first to save to database.', 'error');
            return;
        }

        const profileData = {
            full_name: nameVal,
            email: emailVal,
            phone_number: phoneVal,
            address: addressField.value.trim(),
            bio: bioText.value.trim(),
            profile_picture: currentAvatarData
        };

        try {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.7';
            const response = await fetch("https://rescueme-backend-jjhr.onrender.com/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });
            const data = await response.json();
            
            if (response.ok) {
                // Update local storage variables just in case other scripts use them
                localStorage.setItem('rescueMe_name', profileData.full_name);
                localStorage.setItem('rescueMe_email', profileData.email);
                
                const profileName = document.getElementById('profileName');
                const dropName = document.getElementById('dropName');
                const avatarEl = document.getElementById('avatarEl');
                const dropAvatarEl = document.getElementById('dropAvatarEl');
                
                if (profileName) profileName.textContent = profileData.full_name || 'User';
                if (dropName) dropName.textContent = profileData.full_name || 'User';
                
                [avatarEl, dropAvatarEl].forEach(el => {
                    if (el) {
                        if (currentAvatarData) {
                            el.innerHTML = `<img src="${currentAvatarData}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                        } else {
                            el.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px">
                                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 129-46.5T480-440q68 0 135 15.5T744-378q29 15 46.5 43.5T808-272v112H160Z" />
                                </svg>`;
                        }
                    }
                });
                
                if (typeof showToast === 'function') {
                    showToast('Profile saved successfully to database!', 'success');
                } else {
                    saveFeedback.hidden = false;
                    setTimeout(function () { saveFeedback.hidden = true; }, 3000);
                }
            } else {
                if (typeof showToast === 'function') showToast(data.error || 'Failed to update profile', 'error');
            }
        } catch (err) {
            console.error("Update profile error:", err);
            if (typeof showToast === 'function') showToast("Server connection error", 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        }
    });
    function setAvatarImage(src) {
        const existing = avatarPreview.querySelector('img');
        if (existing) existing.remove();
        const svg = avatarPreview.querySelector('svg');
        if (svg) svg.style.display = 'none';
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Profile photo';
        avatarPreview.appendChild(img);
    }

    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async function () {
            if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                const token = localStorage.getItem("rescueMe_token");
                if (token) {
                    try {
                        const response = await fetch("https://rescueme-backend-jjhr.onrender.com/api/auth/delete", {
                            method: "DELETE",
                            headers: {
                                "Authorization": `Bearer ${token}`
                            }
                        });
                        const data = await response.json();
                        if (response.ok) {
                            if (typeof showToast === 'function') {
                                showToast('Account deleted successfully.', 'success');
                            } else {
                                alert("Account deleted successfully.");
                            }
                        } else {
                            if (typeof showToast === 'function') {
                                showToast(data.error || 'Failed to delete account', 'error');
                            } else {
                                alert(data.error || 'Failed to delete account');
                            }
                            // Don't log them out if it failed, unless we want to
                            return;
                        }
                    } catch (err) {
                        console.error("Delete account error:", err);
                        if (typeof showToast === 'function') {
                            showToast("Server connection error", 'error');
                        } else {
                            alert("Server connection error");
                        }
                        return;
                    }
                }
                
                // Clear local storage and redirect
                localStorage.removeItem("rescueMe_token");
                localStorage.removeItem("rescueMe_name");
                localStorage.removeItem("rescueMe_role");
                localStorage.removeItem("rescueMe_email");
                localStorage.removeItem("rescueMe_profile");
                localStorage.removeItem("rescueMe_avatar");
                
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            }
        });
    }

    const submitRoleRequestBtn = document.getElementById('submitRoleRequestBtn');
    if (submitRoleRequestBtn) {
        submitRoleRequestBtn.addEventListener('click', async function() {
            const selectEl = document.getElementById('requestRoleSelect');
            const reasonEl = document.getElementById('requestRoleReason');
            const feedbackEl = document.getElementById('roleRequestFeedback');
            
            const newRole = selectEl.value;
            const reason = reasonEl.value.trim();
            
            if (!newRole) {
                if (typeof showToast === 'function') showToast('Please select a new role.', 'error');
                return;
            }
            
            const userId = localStorage.getItem('rescueMe_user_id');
            if (!userId) {
                if (typeof showToast === 'function') showToast('You must be logged in to submit a request.', 'error');
                return;
            }

            try {
                submitRoleRequestBtn.disabled = true;
                submitRoleRequestBtn.style.opacity = '0.7';

                const payload = {
                    user_id: userId,
                    request_type: 'role_change',
                    title: `Role change request to ${newRole}`,
                    description: reason
                };

                const response = await fetch("https://rescueme-backend-jjhr.onrender.com/api/requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    if (typeof showToast === 'function') {
                        showToast('Role change request submitted successfully!', 'success');
                    } else {
                        feedbackEl.hidden = false;
                        setTimeout(() => { feedbackEl.hidden = true; }, 3000);
                    }
                    selectEl.value = '';
                    reasonEl.value = '';
                } else {
                    const data = await response.json();
                    if (typeof showToast === 'function') showToast(data.error || 'Failed to submit request', 'error');
                }
            } catch (err) {
                console.error(err);
                if (typeof showToast === 'function') showToast('Server connection error', 'error');
            } finally {
                submitRoleRequestBtn.disabled = false;
                submitRoleRequestBtn.style.opacity = '1';
            }
        });
    }
});