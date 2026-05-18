# RescueMe - Animal Rescue Platform

RescueMe is a comprehensive web platform designed to streamline and manage the entire lifecycle of animal rescue operations. It bridges the gap between everyday users who find stray or injured animals, volunteers who conduct rescues, veterinarians who provide medical care, and individuals looking to adopt or donate.

## 🌟 Key Features

### 1. User Authentication & Profile Management
* **Secure Login & Registration:** Users can sign up and log in securely.
* **Profile Customization:** Users can manage their personal information and preferences.
* **Account Recovery:** Mechanisms for requesting account unlocks if an account gets locked.

### 2. Role-Based Access Control (RBAC)
The system operates on multiple user roles to ensure appropriate access levels:
* **General Users:** Can report animals, request adoptions, and make donations.
* **Volunteers:** Dedicated dashboard to manage rescue cases, update rescue status, and handle adoption workflows.
* **Veterinarians:** Dedicated dashboard to receive cases needing medical attention, provide diagnoses, and update the animal's health status.
* **Admins:** Full control over the platform, including user management, role assignments, approving "Request Role Change" applications, and monitoring system-wide activities.

### 3. Animal Reporting System
* **Report a Rescue:** Users can report an animal in need by providing location details, condition, urgency level, and a description.
* **Automated Case Generation:** Once a report is submitted, a "Case" is created and broadcasted to available volunteers.

### 4. Case Lifecycle Management
A robust workflow that tracks an animal from rescue to adoption:
* **Reported:** Animal is reported by a user.
* **Assigned:** A volunteer accepts the rescue case.
* **Veterinary Care:** The volunteer transfers the case to a vet for medical evaluation. The vet updates the health status (e.g., "Stable", "Critical").
* **Ready for Adoption:** Once the vet marks the animal as "Stable", it is automatically listed in the Adoption Catalog.
* **Adopted / Closed:** After a successful adoption request and volunteer verification, the case is marked as successfully closed.

### 5. Volunteer Dashboard
* **Accept Cases:** View active reports and claim responsibility for a rescue.
* **Manage Workflow:** Update the animal's location and transfer control to veterinarians when needed.
* **Adoption Handling:** Review incoming adoption requests and manage the final closure of a rescue case.

### 6. Veterinary Dashboard
* **Medical Intake:** Accept cases brought in by volunteers.
* **Health Updates:** Log medical notes, provide treatments, and change the animal's status to reflect their recovery progress.

### 7. Adoption Catalog & Workflow
* **Browse Animals:** Users can view a catalog of stable animals ready for their forever homes.
* **Adoption Requests:** Users can submit an application to adopt a specific animal.
* **Adoption Review:** Volunteers receive the requests, review the applicant's details, and finalize the adoption process.

### 8. Donations & Payment Gateway
* **Support the Cause:** Users can contribute financially to help sustain rescue operations.
* **Integrated Payments:** Secure payment processing integration for handling donations safely.

### 9. Admin Dashboard
* **User Management:** Create new users, edit existing ones, and manage roles.
* **Role Requests:** Review and approve/deny requests from standard users who wish to become Volunteers or Vets.
* **System Overview:** View statistics and monitor the overall health and activity of the platform.

### 10. Notification System
* **Alerts:** Real-time or system notifications keeping users, volunteers, and vets informed about critical updates (e.g., "New case reported nearby", "Adoption request received", "Case marked as stable").

## 🛠️ Technology Stack
* **Frontend:** HTML5, CSS3 (Vanilla), JavaScript
* **Backend:** Node.js with Express.js
* **Database:** Relational/SQL Database (configured via backend `db.js`)
* **Styling:** Custom modern UI with dynamic components, dark/light mode toggles, and responsive design.

## 🚀 Getting Started

1. **Clone the Repository**
2. **Install Dependencies:**
   Navigate to the `rescueme-backend` directory and run:
   ```bash
   npm install
   ```
3. **Database Setup:**
   Ensure your database is running. Configure the connection by creating a `.env` file in the `rescueme-backend` directory with the following variables (or modify `db.js` directly):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=rescueme_db
   DB_PORT=3306
   ```
4. **Create an Admin Account:**
   To fully manage the platform, create an initial admin account using the provided script in the `rescueme-backend` directory:
   ```bash
   node create-admin.js "Admin Name" "admin@example.com" "securepassword" "1234567890"
   ```
5. **Run the Backend Server:**
   ```bash
   node server.js
   ```
6. **Run the Frontend:**
   Use a local server (like Live Server extension in VS Code) to serve the `frontend/html/` directory.

---
*Built with ❤️ for the animals.*
