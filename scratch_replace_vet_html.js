const fs = require('fs');
let html = fs.readFileSync('frontend/html/veterinary.html', 'utf8');
html = html.replace('<input type="text" id="appPatientStr" placeholder="Patient ID or Name" required>', '<select id="appPatientStr" required><option value="">Select a Patient</option></select>');
fs.writeFileSync('frontend/html/veterinary.html', html);
console.log('replaced vet html');
