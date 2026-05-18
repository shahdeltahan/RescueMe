const fs = require('fs');
let html = fs.readFileSync('frontend/html/notifications.html', 'utf8');
html = html.replace(/<script>[\s\S]*?<\/script>/i, '<script type="text/javascript" src="../js/notifications.js" defer></script>');
fs.writeFileSync('frontend/html/notifications.html', html);
console.log('replaced');
