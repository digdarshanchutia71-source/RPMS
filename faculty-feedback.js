document.addEventListener("DOMContentLoaded", async () => {
    // 1. AUTHENTICATION CHECK
    const token = sessionStorage.getItem("token");
    const userString = sessionStorage.getItem("user");

    if (!token || !userString) {
        window.location.href = "index.html";
        return;
    }

    const user = JSON.parse(userString);

    if (user.role !== "faculty") {
        alert("Access Forbidden: Faculty privileges required.");
        window.location.href = "index.html";
        return;
    }

    document.getElementById("user-name-display").textContent = `Prof. ${user.full_name}`;

    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "index.html";
    });

    // 2. EXTRACT URL PARAMETERS
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get("doc_id");

    // Empty buckets to hold the missing IDs
    let projId = null;
    let mileId = null;

    if (!docId) {
        document.getElementById("error-message").textContent = "Invalid document. Please return to the dashboard and select a valid document.";
        document.getElementById("error-message").className = "error-visible";
        document.getElementById("submit-feedback-btn").disabled = true;
        return;
    }

    // 3. FETCH DOCUMENT DETAILS
    async function loadDocumentDetails() {
        try {
            const res = await fetch("http://localhost:3001/api/documents", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                const targetDoc = data.documents.find(d => String(d.document_id) === String(docId));
                const docInfoDiv = document.getElementById("document-info");

                if (targetDoc) {
                    // SECRETY ASSIGN THE MISSING IDs HERE!
                    projId = targetDoc.project_id;
                    mileId = targetDoc.milestone_id;

                    docInfoDiv.innerHTML = `
                        <p style="margin-bottom: 10px;"><strong>File Name:</strong><br> ${targetDoc.file_name}</p>
                        <p style="margin-bottom: 10px;"><strong>Project:</strong><br> ${targetDoc.project_title || 'N/A'}</p>
                        <p style="margin-bottom: 10px;"><strong>Milestone:</strong><br> ${targetDoc.milestone_title || 'N/A'}</p>
                        <p style="margin-bottom: 10px;"><strong>Student:</strong><br> ${targetDoc.uploaded_by_name || 'N/A'}</p>
                        <p style="margin-bottom: 20px;"><strong>Version:</strong> V.${targetDoc.version_number}</p>
                        
                        <a href="http://localhost:3001/${targetDoc.file_path}" target="_blank" class="btn-primary" style="display: block; text-align: center; text-decoration: none; padding: 10px; font-size: 14px;">
                            Download / View Document
                        </a>
                    `;
                } else {
                    docInfoDiv.innerHTML = '<p class="empty-state" style="color: #e74c3c;">Document details not found.</p>';
                    document.getElementById("submit-feedback-btn").disabled = true;
                }
            }
        } catch (error) {
            console.error("Error loading document details:", error);
        }
    }

    // 4. HANDLE FORM SUBMISSION
    const form = document.getElementById("feedback-form");
    const systemMessage = document.getElementById("system-message");
    const errorMessage = document.getElementById("error-message");
    const submitBtn = document.getElementById("submit-feedback-btn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        systemMessage.className = "success-hidden";
        errorMessage.className = "error-hidden";
        submitBtn.textContent = "Submitting...";
        submitBtn.disabled = true;

        const payload = {
            project_id: projId,
            document_id: docId,
            milestone_id: mileId,
            comments: document.getElementById("comments").value,
            status: document.getElementById("status").value,
            grade: document.getElementById("grade").value || null
        };

        try {
            const response = await fetch("http://localhost:3001/api/feedback/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                systemMessage.textContent = "Evaluation Submitted Successfully! Redirecting...";
                systemMessage.className = "success-visible";
                form.reset();
                
                // Redirect back to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = "faculty-dashboard.html";
                }, 2000);
            } else {
                errorMessage.textContent = data.message || "Failed to submit feedback.";
                errorMessage.className = "error-visible";
                submitBtn.textContent = "Submit Evaluation";
                submitBtn.disabled = false;
            }
        } catch (error) {
            errorMessage.textContent = "Server error. Please try again later.";
            errorMessage.className = "error-visible";
            submitBtn.textContent = "Submit Evaluation";
            submitBtn.disabled = false;
        }
    });

    // Initialize page
    loadDocumentDetails();
});