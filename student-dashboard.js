document.addEventListener("DOMContentLoaded", async () => {
    const escapeHtml = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const formatDate = (value) => {
        if (!value) {
            return "N/A";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "N/A";
        }

        return date.toLocaleDateString();
    };

    const formatStatus = (value) => {
        if (!value) {
            return "PENDING";
        }

        return String(value).replace(/_/g, " ").toUpperCase();
    };

    const getFeedbackBadgeStyle = (status) => {
        const normalizedStatus = String(status || "").toLowerCase();

        if (normalizedStatus === "approved") {
            return "background-color: #d4edda; color: #155724;";
        }

        if (normalizedStatus === "rejected") {
            return "background-color: #f8d7da; color: #721c24;";
        }

        return "background-color: #ffeaa7; color: #d35400;";
    };

    const getProjectBadgeStyle = (status) => {
        const normalizedStatus = String(status || "").toLowerCase();

        if (normalizedStatus === "approved" || normalizedStatus === "in_progress") {
            return "background-color: #d4edda; color: #155724;";
        }

        if (normalizedStatus === "rejected") {
            return "background-color: #f8d7da; color: #721c24;";
        }

        if (normalizedStatus === "revision_required") {
            return "background-color: #ffeaa7; color: #d35400;";
        }

        return "background-color: #e8f4f8; color: #3498db;";
    };

    // 1. AUTHENTICATION CHECK
    const token = sessionStorage.getItem("token");
    const userString = sessionStorage.getItem("user");

    if (!token || !userString) {
        window.location.href = "index.html"; // Redirect to login if not authenticated
        return;
    }

    const user = JSON.parse(userString);

    // Ensure only students access this dashboard
    if (user.role !== "student") {
        alert("Access Forbidden: Authorized for students only.");
        window.location.href = "index.html";
        return;
    }

    // Display user name in the navbar
    document.getElementById("user-name-display").textContent = `Hello, ${user.full_name}`;

    // 2. LOGOUT FUNCTIONALITY
    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "index.html";
    });

    // 3. FETCH DASHBOARD DATA
    try {
        const response = await fetch("http://localhost:3001/api/dashboard/student", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const stats = data.dashboardData;

            // Update Stat Cards
            document.getElementById("stat-projects").textContent = stats.totalProjects || 0;
            const milestonesStat = document.getElementById("stat-milestones");
            milestonesStat.textContent = stats.totalMilestones || 0;
            milestonesStat.classList.toggle(
                "pending-alert",
                Boolean(stats.upcomingMilestones && stats.upcomingMilestones.length > 0)
            );
            document.getElementById("stat-documents").textContent = stats.totalDocuments || 0;
            document.getElementById("stat-feedback").textContent = stats.totalFeedback || 0;

            const projectsSection = document.getElementById("my-projects-section");
            const projectsList = document.getElementById("my-projects-list");
            const totalProjectsCard = document.getElementById("total-projects-card");
            const totalMilestonesCard = document.getElementById("total-milestones-card");
            const totalFeedbackCard = document.getElementById("total-feedback-card");
            const milestonesSection = document.getElementById("upcoming-milestones-section");
            const feedbackSection = document.getElementById("recent-feedback-section");

            projectsList.innerHTML = "";

            if (!stats.studentProjects || stats.studentProjects.length === 0) {
                projectsList.innerHTML = '<p class="empty-state">No project found yet.</p>';
            } else {
                stats.studentProjects.forEach(project => {
                    const status = formatStatus(project.status);
                    const projectCard = `
                        <div class="list-item-card" style="display: block;">
                            <div style="display: flex; justify-content: space-between; gap: 15px; align-items: flex-start; margin-bottom: 12px;">
                                <div class="item-info">
                                    <h4>${escapeHtml(project.title)}</h4>
                                    <p><strong>Guide:</strong> ${escapeHtml(project.guide_name || "Not assigned")}</p>
                                    <p><strong>Domain:</strong> ${escapeHtml(project.domain || "N/A")}</p>
                                    <p><strong>Timeline:</strong> ${formatDate(project.start_date)} - ${formatDate(project.end_date)}</p>
                                </div>
                                <span class="status-badge" style="${getProjectBadgeStyle(project.status)} margin-right: 0;">
                                    ${status}
                                </span>
                            </div>
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #eee; color: #34495e; font-size: 14px; line-height: 1.5;">
                                ${escapeHtml(project.description || "No description provided.")}
                            </div>
                        </div>
                    `;

                    projectsList.innerHTML += projectCard;
                });
            }

            const addCardAction = (card, action) => {
                card.addEventListener("click", action);
                card.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        action();
                    }
                });
            };

            const scrollToSection = (section) => {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
            };

            const revealSection = (section) => {
                section.classList.add("is-visible");
                setTimeout(() => scrollToSection(section), 120);
            };

            addCardAction(totalProjectsCard, () => {
                revealSection(projectsSection);
            });

            addCardAction(totalMilestonesCard, () => {
                revealSection(milestonesSection);
            });

            addCardAction(totalFeedbackCard, () => {
                revealSection(feedbackSection);
            });

            // Business Rule: A student can have only one active proposal at a time.
            // Hide the "Submit New Proposal" button if they already have a project.
            if (stats.totalProjects > 0) {
                const proposalBtn = document.querySelector('a[href="student-proposal.html"]');
                if (proposalBtn) {
                    proposalBtn.style.display = "none";
                }
            }

            // Populate Upcoming Milestones
            const milestonesList = document.getElementById("upcoming-milestones-list");
            milestonesList.innerHTML = ""; // Clear loading text

            if (!stats.upcomingMilestones || stats.upcomingMilestones.length === 0) {
                milestonesList.innerHTML = '<p class="empty-state">No upcoming milestones at this time.</p>';
            } else {
                stats.upcomingMilestones.forEach(milestone => {
                    // Use extension date if it exists, otherwise use due date
                    const targetDate = milestone.extension_date ? milestone.extension_date : milestone.due_date;
                    const formattedDate = formatDate(targetDate);

                    const milestoneCard = `
                        <div class="list-item-card">
                            <div class="item-info">
                                <h4>${escapeHtml(milestone.title)}</h4>
                                <p><strong>Project:</strong> ${escapeHtml(milestone.project_title)}</p>
                            </div>
                            <span class="status-badge">Due: ${formattedDate}</span>
                        </div>
                    `;
                    milestonesList.innerHTML += milestoneCard;
                });
            }

            // Populate Recent Feedback
            const feedbackList = document.getElementById("recent-feedback-list");
            feedbackList.innerHTML = "";

            if (!stats.recentFeedback || stats.recentFeedback.length === 0) {
                feedbackList.innerHTML = '<p class="empty-state">No feedback has been added yet.</p>';
            } else {
                stats.recentFeedback.forEach(feedback => {
                    const status = formatStatus(feedback.status);
                    const grade = feedback.grade ? `<p><strong>Grade:</strong> ${escapeHtml(feedback.grade)}</p>` : "";
                    const documentInfo = feedback.file_name
                        ? `<p><strong>Document:</strong> ${escapeHtml(feedback.file_name)}${feedback.version_number ? ` (V.${escapeHtml(feedback.version_number)})` : ""}</p>`
                        : "";

                    const feedbackCard = `
                        <div class="list-item-card" style="display: block;">
                            <div style="display: flex; justify-content: space-between; gap: 15px; align-items: flex-start; margin-bottom: 12px;">
                                <div class="item-info">
                                    <h4>${escapeHtml(feedback.project_title || "Project Feedback")}</h4>
                                    <p><strong>Milestone:</strong> ${escapeHtml(feedback.milestone_title || "N/A")}</p>
                                    ${documentInfo}
                                    ${grade}
                                    <p style="font-size: 12px; margin-top: 5px;">
                                        ${feedback.reviewer_name ? `Reviewed by ${escapeHtml(feedback.reviewer_name)} on ` : "Received on "}
                                        ${formatDate(feedback.created_at)}
                                    </p>
                                </div>
                                <span class="status-badge" style="${getFeedbackBadgeStyle(feedback.status)} margin-right: 0;">
                                    ${status}
                                </span>
                            </div>
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #eee; color: #34495e; font-size: 14px; line-height: 1.5;">
                                ${escapeHtml(feedback.comments)}
                            </div>
                        </div>
                    `;

                    feedbackList.innerHTML += feedbackCard;
                });
            }

        } else {
            console.error("Dashboard Error:", data.message);
            document.getElementById("upcoming-milestones-list").innerHTML = 
                '<p class="empty-state" style="color: #e74c3c;">Failed to load dashboard data.</p>';
            document.getElementById("recent-feedback-list").innerHTML = 
                '<p class="empty-state" style="color: #e74c3c;">Failed to load dashboard data.</p>';
        }

    } catch (error) {
        console.error("Network Error:", error);
        document.getElementById("upcoming-milestones-list").innerHTML = 
            '<p class="empty-state" style="color: #e74c3c;">Server connection error. Please try again later.</p>';
        document.getElementById("recent-feedback-list").innerHTML = 
            '<p class="empty-state" style="color: #e74c3c;">Server connection error. Please try again later.</p>';
    }
});
