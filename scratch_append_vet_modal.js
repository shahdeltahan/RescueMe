const fs = require('fs');
let html = fs.readFileSync('frontend/html/volunteers.html', 'utf8');
const modalStr = `
    <div id="assignVetModal" class="modal" hidden>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Assign Veterinarian</h2>
                <button class="close-modal" id="closeAssignVetModal">&times;</button>
            </div>
            <div class="modal-body">
                <p>Please select a veterinarian for treatment:</p>
                <input type="hidden" id="assignVetCaseId">
                <input type="hidden" id="assignVetAssignmentId">
                <div class="form-group">
                    <select id="assignVetSelect">
                        <option value="">Loading veterinarians...</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="cancelAssignVetBtn">Cancel</button>
                <button class="btn-primary" id="confirmAssignVetBtn">Confirm & Update</button>
            </div>
        </div>
    </div>
</body>
</html>
`;
html = html.replace('</body>\r\n</html>', modalStr).replace('</body>\n</html>', modalStr);
fs.writeFileSync('frontend/html/volunteers.html', html);
console.log('Appended assignVetModal to volunteers.html');
