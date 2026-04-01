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