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
    button.nextEkementSibling.classList.toggle("show");
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
    errors = getSignupFormErrors(fullname_input.value, email_input.value, phone_input.value, password_input.value, confirm_password_input.value, role_input.value)
   }
   else{
    //if we don't have full name input then we are in the login
    errors = getLoginFormErrors(email_input.value, password_input.value)
   }
   if(errors.length > 0){
    //if there are any errors
    e.preventDefault()
    error_message.innerText = errors.join(". ")
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
        
    }    if(phone=== '' || phone==null){
        errors.push('PhoneNumber is required')
        phone_input.parentElement.classList.add('incorrect')
        
    } 
     if(password === '' || password == null){
    errors.push('Password is required')
    password_input.parentElement.classList.add('incorrect')
    }
    else if(password.length < 8){
    errors.push('Password must have at least 8 characters')
    password_input.parentElement.classList.add('incorrect')
    }
    if(confirmPassword === '' || confirmPassword == null){
    errors.push('Please confirm your password')
    confirm_password_input.parentElement.classList.add('incorrect')
    }
    else if(password !== confirmPassword){
    errors.push('Passwords do not match')
    confirm_password_input.parentElement.classList.add('incorrect')
    }  
    if (!role) {
    errors.push('Please select a role.');
    role_input.parentElement.classList.add('incorrect')
    }
    return errors;
}

function getLoginFormErrors(email, password){
   let errors =[] 
    if(email === '' || email ==null){
        errors.push('Email is required')
        email_input.parentElement.classList.add('incorrect')
        
    } if(password=== '' || password==null){
        errors.push('Password is required')
        password_input.parentElement.classList.add('incorrect')
    }  
    return errors;
}
const allInputs=[fullname_input, email_input, password_input, confirm_password_input,role_input].filter(input => input != null)
allInputs.forEach(input =>{
input.addEventListener('input',() =>{
    if(input.parentElement.classList.contains('incorrect')){
        input.parentElement.classList.remove('incorrect')
        error_message.innerText = ''
    }
})
})