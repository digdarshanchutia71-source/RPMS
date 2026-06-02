const db = require("../config/db");


// CREATE PROJECT
exports.createProject = (req, res) => {

    try {

        const {
            title,
            description,
            abstract,
            methodology,
            domain,
            guide_id,
            student_id,
            start_date,
            end_date
        } = req.body;

        if (!title || !student_id) {
            return res.status(400).json({
                success: false,
                message: "Title and Student ID are required"
            });
        }

        const query = `
            INSERT INTO projects
            (
                title,
                description,
                abstract,
                methodology,
                domain,
                guide_id,
                student_id,
                start_date,
                end_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            query,
            [
                title,
                description,
                abstract,
                methodology,
                domain,
                guide_id,
                student_id,
                start_date,
                end_date
            ],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Project Creation Failed"
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Project Created Successfully"
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



// GET ALL PROJECTS
exports.getAllProjects = (req, res) => {

    const query = `
        SELECT
            p.*,
            u.full_name AS student_name
        FROM projects p
        LEFT JOIN users u
        ON p.student_id = u.user_id
    `;

    db.query(query, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to Fetch Projects"
            });
        }

        res.status(200).json({
            success: true,
            projects: results
        });

    });

};



// GET SINGLE PROJECT
exports.getSingleProject = (req, res) => {

    const { id } = req.params;

    const query =
        "SELECT * FROM projects WHERE project_id = ?";

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project Not Found"
            });
        }

        res.status(200).json({
            success: true,
            project: result[0]
        });

    });

};



// UPDATE PROJECT
exports.updateProject = (req, res) => {

    const { id } = req.params;

    const {
        title,
        description,
        abstract,
        methodology,
        domain,
        status,
        start_date,
        end_date
    } = req.body;

    const query = `
        UPDATE projects
        SET
            title = ?,
            description = ?,
            abstract = ?,
            methodology = ?,
            domain = ?,
            status = ?,
            start_date = ?,
            end_date = ?
        WHERE project_id = ?
    `;

    db.query(
        query,
        [
            title,
            description,
            abstract,
            methodology,
            domain,
            status,
            start_date,
            end_date,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Update Failed"
                });
            }

            res.status(200).json({
                success: true,
                message: "Project Updated Successfully"
            });

        }
    );

};



// DELETE PROJECT
exports.deleteProject = (req, res) => {

    const { id } = req.params;

    const query =
        "DELETE FROM projects WHERE project_id = ?";

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Delete Failed"
            });
        }

        res.status(200).json({
            success: true,
            message: "Project Deleted Successfully"
        });

    });

};
