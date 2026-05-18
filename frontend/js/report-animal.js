const API_BASE = "https://rescueme-backend-jjhr.onrender.com/api";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("rescueMe_token") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("rescueMe_token") ||
    sessionStorage.getItem("jwt")
  );
}

document.addEventListener("DOMContentLoaded", function () {
  var imgInput = document.getElementById("image-input");
  var preview = document.getElementById("image-preview");
  var uploadArea = document.querySelector(".upload-area");

  if (imgInput && preview) {
    imgInput.addEventListener("change", function () {
      var file = imgInput.files[0];
      if (file && file.type.startsWith("image/")) {
        showPreview(file);
      }
    });
  }

  if (uploadArea) {
    uploadArea.addEventListener("dragover", function (e) {
      e.preventDefault();
      uploadArea.style.borderColor = "var(--accent-clr)";
      uploadArea.style.background = "var(--hover-clr)";
    });

    uploadArea.addEventListener("dragleave", function () {
      uploadArea.style.borderColor = "";
      uploadArea.style.background = "";
    });

    uploadArea.addEventListener("drop", function (e) {
      e.preventDefault();
      uploadArea.style.borderColor = "";
      uploadArea.style.background = "";

      var file = e.dataTransfer.files[0];

      if (file && file.type.startsWith("image/")) {
        showPreview(file);

        var dt = new DataTransfer();
        dt.items.add(file);

        if (imgInput) imgInput.files = dt.files;
      }
    });
  }

  function showPreview(file) {
    if (!preview) return;

    var reader = new FileReader();

    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
    };

    reader.readAsDataURL(file);
  }

  var urgencySelect = document.getElementById("urgency");

  if (urgencySelect) {
    urgencySelect.addEventListener("change", function () {
      this.classList.remove("high", "medium", "low", "critical");
      if (this.value) this.classList.add(this.value.toLowerCase());
    });
  }

  var form = document.getElementById("reportForm");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      var animalType = document.getElementById("animalType")?.value || "";
      var condition = document.getElementById("animalCondition")?.value || "";
      var urgency = document.getElementById("urgency")?.value || "";
      var location = document.getElementById("location")?.value.trim() || "";
      var description = document.getElementById("description")?.value.trim() || "";
      var reportedBy = document.getElementById("reportedBy")?.value.trim() || "";
      var contactPhone = document.getElementById("contactPhone")?.value || "";
      var contactEmail = document.getElementById("contactEmail")?.value || "";

      var errors = [];

      if (!animalType) errors.push("Please select an animal type.");
      if (!condition) errors.push("Please select the animal's condition.");
      if (!urgency) errors.push("Please select an urgency level.");
      if (!location) errors.push("Please enter a location.");
      if (!description) errors.push("Please add a description.");

      if (errors.length > 0) {
        alert(errors.join("\n"));
        return;
      }

      const token = getToken();

      if (!token) {
        alert("Login token not found. Please login again.");
        return;
      }

      var imgPreview = document.getElementById("image-preview");
      var base64Image =
        imgPreview && imgPreview.style.display === "block"
          ? imgPreview.src
          : null;

      const reportData = {
        animalType,
        condition,
        urgency,
        location,
        description,
        image: base64Image,
        contactPhone,
        contactEmail,
        reportedBy: reportedBy || localStorage.getItem("rescueMe_name") || "Anonymous",
      };

      try {
        const res = await fetch(`${API_BASE}/reports`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reportData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || "Failed to submit report.");
        }

        alert("Report submitted successfully! ID: " + data.report_id);

        form.reset();

        if (preview) {
          preview.src = "";
          preview.style.display = "none";
        }

        if (urgencySelect) {
          urgencySelect.classList.remove("high", "medium", "low", "critical");
        }

        setTimeout(function () {
          window.location.href = "cases.html";
        }, 500);
      } catch (error) {
        console.error(error);
        alert(error.message || "Failed to submit report.");
      }
    });
  }
});