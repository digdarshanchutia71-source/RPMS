const db = require("../config/db");


const runQuery = (query, params = []) => {

    return new Promise((resolve, reject) => {

        db.query(query, params, (err, results) => {

            if (err) {
                reject(err);
            } else {
                resolve(results);
            }

        });

    });

};


const getCount = (rows, field) => {
    return rows[0][field] || 0;
};


const sendError = (res, error) => {

    return res.status(500).json({
        success: false,
        message: error.message
    });

};


// GET DASHBOARD DATA BASED ON LOGGED-IN ROLE
exports.getDashboardStats = async (req, res) => {

    const role = String(req.user.role).toLowerCase();

    if (role === "student") {
        return exports.getStudentDashboard(req, res);
    }

    if (role === "faculty") {
        return exports.getFacultyDashboard(req, res);
    }

    if (role === "admin") {
        return exports.getAdminDashboard(req, res);
    }

    return res.status(403).json({
        success: false,
        message: "Invalid dashboard role"
    });

};



// STUDENT DASHBOARD
exports.getStudentDashboard = async (req, res) => {

    try {

        const userId = req.user.id;

        const [
            projectResult,
            milestoneResult,
            documentResult,
            feedbackResult,
            studentProjects,
            upcomingMilestones,
            recentFeedback
        ] = await Promise.all([
            runQuery(
                "SELECT COUNT(*) AS totalProjects FROM projects WHERE student_id = ?",
                [userId]
            ),
            runQuery(
                `
                    SELECT COUNT(*) AS totalMilestones
                    FROM milestones m
                    INNER JOIN projects p
                    ON m.project_id = p.project_id
                    WHERE p.student_id = ?
                `,
                [userId]
            ),
            runQuery(
                "SELECT COUNT(*) AS totalDocuments FROM documents WHERE uploaded_by = ?",
                [userId]
            ),
            runQuery(
                `
                    SELECT COUNT(*) AS totalFeedback
                    FROM feedback f
                    INNER JOIN projects p
                    ON f.project_id = p.project_id
                    WHERE p.student_id = ?
                `,
                [userId]
            ),
            runQuery(
                `
                    SELECT
                        p.project_id,
                        p.title,
                        p.description,
                        p.domain,
                        p.status,
                        p.start_date,
                        p.end_date,
                        u.full_name AS guide_name
                    FROM projects p
                    LEFT JOIN users u
                    ON p.guide_id = u.user_id
                    WHERE p.student_id = ?
                    ORDER BY p.created_at DESC
                    LIMIT 5
                `,
                [userId]
            ),
            runQuery(
                `
                    SELECT
                        m.milestone_id,
                        m.title,
                        m.due_date,
                        m.extension_date,
                        m.status,
                        p.project_id,
                        p.title AS project_title
                    FROM milestones m
                    INNER JOIN projects p
                    ON m.project_id = p.project_id
                    WHERE p.student_id = ?
                    AND m.status = 'pending'
                    ORDER BY COALESCE(m.extension_date, m.due_date) ASC
                    LIMIT 5
                `,
                [userId]
            ),
            runQuery(
                `
                    SELECT
                        f.feedback_id,
                        f.comments,
                        f.status,
                        f.grade,
                        f.created_at,
                        p.title AS project_title,
                        d.file_name,
                        d.version_number,
                        m.title AS milestone_title,
                        u.full_name AS reviewer_name
                    FROM feedback f
                    INNER JOIN projects p
                    ON f.project_id = p.project_id
                    LEFT JOIN documents d
                    ON f.document_id = d.document_id
                    LEFT JOIN milestones m
                    ON f.milestone_id = m.milestone_id
                    LEFT JOIN users u
                    ON f.user_id = u.user_id
                    WHERE p.student_id = ?
                    ORDER BY f.created_at DESC
                    LIMIT 5
                `,
                [userId]
            )
        ]);

        res.status(200).json({
            success: true,
            role: "student",
            dashboardData: {
                totalProjects: getCount(projectResult, "totalProjects"),
                totalMilestones: getCount(milestoneResult, "totalMilestones"),
                totalDocuments: getCount(documentResult, "totalDocuments"),
                totalFeedback: getCount(feedbackResult, "totalFeedback"),
                studentProjects,
                upcomingMilestones,
                recentFeedback
            }
        });

    } catch (error) {

        sendError(res, error);

    }

};



// FACULTY DASHBOARD
exports.getFacultyDashboard = async (req, res) => {

    try {

        const userId = req.user.id;

        const [
            assignedProjectResult,
            pendingReviewResult,
            documentResult,
            feedbackResult,
            assignedProjects,
            pendingDocuments,
            recentDocuments,
            recentFeedbackGiven
        ] = await Promise.all([
            runQuery(
                "SELECT COUNT(*) AS totalAssignedProjects FROM projects WHERE guide_id = ?",
                [userId]
            ),
            runQuery(
                `
                    SELECT COUNT(*) AS pendingProjectReviews
                    FROM documents d
                    INNER JOIN projects p
                    ON d.project_id = p.project_id
                    WHERE p.guide_id = ?
                    AND NOT EXISTS (
                        SELECT 1
                        FROM feedback f
                        WHERE f.document_id = d.document_id
                    )
                `,
                [userId]
            ),
            runQuery(
                `
                    SELECT COUNT(*) AS totalSubmittedDocuments
                    FROM documents d
                    INNER JOIN projects p
                    ON d.project_id = p.project_id
                    WHERE p.guide_id = ?
                `,
                [userId]
            ),
            runQuery(
                "SELECT COUNT(*) AS totalFeedbackGiven FROM feedback WHERE user_id = ?",
                [userId]
            ),
            runQuery(
                `
                    SELECT
                        p.project_id,
                        p.title,
                        p.status,
                        p.end_date,
                        u.full_name AS student_name
                    FROM projects p
                    LEFT JOIN users u
                    ON p.student_id = u.user_id
                    WHERE p.guide_id = ?
                    ORDER BY p.created_at DESC
                    LIMIT 5
                `,
                [userId]
            ),
            runQuery(
                `
                    SELECT
                        d.document_id,
                        d.file_name,
                        d.document_type,
                        d.version_number,
                        d.uploaded_at,
                        p.title AS project_title,
                        m.title AS milestone_title,
                        u.full_name AS uploaded_by_name
                    FROM documents d
                    INNER JOIN projects p
                    ON d.project_id = p.project_id
                    LEFT JOIN milestones m
                    ON d.milestone_id = m.milestone_id
                    LEFT JOIN users u
                    ON d.uploaded_by = u.user_id
                    WHERE p.guide_id = ?
                    AND NOT EXISTS (
                        SELECT 1
                        FROM feedback f
                        WHERE f.document_id = d.document_id
                    )
                    ORDER BY d.uploaded_at DESC
                    LIMIT 5
                `,
                [userId]
            ),
            runQuery(
                `
                    SELECT
                        d.document_id,
                        d.file_name,
                        d.document_type,
                        d.version_number,
                        d.uploaded_at,
                        p.title AS project_title,
                        m.title AS milestone_title,
                        u.full_name AS uploaded_by_name
                    FROM documents d
                    INNER JOIN projects p
                    ON d.project_id = p.project_id
                    LEFT JOIN milestones m
                    ON d.milestone_id = m.milestone_id
                    LEFT JOIN users u
                    ON d.uploaded_by = u.user_id
                    WHERE p.guide_id = ?
                    ORDER BY d.uploaded_at DESC
                    LIMIT 5
                `,
                [userId]
            ),
            runQuery(
                `
                    SELECT
                        f.feedback_id,
                        f.comments,
                        f.status,
                        f.grade,
                        f.created_at,
                        p.title AS project_title,
                        d.file_name,
                        d.version_number,
                        m.title AS milestone_title,
                        u.full_name AS student_name
                    FROM feedback f
                    INNER JOIN projects p
                    ON f.project_id = p.project_id
                    LEFT JOIN documents d
                    ON f.document_id = d.document_id
                    LEFT JOIN milestones m
                    ON f.milestone_id = m.milestone_id
                    LEFT JOIN users u
                    ON p.student_id = u.user_id
                    WHERE f.user_id = ?
                    ORDER BY f.created_at DESC
                    LIMIT 5
                `,
                [userId]
            )
        ]);

        res.status(200).json({
            success: true,
            role: "faculty",
            dashboardData: {
                totalAssignedProjects:
                    getCount(assignedProjectResult, "totalAssignedProjects"),
                pendingProjectReviews:
                    getCount(pendingReviewResult, "pendingProjectReviews"),
                totalSubmittedDocuments:
                    getCount(documentResult, "totalSubmittedDocuments"),
                totalFeedbackGiven:
                    getCount(feedbackResult, "totalFeedbackGiven"),
                assignedProjects,
                pendingDocuments,
                recentDocuments,
                recentFeedbackGiven
            }
        });

    } catch (error) {

        sendError(res, error);

    }

};



// ADMIN DASHBOARD
exports.getAdminDashboard = async (req, res) => {

    try {

        const [
            userResult,
            projectResult,
            milestoneResult,
            fundingResult,
            documentResult,
            usersByRole,
            projectsByStatus,
            totalFundingAmount
        ] = await Promise.all([
            runQuery("SELECT COUNT(*) AS totalUsers FROM users"),
            runQuery("SELECT COUNT(*) AS totalProjects FROM projects"),
            runQuery("SELECT COUNT(*) AS totalMilestones FROM milestones"),
            runQuery("SELECT COUNT(*) AS totalFunding FROM funding"),
            runQuery("SELECT COUNT(*) AS totalDocuments FROM documents"),
            runQuery(
                `
                    SELECT role, COUNT(*) AS total
                    FROM users
                    GROUP BY role
                `
            ),
            runQuery(
                `
                    SELECT status, COUNT(*) AS total
                    FROM projects
                    GROUP BY status
                `
            ),
            runQuery(
                `
                    SELECT COALESCE(SUM(sanctioned_amount), 0) AS totalSanctionedAmount
                    FROM funding
                `
            )
        ]);

        res.status(200).json({
            success: true,
            role: "admin",
            dashboardData: {
                totalUsers: getCount(userResult, "totalUsers"),
                totalProjects: getCount(projectResult, "totalProjects"),
                totalMilestones: getCount(milestoneResult, "totalMilestones"),
                totalFunding: getCount(fundingResult, "totalFunding"),
                totalDocuments: getCount(documentResult, "totalDocuments"),
                totalSanctionedAmount: Number(
                    totalFundingAmount[0].totalSanctionedAmount
                ),
                usersByRole,
                projectsByStatus
            }
        });

    } catch (error) {

        sendError(res, error);

    }

};
