const fs = require('fs');
let c = fs.readFileSync('../frontend/html/veterinary.html', 'utf8');
c = c.replace('</select>\r\n                <div style="display:flex;gap:10px;justify-content:flex-end;">', `</select>\r
                <div id="stableExtraFields" style="display:none; margin-bottom:16px;">\r
                    <label style="color:var(--text-clr);font-size:14px;display:block;margin-bottom:4px;">Estimated Age (years)</label>\r
                    <input type="number" id="updateAge" step="0.1" min="0" placeholder="e.g. 2.5" style="width:100%;margin-bottom:12px;padding:8px;border-radius:6px;border:1px solid var(--line-clr);background:var(--input-color);color:var(--text-clr);">\r
                    <label style="color:var(--text-clr);font-size:14px;display:block;margin-bottom:4px;">Gender</label>\r
                    <select id="updateGender" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--line-clr);background:var(--input-color);color:var(--text-clr);">\r
                        <option value="Unknown">Unknown</option>\r
                        <option value="Male">Male</option>\r
                        <option value="Female">Female</option>\r
                    </select>\r
                </div>\r
                <div style="display:flex;gap:10px;justify-content:flex-end;">`);
fs.writeFileSync('../frontend/html/veterinary.html', c);
