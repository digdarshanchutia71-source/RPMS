document.addEventListener("DOMContentLoaded", async () => {
    // 1. AUTHENTICATION CHECK
    const token = sessionStorage.getItem("token");
    const userString = sessionStorage.getItem("user");

    if (!token || !userString) {
        window.location.href = "index.html";
        return;
    }

    const user = JSON.parse(userString);

    if (user.role !== "admin" && user.role !== "faculty") {
        alert("Access Forbidden: Only Admins and Faculty can manage milestones.");
        window.location.href = "index.html";
        return;
    }

    // Dynamic UI Updates based on Role
    document.getElementById("user-name-display").textContent = 
        user.role === "admin" ? `Admin: ${user.full_name}` : `Prof. ${user.full_name}`;

    document.getElementById("back-btn").addEventListener("click", () => {
        window.location.href = user.role === "admin" ? "admin-dashboard.html" : "faculty-dashboard.html";
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "index.html";
    });

    // 2. DOM ELEMENTS
    const form = document.getElementById("milestone-form");
    const projectSelect = document.getElementById("project_id");
    const milestonesList = document.getElementById("milestones-list");
    const systemMessage = document.getElementById("system-message");
    const errorMessage = document.getElementById("error-message");
    const submitBtn = document.getElementById("create-milestone-btn");

    // 3. FETCH INITIAL DATA
    async function loadData() {
        try {
            // A. Fetch Projects
            const projRes = await fetch("http://localhost:3001/api/projects", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const projData = await projRes.json();

            if (projData.success) {
                // Filter logic: Admins see all approved projects. Faculty only see projects assigned to them.
                let availableProjects = projData.projects;
                if (user.role === "faculty") {
                    availableProjects = availableProjects.filter(p => p.guide_id === user.id);
                }

                projectSelect.innerHTML = '<option value="" disabled selected>Select a project...</option>';
                if (availableProjects.length === 0) {
                    projectSelect.innerHTML = '<option value="" disabled>No eligible projects found</option>';
                } else {
                    availableProjects.forEach(p => {
                        projectSelect.innerHTML += `<option value="${p.project_id}">${p.title} (${p.student_name})</option>`;
                    });
                }
            }

            // B. Fetch Existing Milestones
            fetchMilestones();

        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    async function fetchMilestones() {
        try {
            const msRes = await fetch("http://localhost:3001/api/milestones", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const msData = await msRes.json();

            if (msData.success) {
                milestonesList.innerHTML = ""; 

                // If faculty, filter milestones to only show their projects
                let visibleMilestones = msData.milestones;
                if (user.role === "faculty") {
                    // Quick map to get project IDs this faculty member guides
                    const myProjectIds = Array.from(projectSelect.options)
                                            .map(opt => parseInt(opt.value))
                                            .filter(val => !isNaN(val));
                    
                    visibleMilestones = visibleMilestones.filter(m => myProjectIds.includes(m.project_id));
                }

                if (visibleMilestones.length === 0) {
                    milestonesList.innerHTML = '<p class="empty-state">No milestones have been defined yet.</p>';
                    return;
                }

                visibleMilestones.forEach(record => {
                    const formattedDate = new Date(record.due_date).toLocaleDateString();
                    const extDate = record.extension_date ? new Date(record.extension_date).toLocaleDateString() : null;
                    
                    let dateHtml = `<strong>Due Date:</strong> ${formattedDate}`;
                    if (extDate) {
                        dateHtml += ` <span style="color: #e74c3c;">(Extended to: ${extDate})</span>`;
                    }

                    const card = `
                        <div class="list-item-card" style="display: block; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div class="item-info">
                                    <h4 style="font-size: 1.1rem; color: #2c3e50; margin-bottom: 5px;">${record.title}</h4>
                                    <p><strong>Project:</strong> ${record.project_title}</p>
                                    <p style="margin-top: 5px;">${dateHtml}</p>
                                </div>
                                <span class="status-badge" style="background-color: #e8f4f8; color: #3498db;">
                                    ${record.status || 'Pending'}
                                </span>
                            </div>
                        </div>
                    `;
                    milestonesList.innerHTML += card;
                });
            }
        } catch (error) {
            console.error("Error fetching milestones:", error);
            milestonesList.innerHTML = '<p class="empty-state error-visible">Failed to load milestones.</p>';
        }
    }

    // 4. HANDLE ADD MILESTONE SUBMISSION
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        systemMessage.className = "success-hidden";
        errorMessage.className = "error-hidden";
        submitBtn.textContent = "Setting...";
        submitBtn.disabled = true;

        const payload = {
            project_id: projectSelect.value,
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            due_date: document.getElementById("due_date").value
        };

        try {
            const response = await fetch("http://localhost:3001/api/milestones/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                systemMessage.textContent = "Milestone Created Successfully!";
                systemMessage.className = "success-visible";
                form.reset();
                
                // Refresh the milestone list immediately
                fetchMilestones();
            } else {
                errorMessage.textContent = data.message || "Failed to create milestone.";
                errorMessage.className = "error-visible";
            }
        } catch (error) {
            errorMessage.textContent = "Server error. Please try again later.";
            errorMessage.className = "error-visible";
        } finally {
            submitBtn.textContent = "Set Milestone";
            submitBtn.disabled = false;
        }
    });

    // Initialize page
    loadData();
});