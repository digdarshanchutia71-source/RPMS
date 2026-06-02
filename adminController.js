const db = require("../config/db");


// GET ALL USERS
exports.getAllUsers = (req, res) => {

    const query = `
        SELECT
            user_id,
            full_name,
            email,
            role,
            department,
            status,
            created_at
        FROM users
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
            users: results
        });

    });

};



// DELETE USER
exports.deleteUser = (req, res) => {

    const { id } = req.params;

    const query =
        "DELETE FROM users WHERE user_id = ?";

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "User Deleted Successfully"
        });

    });

};



// APPROVE PROJECT
exports.approveProject = (req, res) => {

    const { id } = req.params;

    const query = `
        UPDATE projects
        SET
            status = 'approved',
            revision_note = NULL
        WHERE project_id = ?
    `;

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Project Approved Successfully"
        });

    });

};



// REJECT PROJECT
exports.rejectProject = (req, res) => {

    const { id } = req.params;

    const query = `
        UPDATE projects
        SET
            status = 'rejected',
            revision_note = NULL
        WHERE project_id = ?
    `;

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Project Rejected Successfully"
        });

    });

};



// REQUEST PROJECT REVISION
exports.requestProjectRevision = (req, res) => {

    const { id } = req.params;
    const { revision_note } = req.body;

    if (!revision_note) {
        return res.status(400).json({
            success: false,
            message: "Revision note is required"
        });
    }

    const query = `
        UPDATE projects
        SET
            status = 'revision_required',
            revision_note = ?
        WHERE project_id = ?
    `;

    db.query(query, [revision_note, id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project Not Found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project Revision Requested Successfully"
        });

    });

};



// ASSIGN FACULTY GUIDE TO PROJECT
exports.assignGuideToProject = (req, res) => {

    const { id } = req.params;
    const { guide_id } = req.body;

    if (!guide_id) {
        return res.status(400).json({
            success: false,
            message: "Guide ID is required"
        });
    }

    const query = `
        UPDATE projects
        SET guide_id = ?
        WHERE project_id = ?
    `;

    db.query(query, [guide_id, id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Project Not Found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Faculty Guide Assigned Successfully"
        });

    });

};
