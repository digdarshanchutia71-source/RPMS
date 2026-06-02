document.addEventListener("DOMContentLoaded", async () => {
    const escapeHtml = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // 1. AUTHENTICATION CHECK
    const token = sessionStorage.getItem("token");
    const userString = sessionStorage.getItem("user");

    if (!token || !userString) {
        window.location.href = "index.html"; // Redirect to login if not authenticated
        return;
    }

    const user = JSON.parse(userString);

    // Ensure only admins access this dashboard
    if (user.role !== "admin") {
        alert("Access Forbidden: Administrator privileges required.");
        window.location.href = "index.html";
        return;
    }

    // Display user name in the navbar
    document.getElementById("user-name-display").textContent = `Admin: ${user.full_name}`;

    // 2. LOGOUT FUNCTIONALITY
    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "index.html";
    });

    // 3. FETCH ADMIN DASHBOARD DATA
    try {
        const response = await fetch("http://localhost:3001/api/dashboard/admin", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const stats = data.dashboardData;

            // Update High-Level Stat Cards
            document.getElementById("stat-users").textContent = stats.totalUsers || 0;
            document.getElementById("stat-projects").textContent = stats.totalProjects || 0;
            document.getElementById("stat-docs").textContent = stats.totalDocuments || 0;
            
            // Format funding amount nicely (e.g., ₹ 1,50,000)
            const formattedFunding = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(stats.totalSanctionedAmount || 0);
            document.getElementById("stat-funding").textContent = formattedFunding;

            const addCardAction = (card, action) => {
                card.addEventListener("click", action);
                card.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        action();
                    }
                });
            };

            const revealSection = (section) => {
                section.classList.add("is-visible");
                setTimeout(() => {
                    section.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 120);
            };

            addCardAction(document.getElementById("total-users-card"), () => {
                revealSection(document.getElementById("users-role-section"));
            });

            addCardAction(document.getElementById("total-projects-card"), () => {
                revealSection(document.getElementById("projects-status-section"));
            });

            addCardAction(document.getElementById("total-documents-card"), () => {
                revealSection(document.getElementById("documents-summary-section"));
            });

            addCardAction(document.getElementById("total-funding-card"), () => {
                revealSection(document.getElementById("funding-summary-section"));
            });

            // Populate Users by Role List
            const usersRoleList = document.getElementById("users-role-list");
            usersRoleList.innerHTML = ""; // Clear loading text

            if (!stats.usersByRole || stats.usersByRole.length === 0) {
                usersRoleList.innerHTML = '<p class="empty-state">No user data found.</p>';
            } else {
                stats.usersByRole.forEach(roleData => {
                    const card = `
                        <div class="list-item-card">
                            <div class="item-info">
                                <h4 style="text-transform: capitalize;">${escapeHtml(roleData.role)}s</h4>
                            </div>
                            <span class="status-badge" style="background-color: #e8f4f8; color: #3498db; font-size: 1rem;">
                                ${escapeHtml(roleData.total)}
                            </span>
                        </div>
                    `;
                    usersRoleList.innerHTML += card;
                });
            }

            // Populate Projects by Status List
            const projectsStatusList = document.getElementById("projects-status-list");
            projectsStatusList.innerHTML = ""; // Clear loading text

            if (!stats.projectsByStatus || stats.projectsByStatus.length === 0) {
                projectsStatusList.innerHTML = '<p class="empty-state">No project data found.</p>';
            } else {
                stats.projectsByStatus.forEach(statusData => {
                    // Determine badge color based on status
                    let badgeColor = "#bdc3c7"; // default gray
                    let textColor = "#2c3e50";
                    
                    if (statusData.status === "approved") {
                        badgeColor = "#d4edda"; textColor = "#155724"; // Green
                    } else if (statusData.status === "pending") {
                        badgeColor = "#ffeaa7"; textColor = "#d35400"; // Orange
                    } else if (statusData.status === "rejected") {
                        badgeColor = "#fadbd8"; textColor = "#c0392b"; // Red
                    } else if (statusData.status === "revision_required") {
                        badgeColor = "#d6eaf8"; textColor = "#2980b9"; // Blue
                    }

                    const formattedStatus = String(statusData.status).replace("_", " ").toUpperCase();

                    const card = `
                        <div class="list-item-card">
                            <div class="item-info">
                                <h4>Status: ${escapeHtml(formattedStatus)}</h4>
                            </div>
                            <span class="status-badge" style="background-color: ${badgeColor}; color: ${textColor}; font-size: 1rem;">
                                ${escapeHtml(statusData.total)}
                            </span>
                        </div>
                    `;
                    projectsStatusList.innerHTML += card;
                });
            }

            const documentsSummaryList = document.getElementById("documents-summary-list");
            documentsSummaryList.innerHTML = `
                <div class="list-item-card">
                    <div class="item-info">
                        <h4>Total Uploaded Documents</h4>
                        <p>All documents submitted across the system.</p>
                    </div>
                    <span class="status-badge" style="background-color: #e8f4f8; color: #3498db; font-size: 1rem;">
                        ${escapeHtml(stats.totalDocuments || 0)}
                    </span>
                </div>
            `;

            const fundingSummaryList = document.getElementById("funding-summary-list");
            fundingSummaryList.innerHTML = `
                <div class="list-item-card" style="display: block;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 12px;">
                        <div class="item-info">
                            <h4>Total Sanctioned Funding</h4>
                            <p>Approved funding recorded by admin.</p>
                        </div>
                        <span class="status-badge" style="background-color: #d4edda; color: #155724; font-size: 1rem;">
                            ${escapeHtml(formattedFunding)}
                        </span>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #eee; text-align: right;">
                        <button class="btn-primary" style="width: auto; padding: 6px 15px; font-size: 13px;" onclick="window.location.href='admin-funding.html'">
                            Manage Funding
                        </button>
                    </div>
                </div>
            `;

        } else {
            console.error("Dashboard Error:", data.message);
            document.getElementById("users-role-list").innerHTML = 
                '<p class="empty-state" style="color: #e74c3c;">Failed to load data.</p>';
            document.getElementById("projects-status-list").innerHTML = 
                '<p class="empty-state" style="color: #e74c3c;">Failed to load data.</p>';
            document.getElementById("documents-summary-list").innerHTML = 
                '<p class="empty-state" style="color: #e74c3c;">Failed to load data.</p>';
            document.getElementById("funding-summary-list").innerHTML = 
                '<p class="empty-state" style="color: #e74c3c;">Failed to load data.</p>';
        }

    } catch (error) {
        console.error("Network Error:", error);
        document.getElementById("users-role-list").innerHTML = 
            '<p class="empty-state" style="color: #e74c3c;">Server connection error.</p>';
        document.getElementById("projects-status-list").innerHTML = 
            '<p class="empty-state" style="color: #e74c3c;">Server connection error.</p>';
        document.getElementById("documents-summary-list").innerHTML = 
            '<p class="empty-state" style="color: #e74c3c;">Server connection error.</p>';
        document.getElementById("funding-summary-list").innerHTML = 
            '<p class="empty-state" style="color: #e74c3c;">Server connection error.</p>';
    }
});
