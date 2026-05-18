const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'html');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let p = path.join(dir, f);
    let c = fs.readFileSync(p, 'utf8');
    if (!c.includes('rbac.js')) {
        c = c.replace('</head>', '    <script type="text/javascript" src="../js/rbac.js" defer></script>\n</head>');
        fs.writeFileSync(p, c);
        console.log(`Injected rbac.js into ${f}`);
    }
});
console.log('Injection complete.');
