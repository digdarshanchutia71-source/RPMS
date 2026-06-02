document.addEventListener("DOMContentLoaded", async () => {
    // 1. AUTHENTICATION CHECK
    const token = sessionStorage.getItem("token");
    const userString = sessionStorage.getItem("user");

    if (!token || !userString) {
        window.location.href = "index.html";
        return;
    }

    const user = JSON.parse(userString);

    if (user.role !== "admin") {
        alert("Access Forbidden: Administrator privileges required.");
        window.location.href = "index.html";
        return;
    }

    // 2. DOM ELEMENTS
    const projectsList = document.getElementById("projects-list");
    const systemMessage = document.getElementById("system-message");
    let facultyList = [];

    // Utility to show messages
    const showMessage = (msg, isError = false) => {
        systemMessage.textContent = msg;
        systemMessage.className = isError ? "error-visible" : "success-visible";
        setTimeout(() => { systemMessage.className = "success-hidden"; }, 4000);
    };

    // 3. FETCH FACULTY MEMBERS
    async function fetchFaculty() {
        try {
            const res = await fetch("http://localhost:3001/api/admin/users", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                // Filter users to only keep faculty
                facultyList = data.users.filter(u => u.role === "faculty");
            }
        } catch (error) {
            console.error("Error fetching faculty:", error);
        }
    }

    // 4. FETCH AND RENDER PENDING PROJECTS
    async function fetchPendingProjects() {
        try {
            const res = await fetch("http://localhost:3001/api/projects", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                // Filter for projects that are pending or require a guide
                const pendingProjects = data.projects.filter(p => 
                    p.status === "pending" || p.status === "revision_required" || !p.guide_id
                );

                projectsList.innerHTML = ""; // Clear loading text

                if (pendingProjects.length === 0) {
                    projectsList.innerHTML = '<p class="empty-state">No pending proposals require action at this time.</p>';
                    return;
                }

                pendingProjects.forEach(project => {
                    // Create dropdown options for faculty
                    let facultyOptions = '<option value="" disabled selected>Select a Guide...</option>';
                    facultyList.forEach(f => {
                        const isSelected = project.guide_id === f.user_id ? "selected" : "";
                        facultyOptions += `<option value="${f.user_id}" ${isSelected}>${f.full_name} (${f.department})</option>`;
                    });

                    const card = document.createElement("div");
                    card.className = "list-item-card";
                    card.style.display = "block"; // Override flex for better layout
                    card.style.marginBottom = "20px";

                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                            <div class="item-info">
                                <h4 style="font-size: 1.1rem; color: #2c3e50;">${project.title}</h4>
                                <p><strong>Student:</strong> ${project.student_name || "Unknown"} | <strong>Domain:</strong> ${project.domain || "N/A"}</p>
                                <p style="margin-top: 10px; font-size: 0.9rem;"><strong>Abstract:</strong> ${project.abstract || "No abstract provided."}</p>
                            </div>
                            <span class="status-badge" style="background-color: #ffeaa7; color: #d35400;">${project.status.toUpperCase()}</span>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; display: flex; gap: 15px; align-items: center; border: 1px solid #eee;">
                            <div style="flex-grow: 1;">
                                <select class="guide-select" id="guide-select-${project.project_id}" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #bdc3c7;">
                                    ${facultyOptions}
                                </select>
                            </div>
                            <button class="btn-secondary assign-btn" data-id="${project.project_id}" style="padding: 8px 15px; background: #2c3e50; color: white;">Assign Guide</button>
                            <button class="btn-primary approve-btn" data-id="${project.project_id}" style="padding: 8px 15px; width: auto; background: #27ae60;">Approve Project</button>
                            <button class="btn-secondary reject-btn" data-id="${project.project_id}" style="padding: 8px 15px; border-color: #e74c3c; color: #e74c3c;">Reject</button>
                        </div>
                    `;
                    projectsList.appendChild(card);
                });

                attachEventListeners();
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            projectsList.innerHTML = '<p class="empty-state error-visible">Failed to load projects.</p>';
        }
    }

    // 5. HANDLE BUTTON ACTIONS
    function attachEventListeners() {
        // Assign Guide
        document.querySelectorAll(".assign-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const projectId = e.target.getAttribute("data-id");
                const guideId = document.getElementById(`guide-select-${projectId}`).value;
                
                if (!guideId) return alert("Please select a faculty guide first.");
                
                await updateProjectState(`http://localhost:3001/api/admin/projects/assign-guide/${projectId}`, { guide_id: guideId }, "Faculty Guide Assigned!");
            });
        });

        // Approve Project
        document.querySelectorAll(".approve-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const projectId = e.target.getAttribute("data-id");
                // Check if guide is assigned before approving
                const selectElement = document.getElementById(`guide-select-${projectId}`);
                if (selectElement.value === "") {
                    alert("Warning: You are approving a project without assigning a guide.");
                }
                await updateProjectState(`http://localhost:3001/api/admin/projects/approve/${projectId}`, {}, "Project Approved Successfully!");
            });
        });

        // Reject Project
        document.querySelectorAll(".reject-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const projectId = e.target.getAttribute("data-id");
                if(confirm("Are you sure you want to reject this proposal?")) {
                    await updateProjectState(`http://localhost:3001/api/admin/projects/reject/${projectId}`, {}, "Project Rejected.");
                }
            });
        });
    }

    // Helper function for PUT requests
    async function updateProjectState(url, payload, successMsg) {
        try {
            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                showMessage(successMsg);
                fetchPendingProjects(); // Refresh the list
            } else {
                showMessage(data.message || "Action failed.", true);
            }
        } catch (error) {
            showMessage("Network error.", true);
        }
    }

    // Initialize
    await fetchFaculty();
    fetchPendingProjects();
});