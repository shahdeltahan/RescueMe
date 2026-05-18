document.addEventListener("DOMContentLoaded", () => {
    // Determine the current page
    const pathArray = window.location.pathname.split('/');
    let currentPage = pathArray[pathArray.length - 1] || 'index.html';

    // Allow unauthenticated access to login and signup pages
    if (currentPage === 'login.html' || currentPage === 'signup.html' || currentPage === 'index.html') {
        return;
    }

    const role = localStorage.getItem("rescueMe_role");
    
    // Redirect to login if no role is found
    if (!role) {
        window.location.href = "login.html";
        return;
    }

    const normalizedRole = role.toLowerCase();

    // Define allowed pages for each role
    const rolePermissions = {
        reporter: ['sidebar.html', 'cases.html', 'report-animal.html', 'donate.html', 'notifications.html', 'profile.html', 'cases_details.html'],
        volunteer: ['sidebar.html', 'cases.html', 'volunteers.html', 'donate.html', 'notifications.html', 'profile.html', 'cases_details.html'],
        vet: ['sidebar.html', 'veterinary.html', 'cases.html', 'donate.html', 'notifications.html', 'profile.html', 'cases_details.html'],
        adopter: ['sidebar.html', 'cases.html', 'adoption.html', 'donate.html', 'notifications.html', 'profile.html', 'cases_details.html'],
        admin: ['sidebar.html', 'admin.html', 'report-animal.html', 'cases.html', 'volunteers.html', 'veterinary.html', 'adoption.html', 'notifications.html', 'profile.html', 'cases_details.html']
    };

    const allowedPages = rolePermissions[normalizedRole] || [];

    // Redirect if the user tries to access an unauthorized page
    if (!allowedPages.includes(currentPage)) {
        window.location.href = "sidebar.html"; // Redirect to dashboard
        return;
    }

    // Hide unauthorized sidebar items
    const sidebarLinks = document.querySelectorAll("#sidebar ul li a");
    sidebarLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href && !allowedPages.includes(href)) {
            const parentLi = link.closest("li");
            if (parentLi) {
                parentLi.style.display = "none";
            }
        }
    });

    // Handle header "Donate" button specifically, if it exists
    const donateBtn = document.querySelector(".nav-right .btn-donate");
    if (donateBtn) {
        if (!allowedPages.includes("donate.html")) {
            donateBtn.style.display = "none";
        }
    }
});