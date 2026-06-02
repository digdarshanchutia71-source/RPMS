const db = require("../config/db");


// CREATE FUNDING
exports.createFunding = (req, res) => {

    try {

        const {
            project_id,
            funding_agency,
            sanctioned_amount,
            approval_date,
            grant_id,
            utilization_status
        } = req.body;

        if (!project_id || !funding_agency) {
            return res.status(400).json({
                success: false,
                message: "Project ID and Funding Agency are required"
            });
        }

        const query = `
            INSERT INTO funding
            (
                project_id,
                funding_agency,
                sanctioned_amount,
                approval_date,
                grant_id,
                utilization_status
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            query,
            [
                project_id,
                funding_agency,
                sanctioned_amount,
                approval_date,
                grant_id,
                utilization_status || "Not Used"
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
                    message: "Funding Added Successfully"
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



// GET ALL FUNDING
exports.getAllFunding = (req, res) => {

    const query = `
        SELECT
            f.*,
            p.title AS project_title
        FROM funding f
        LEFT JOIN projects p
        ON f.project_id = p.project_id
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
            funding: results
        });

    });

};



// GET SINGLE FUNDING
exports.getSingleFunding = (req, res) => {

    const { id } = req.params;

    const query =
        "SELECT * FROM funding WHERE funding_id = ?";

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
                message: "Funding Record Not Found"
            });
        }

        res.status(200).json({
            success: true,
            funding: result[0]
        });

    });

};



// UPDATE FUNDING
exports.updateFunding = (req, res) => {

    const { id } = req.params;

    const {
        funding_agency,
        sanctioned_amount,
        approval_date,
        grant_id,
        utilization_status
    } = req.body;

    const query = `
        UPDATE funding
        SET
            funding_agency = ?,
            sanctioned_amount = ?,
            approval_date = ?,
            grant_id = ?,
            utilization_status = ?
        WHERE funding_id = ?
    `;

    db.query(
        query,
        [
            funding_agency,
            sanctioned_amount,
            approval_date,
            grant_id,
            utilization_status,
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
                message: "Funding Updated Successfully"
            });

        }
    );

};



// DELETE FUNDING
exports.deleteFunding = (req, res) => {

    const { id } = req.params;

    const query =
        "DELETE FROM funding WHERE funding_id = ?";

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Funding Deleted Successfully"
        });

    });

};
