const toggleButton = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");

function toggleSidebar() {
    sidebar.classList.toggle("close");
    toggleButton.classList.toggle("rotate");
    //lw 2falt el sidebar w el dropdown-btn mfto7en by2flhom w y2fel el sidebar
    Array.from(sidebar.getElementsByClassName("show")).forEach((ul) => {
        ul.classList.remove("show");
        ul.previousElementSibling.classList.remove("rotate");
    });
}

function toggleSubmenu(button) {
    button.nextElementSibling.classList.toggle("show");
    button.classList.toggle("rotate");
    //lw 3mlt close lel sidebar w 7atait dropdown-btn el submenu mykonsh bayen
    if (sidebar.classList.contains('close')) {
        sidebar.classList.toggle('close');
        toggleButton.classList.toggle('rotate');
        
    }
}

//validation
const form = document.getElementById('form');
const fullname_input=document.getElementById('fullname-input');
const email_input=document.getElementById('email-input');
const phone_input=document.getElementById('phone-input');
const password_input=document.getElementById('password-input');
const confirm_password_input=document.getElementById('confirm-password-input');
const role_input = document.getElementById('role-input');
const error_message=document.getElementById('error-message')


form.addEventListener('submit', (e) =>{
   let errors= []

   if(fullname_input){
    //if we have fullname input then we are in thr sign up
    //trim() removes whitespace from both sides of a string
    errors = getSignupFormErrors(fullname_input.value.trim() , email_input.value.trim(), phone_input? phone_input.value.trim() : "", password_input.value, confirm_password_input? confirm_password_input.value: "", role_input? role_input.value : "")
   }
   else{
    //if we don't have full name input then we are in the login
    errors = getLoginFormErrors(email_input.value.trim(), password_input.value)
   }

   if(errors.length > 0){
    //if there are any errors
    e.preventDefault()
    error_message.innerText = errors.join(". ")
    //scrollIntoView on error so users on mobile always see the error message
    error_message.scrollIntoView({ behavior: "smooth", block: "center" });
   }else {
        // ✅ Redirect is here — where e is accessible
        e.preventDefault();
        if (fullname_input) {
            window.location.href = "login.html";   // signup → go to login
        } else {
            window.location.href = "sidebar.html"; // login → go to dashboard
        }
    }
})
function getSignupFormErrors(fullname,email, phone, password, confirmPassword, role){
    let errors = []

    if(fullname === '' || fullname == null){
        errors.push('Fullname is required')
        fullname_input.parentElement.classList.add('incorrect')

    }
     if(email === '' || email ==null){
        errors.push('Email is required')
        email_input.parentElement.classList.add('incorrect')  
    }

     if (phone_input) {
     if (!phone) {
     errors.push("Phone number is required");
     phone_input.parentElement.classList.add("incorrect");
    } else if (!/^\+?[\d\s\-]{10,15}$/.test(phone)) {
        errors.push("Phone number must be 10–15 digits");
        phone_input.parentElement.classList.add("incorrect");
        }
        }
    if(password === '' || password == null){
    errors.push('Password is required')
    password_input.parentElement.classList.add('incorrect')
    }
    else if(password.length < 8){
    errors.push('Password must have at least 8 characters')
    password_input.parentElement.classList.add('incorrect')
    }
    else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push("Password must contain a letter and a number");
    password_input.parentElement.classList.add("incorrect");
    }
    if(confirmPassword === '' || confirmPassword == null){
    errors.push('Please confirm your password')
    confirm_password_input.parentElement.classList.add('incorrect')
    }
    else if(password !== confirmPassword){
    errors.push('Passwords do not match')
    confirm_password_input.parentElement.classList.add('incorrect')
    }  
    if (role_input && !role) {
    errors.push("Please select a role");
    role_input.parentElement.classList.add("incorrect");
    }
    return errors;
}

function getLoginFormErrors(email, password){
   let errors =[] 
    if(email === '' || email ==null){
        errors.push('Email is required')
        email_input.parentElement.classList.add('incorrect') 
    }

    if(password=== '' || password==null){
        errors.push('Password is required')
        password_input.parentElement.classList.add('incorrect')
    }   
    return errors;
}
    const allInputs=[
    fullname_input, email_input, phone_input, password_input, confirm_password_input,role_input,
    ].filter(input => input != null);

allInputs.forEach((input) => {
    input.addEventListener("input", () => {
        if (input.parentElement.classList.contains("incorrect")) {
            input.parentElement.classList.remove("incorrect");
        }
        const anyIncorrect = allInputs.some((i) =>
            i.parentElement.classList.contains("incorrect")
        );
        if (!anyIncorrect) {
            error_message.innerText = "";
        }
    });
});

/* ── report-animal.js ────────────────────────────────────────
   Handles all interactions on the Report Animal page:
   - Image upload + drag-and-drop preview
   - Urgency select color change
   - Form validation + submit
──────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {

    /* ── 1. Image upload via click ── */
    var imgInput   = document.getElementById('image-input');
    var preview    = document.getElementById('image-preview');
    var uploadArea = document.querySelector('.upload-area');

    if (imgInput && preview) {
        imgInput.addEventListener('change', function () {
            var file = imgInput.files[0];
            if (file && file.type.startsWith('image/')) {
                showPreview(file);
            }
        });
    }

    /* ── 2. Drag-and-drop ── */
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--accent-clr)';
            uploadArea.style.background  = 'var(--hover-clr)';
        });

        uploadArea.addEventListener('dragleave', function () {
            uploadArea.style.borderColor = '';
            uploadArea.style.background  = '';
        });

        uploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background  = '';
            var file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                showPreview(file);
                /* Also set it on the real input so FormData picks it up */
                var dt = new DataTransfer();
                dt.items.add(file);
                if (imgInput) imgInput.files = dt.files;
            }
        });
    }

    function showPreview(file) {
        if (!preview) return;
        var url = URL.createObjectURL(file);
        preview.src = url;
        preview.style.display = 'block';
        /* Free old object URL when a new one is set */
        preview.onload = function () { URL.revokeObjectURL(url); };
    }

    /* ── 3. Urgency select — colour state ── */
    var urgencySelect = document.getElementById('urgency');
    if (urgencySelect) {
        urgencySelect.addEventListener('change', function () {
            this.classList.remove('high', 'medium', 'low');
            if (this.value) this.classList.add(this.value);
        });
    }

    /* ── 4. Form validation + submit ── */
    var form = document.getElementById('reportForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            /* Gather values */
            var animalType = (document.getElementById('animalType')      || {}).value || '';
            var condition  = (document.getElementById('animalCondition') || {}).value || '';
            var urgency    = (document.getElementById('urgency')         || {}).value || '';
            var location   = (document.getElementById('location')        || {}).value.trim();
            var description= (document.getElementById('description')     || {}).value.trim();

            /* Basic validation */
            var errors = [];
            if (!animalType)  errors.push('Please select an animal type.');
            if (!condition)   errors.push('Please select the animal\'s condition.');
            if (!urgency)     errors.push('Please select an urgency level.');
            if (!location)    errors.push('Please enter a location.');
            if (!description) errors.push('Please add a description.');

            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }

            /* Build report object */
            var report = {
                id:          'RPT-' + Date.now(),
                animalType:  animalType,
                condition:   condition,
                urgency:     urgency,
                location:    location,
                description: description,
                reportedBy:  localStorage.getItem('rescueMe_name') || 'Anonymous',
                timestamp:   new Date().toISOString()
            };

            /* Save to localStorage (replace with a real API call when ready) */
            var reports = [];
            try {
                reports = JSON.parse(localStorage.getItem('rescueMe_reports') || '[]');
            } catch (_) { reports = []; }
            reports.unshift(report);
            localStorage.setItem('rescueMe_reports', JSON.stringify(reports));

            /* Feedback + redirect */
            alert('Report submitted successfully! ID: ' + report.id);
            form.reset();
            if (preview) { preview.src = ''; preview.style.display = 'none'; }
            if (urgencySelect) urgencySelect.classList.remove('high', 'medium', 'low');

            /* Redirect to cases page after short delay */
            setTimeout(function () {
                window.location.href = '/html/cases.html';
            }, 500);
        });
    }

});