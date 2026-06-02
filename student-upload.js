document.addEventListener("DOMContentLoaded", () => {
    // 1. AUTHENTICATION CHECK
    const token = sessionStorage.getItem("token");
    const userString = sessionStorage.getItem("user");

    if (!token || !userString) {
        window.location.href = "index.html";
        return;
    }

    const user = JSON.parse(userString);

    if (user.role !== "student") {
        alert("Access Forbidden: Only students can upload documents.");
        window.location.href = "index.html";
        return;
    }

    document.getElementById("user-name-display").textContent = `Hello, ${user.full_name}`;

    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "index.html";
    });

    // 2. DOM ELEMENTS
    const form = document.getElementById("upload-form");
    const projectSelect = document.getElementById("project_id");
    const milestoneSelect = document.getElementById("milestone_id");
    const systemMessage = document.getElementById("system-message");
    const errorMessage = document.getElementById("error-message");
    const uploadBtn = document.getElementById("upload-btn");
    const documentsList = document.getElementById("documents-list");

    // 3. FETCH DATA (Projects & Documents)
    async function loadInitialData() {
        try {
            // Fetch Projects to populate dropdown
            const projRes = await fetch("http://localhost:3001/api/projects", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const projData = await projRes.json();

            if (projData.success) {
                // Filter projects belonging to this student
                const studentProjects = projData.projects.filter(p => p.student_id === user.id);
                
                projectSelect.innerHTML = '<option value="" disabled selected>Select your project</option>';
                studentProjects.forEach(p => {
                    projectSelect.innerHTML += `<option value="${p.project_id}">${p.title}</option>`;
                });
            }

            // Fetch previously uploaded documents
            fetchMyDocuments();

        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    // 4. FETCH MILESTONES WHEN A PROJECT IS SELECTED
    projectSelect.addEventListener("change", async (e) => {
        const projectId = e.target.value;
        milestoneSelect.innerHTML = '<option value="" disabled selected>Loading milestones...</option>';

        try {
            const msRes = await fetch("http://localhost:3001/api/milestones", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const msData = await msRes.json();

            if (msData.success) {
                const projectMilestones = msData.milestones.filter(m => m.project_id == projectId);
                
                milestoneSelect.innerHTML = '<option value="" disabled selected>Select a milestone</option>';
                if (projectMilestones.length === 0) {
                    milestoneSelect.innerHTML = '<option value="" disabled>No milestones assigned yet</option>';
                } else {
                    projectMilestones.forEach(m => {
                        milestoneSelect.innerHTML += `<option value="${m.milestone_id}">${m.title} (Due: ${new Date(m.due_date).toLocaleDateString()})</option>`;
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching milestones:", error);
        }
    });

    // 5. FETCH & DISPLAY UPLOADED DOCUMENTS
    async function fetchMyDocuments() {
        try {
            const docRes = await fetch("http://localhost:3001/api/documents", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const docData = await docRes.json();

            if (docData.success) {
                const myDocs = docData.documents.filter(d => d.uploaded_by === user.id);
                
                documentsList.innerHTML = ""; // Clear loading text
                
                if (myDocs.length === 0) {
                    documentsList.innerHTML = '<p class="empty-state">No documents uploaded yet.</p>';
                    return;
                }

                myDocs.forEach(doc => {
                    const docCard = `
                        <div class="list-item-card">
                            <div class="item-info">
                                <h4>${doc.file_name}</h4>
                                <p><strong>Milestone:</strong> ${doc.milestone_title || 'N/A'} | <strong>Version:</strong> ${doc.version_number}</p>
                                <p style="font-size: 12px; margin-top: 5px;">Uploaded: ${new Date(doc.uploaded_at).toLocaleDateString()}</p>
                            </div>
                            <span class="status-badge" style="background-color: #d4edda; color: #155724;">V.${doc.version_number}</span>
                        </div>
                    `;
                    documentsList.innerHTML += docCard;
                });
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    }

    // 6. HANDLE FILE UPLOAD SUBMISSION
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        systemMessage.className = "success-hidden";
        errorMessage.className = "error-hidden";
        uploadBtn.textContent = "Uploading...";
        uploadBtn.disabled = true;

        const fileInput = document.getElementById("file");
        
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append("project_id", projectSelect.value);
        formData.append("milestone_id", milestoneSelect.value);
        formData.append("document_type", document.getElementById("document_type").value);
        formData.append("file", fileInput.files[0]); // Must match multer's expected field name "file"

        try {
            const response = await fetch("http://localhost:3001/api/documents/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                    // DO NOT SET 'Content-Type' here. Let the browser handle the multipart boundary.
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                systemMessage.textContent = "Document Uploaded Successfully!";
                systemMessage.className = "success-visible";
                form.reset();
                milestoneSelect.innerHTML = '<option value="" disabled selected>Select a project first...</option>';
                
                // Refresh the document list
                fetchMyDocuments();
            } else {
                errorMessage.textContent = data.message || "Upload failed.";
                errorMessage.className = "error-visible";
            }
        } catch (error) {
            errorMessage.textContent = "Server error. Please try again later.";
            errorMessage.className = "error-visible";
        } finally {
            uploadBtn.textContent = "Upload Document";
            uploadBtn.disabled = false;
        }
    });

    // Initialize page data
    loadInitialData();
});
