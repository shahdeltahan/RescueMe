const fs = require('fs');
let html = fs.readFileSync('frontend/html/admin.html', 'utf8');
const modalStr = `
    <div id="assignVolunteerModal" class="modal" hidden>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Approve Case</h2>
                <button class="close-modal" id="closeAssignModal">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="assignCaseId">
                <input type="hidden" id="assignCaseTitle">
                <div class="form-group">
                    <label for="assignVolunteerSelect">Assign Volunteer (Optional)</label>
                    <select id="assignVolunteerSelect">
                        <option value="">No assignment</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelAssignBtn">Cancel</button>
                <button class="btn-primary" id="confirmApproveBtn">Confirm Approve</button>
            </div>
        </div>
    </div>
</main>
</body>
`;
html = html.replace('</main>\r\n</body>', modalStr).replace('</main>\n</body>', modalStr);
fs.writeFileSync('frontend/html/admin.html', html);
console.log('Appended modal');
