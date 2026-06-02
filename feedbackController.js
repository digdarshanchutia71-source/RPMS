const db = require("../config/db");


// CREATE FEEDBACK
exports.createFeedback = (req, res) => {

    try {

        const {
            project_id,
            document_id,
            milestone_id,
            comments,
            status,
            grade
        } = req.body;

        if (
            !project_id ||
            !document_id ||
            !milestone_id ||
            !comments
        ) {
            return res.status(400).json({
                success: false,
                message: "Project ID, Document ID, Milestone ID and comments are required"
            });
        }

        const user_id = req.user.id;

        const query = `
            INSERT INTO feedback
            (
                project_id,
                document_id,
                milestone_id,
                user_id,
                comments,
                status,
                grade
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            query,
            [
                project_id,
                document_id,
                milestone_id,
                user_id,
                comments,
                status || "needs_changes",
                grade
            ],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Feedback Added Successfully"
                });

            }
        );

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};



// GET ALL FEEDBACK
exports.getAllFeedback = (req, res) => {

    const query = `
        SELECT
            f.*,
            p.title AS project_title,
            d.file_name,
            d.version_number,
            m.title AS milestone_title,
            u.full_name AS reviewer_name
        FROM feedback f
        LEFT JOIN projects p
        ON f.project_id = p.project_id
        LEFT JOIN documents d
        ON f.document_id = d.document_id
        LEFT JOIN milestones m
        ON f.milestone_id = m.milestone_id
        LEFT JOIN users u
        ON f.user_id = u.user_id
    `;

    db.query(query, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            feedback: results
        });

    });

};



// GET SINGLE FEEDBACK
exports.getSingleFeedback = (req, res) => {

    const { id } = req.params;

    const query = `
        SELECT
            f.*,
            p.title AS project_title,
            d.file_name,
            d.version_number,
            m.title AS milestone_title,
            u.full_name AS reviewer_name
        FROM feedback f
        LEFT JOIN projects p
        ON f.project_id = p.project_id
        LEFT JOIN documents d
        ON f.document_id = d.document_id
        LEFT JOIN milestones m
        ON f.milestone_id = m.milestone_id
        LEFT JOIN users u
        ON f.user_id = u.user_id
        WHERE f.feedback_id = ?
    `;

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Feedback Not Found"
            });
        }

        res.status(200).json({
            success: true,
            feedback: result[0]
        });

    });

};



// UPDATE FEEDBACK
exports.updateFeedback = (req, res) => {

    const { id } = req.params;

    const {
        document_id,
        milestone_id,
        comments,
        status,
        grade
    } = req.body;

    const query = `
        UPDATE feedback
        SET
            document_id = ?,
            milestone_id = ?,
            comments = ?,
            status = ?,
            grade = ?
        WHERE feedback_id = ?
    `;

    db.query(
        query,
        [
            document_id,
            milestone_id,
            comments,
            status,
            grade,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                message: "Feedback Updated Successfully"
            });

        }
    );

};



// DELETE FEEDBACK
exports.deleteFeedback = (req, res) => {

    const { id } = req.params;

    const query =
        "DELETE FROM feedback WHERE feedback_id = ?";

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Feedback Deleted Successfully"
        });

    });

};
