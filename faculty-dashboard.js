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

    // 2. LOGOUT FUNCTIONALITY
    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "index.html";
    });

    // 3. FETCH FACULTY DASHBOARD DATA
    try {
        const response = await fetch("http://localhost:3001/api/dashboard/faculty", {
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
            document.getElementById("stat-assigned").textContent = stats.totalAssignedProjects || 0;
            const pendingStat = document.getElementById("stat-pending");
            pendingStat.textContent = stats.pendingProjectReviews || 0;
            pendingStat.classList.toggle("pending-alert", Number(stats.pendingProjectReviews || 0) > 0);
            document.getElementById("stat-docs").textContent = stats.totalSubmittedDocuments || 0;
            document.getElementById("stat-feedback").textContent = stats.totalFeedbackGiven || 0;

            const assignedSection = document.getElementById("assigned-projects-section");
            const pendingSection = document.getElementById("pending-documents-section");
            const documentsSection = document.getElementById("recent-documents-section");
            const feedbackSection = document.getElementById("recent-feedback-given-section");

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

            addCardAction(document.getElementById("assigned-projects-card"), () => {
                revealSection(assignedSection);
            });

            addCardAction(document.getElementById("pending-reviews-card"), () => {
                revealSection(pendingSection);
            });

            addCardAction(document.getElementById("submitted-docs-card"), () => {
                revealSection(documentsSection);
            });

            addCardAction(document.getElementById("feedback-given-card"), () => {
                revealSection(feedbackSection);
            });

            // Populate Assigned Projects List
            const projectsList = document.getElementById("assigned-projects-list");
            projectsList.innerHTML = ""; 

            if (!stats.assignedProjects || stats.assignedProjects.length === 0) {
                projectsList.innerHTML = '<p class="empty-state">No students assigned to you yet.</p>';
            } else {
                stats.assignedProjects.forEach(project => {
                    const card = `
                        <div class="list-item-card">
                            <div class="item-info">
                                <h4>${escapeHtml(project.title)}</h4>
                                <p><strong>Student:</strong> ${escapeHtml(project.student_name || "N/A")}</p>
                            </div>
                            <span class="status-badge" style="background-color: #e8f4f8; color: #3498db;">
                                ${formatStatus(project.status)}
                            </span>
                        </div>
                    `;
                    projectsList.innerHTML += card;
                });
            }

            const renderDocumentCard = (doc) => {
                const date = formatDate(doc.uploaded_at);

                return `
                    <div class="list-item-card" style="display: block;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                            <div class="item-info">
                                <h4 style="color: #2c3e50; margin-bottom: 5px;">${escapeHtml(doc.file_name)}</h4>
                                <p><strong>Project:</strong> ${escapeHtml(doc.project_title)}</p>
                                <p><strong>Milestone:</strong> ${escapeHtml(doc.milestone_title || "N/A")}</p>
                                <p style="font-size: 12px; margin-top: 5px;">Uploaded by ${escapeHtml(doc.uploaded_by_name || "N/A")} on ${date}</p>
                            </div>
                            <span class="status-badge" style="background-color: #ffeaa7; color: #d35400;">
                                V.${escapeHtml(doc.version_number)}
                            </span>
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #eee; text-align: right;">
                            <button class="btn-primary" style="width: auto; padding: 6px 15px; font-size: 13px;" onclick="window.location.href='faculty-feedback.html?doc_id=${escapeHtml(doc.document_id)}'">
                                Provide Feedback
                            </button>
                        </div>
                    </div>
                `;
            };

            // Populate Pending Documents to Review
            const pendingDocumentsList = document.getElementById("pending-documents-list");
            pendingDocumentsList.innerHTML = "";

            if (!stats.pendingDocuments || stats.pendingDocuments.length === 0) {
                pendingDocumentsList.innerHTML = '<p class="empty-state">No pending reviews at this time.</p>';
            } else {
                stats.pendingDocuments.forEach(doc => {
                    pendingDocumentsList.innerHTML += renderDocumentCard(doc);
                });
            }

            // Populate Recent Submitted Documents
            const documentsList = document.getElementById("recent-documents-list");
            documentsList.innerHTML = ""; 

            if (!stats.recentDocuments || stats.recentDocuments.length === 0) {
                documentsList.innerHTML = '<p class="empty-state">No recent document submissions.</p>';
            } else {
                stats.recentDocuments.forEach(doc => {
                    documentsList.innerHTML += renderDocumentCard(doc);
                });
            }

            // Populate Recent Feedback Given
            const feedbackList = document.getElementById("recent-feedback-given-list");
            feedbackList.innerHTML = "";

            if (!stats.recentFeedbackGiven || stats.recentFeedbackGiven.length === 0) {
                feedbackList.innerHTML = '<p class="empty-state">No feedback has been given yet.</p>';
            } else {
                stats.recentFeedbackGiven.forEach(feedback => {
                    const grade = feedback.grade ? `<p><strong>Grade:</strong> ${escapeHtml(feedback.grade)}</p>` : "";
                    const documentInfo = feedback.file_name
                        ? `<p><strong>Document:</strong> ${escapeHtml(feedback.file_name)}${feedback.version_number ? ` (V.${escapeHtml(feedback.version_number)})` : ""}</p>`
                        : "";

                    const card = `
                        <div class="list-item-card" style="display: block;">
                            <div style="display: flex; justify-content: space-between; gap: 15px; align-items: flex-start; margin-bottom: 12px;">
                                <div class="item-info">
                                    <h4>${escapeHtml(feedback.project_title || "Project Feedback")}</h4>
                                    <p><strong>Student:</strong> ${escapeHtml(feedback.student_name || "N/A")}</p>
                                    <p><strong>Milestone:</strong> ${escapeHtml(feedback.milestone_title || "N/A")}</p>
                                    ${documentInfo}
                                    ${grade}
                                    <p style="font-size: 12px; margin-top: 5px;">Given on ${formatDate(feedback.created_at)}</p>
                                </div>
                                <span class="status-badge" style="${getFeedbackBadgeStyle(feedback.status)} margin-right: 0;">
                                    ${formatStatus(feedback.status)}
                                </span>
                            </div>
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #eee; color: #34495e; font-size: 14px; line-height: 1.5;">
                                ${escapeHtml(feedback.comments)}
                            </div>
                        </div>
                    `;

                    feedbackList.innerHTML += card;
                });
            }

        } else {
            console.error("Dashboard Error:", data.message);
            document.getElementById("assigned-projects-list").innerHTML = '<p class="empty-state error-visible">Failed to load data.</p>';
            document.getElementById("pending-documents-list").innerHTML = '<p class="empty-state error-visible">Failed to load data.</p>';
            document.getElementById("recent-documents-list").innerHTML = '<p class="empty-state error-visible">Failed to load data.</p>';
            document.getElementById("recent-feedback-given-list").innerHTML = '<p class="empty-state error-visible">Failed to load data.</p>';
        }

    } catch (error) {
        console.error("Network Error:", error);
        document.getElementById("assigned-projects-list").innerHTML = '<p class="empty-state error-visible">Server connection error.</p>';
        document.getElementById("pending-documents-list").innerHTML = '<p class="empty-state error-visible">Server connection error.</p>';
        document.getElementById("recent-documents-list").innerHTML = '<p class="empty-state error-visible">Server connection error.</p>';
        document.getElementById("recent-feedback-given-list").innerHTML = '<p class="empty-state error-visible">Server connection error.</p>';
    }
});
