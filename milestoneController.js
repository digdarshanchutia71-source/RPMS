const db = require("../config/db");


// CREATE MILESTONE
exports.createMilestone = (req, res) => {

    try {

        const {
            project_id,
            title,
            description,
            due_date,
            extension_date
        } = req.body;

        if (!project_id || !title) {
            return res.status(400).json({
                success: false,
                message: "Project ID and Title are required"
            });
        }

        const query = `
            INSERT INTO milestones
            (
                project_id,
                title,
                description,
                due_date,
                extension_date
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            query,
            [
                project_id,
                title,
                description,
                due_date,
                extension_date
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
                    message: "Milestone Created Successfully"
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



// GET ALL MILESTONES
exports.getAllMilestones = (req, res) => {

    const query = `
        SELECT
            m.*,
            p.title AS project_title
        FROM milestones m
        LEFT JOIN projects p
        ON m.project_id = p.project_id
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
            milestones: results
        });

    });

};



// GET SINGLE MILESTONE
exports.getSingleMilestone = (req, res) => {

    const { id } = req.params;

    const query =
        "SELECT * FROM milestones WHERE milestone_id = ?";

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
                message: "Milestone Not Found"
            });
        }

        res.status(200).json({
            success: true,
            milestone: result[0]
        });

    });

};



// UPDATE MILESTONE
exports.updateMilestone = (req, res) => {

    const { id } = req.params;

    const {
        title,
        description,
        due_date,
        extension_date,
        status
    } = req.body;

    const query = `
        UPDATE milestones
        SET
            title = ?,
            description = ?,
            due_date = ?,
            extension_date = ?,
            status = ?
        WHERE milestone_id = ?
    `;

    db.query(
        query,
        [
            title,
            description,
            due_date,
            extension_date,
            status,
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
                message: "Milestone Updated Successfully"
            });

        }
    );

};



// DELETE MILESTONE
exports.deleteMilestone = (req, res) => {

    const { id } = req.params;

    const query =
        "DELETE FROM milestones WHERE milestone_id = ?";

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Milestone Deleted Successfully"
        });

    });

};
