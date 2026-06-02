const db = require("../config/db");
const fs = require("fs");


const deleteUploadedFile = (filePath) => {
    if (filePath) {
        fs.unlink(filePath, () => {});
    }
};


// UPLOAD DOCUMENT
exports.uploadDocument = (req, res) => {

    try {

        const {
            project_id,
            milestone_id,
            document_type
        } = req.body;

        if (!project_id || !milestone_id) {
            return res.status(400).json({
                success: false,
                message: "Project ID and Milestone ID are required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No File Uploaded"
            });
        }

        const file_name = req.file.filename;

        const file_path = req.file.path;

        const uploaded_by = req.user.id;

        const milestoneQuery = `
            SELECT
                milestone_id,
                due_date,
                extension_date,
                CASE
                    WHEN COALESCE(extension_date, due_date) IS NULL THEN 1
                    WHEN CURDATE() <= COALESCE(extension_date, due_date) THEN 1
                    ELSE 0
                END AS uploadAllowed
            FROM milestones
            WHERE milestone_id = ?
            AND project_id = ?
        `;

        db.query(
            milestoneQuery,
            [
                milestone_id,
                project_id
            ],
            (err, milestoneResult) => {

                if (err) {
                    deleteUploadedFile(file_path);

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                if (milestoneResult.length === 0) {
                    deleteUploadedFile(file_path);

                    return res.status(404).json({
                        success: false,
                        message: "Milestone Not Found for this Project"
                    });
                }

                if (!milestoneResult[0].uploadAllowed) {
                    deleteUploadedFile(file_path);

                    return res.status(400).json({
                        success: false,
                        message: "Milestone deadline has passed"
                    });
                }

                const versionQuery = `
                    SELECT MAX(version_number) AS latestVersion
                    FROM documents
                    WHERE project_id = ?
                    AND milestone_id = ?
                `;

                db.query(
                    versionQuery,
                    [
                        project_id,
                        milestone_id
                    ],
                    (err, versionResult) => {

                        if (err) {
                            deleteUploadedFile(file_path);

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });
                        }

                        const version_number =
                            (versionResult[0].latestVersion || 0) + 1;

                        const query = `
                            INSERT INTO documents
                            (
                                project_id,
                                milestone_id,
                                uploaded_by,
                                file_name,
                                file_path,
                                document_type,
                                version_number
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `;

                        db.query(
                            query,
                            [
                                project_id,
                                milestone_id,
                                uploaded_by,
                                file_name,
                                file_path,
                                document_type,
                                version_number
                            ],
                            (err, result) => {

                                if (err) {
                                    deleteUploadedFile(file_path);

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });
                                }

                                res.status(201).json({
                                    success: true,
                                    message: "Document Uploaded Successfully",
                                    file: file_name,
                                    version_number
                                });

                            }
                        );

                    }
                );

            }
        );

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};



// GET ALL DOCUMENTS
exports.getAllDocuments = (req, res) => {

    const query = `
        SELECT
            d.*,
            p.title AS project_title,
            m.title AS milestone_title,
            u.full_name AS uploaded_by_name
        FROM documents d
        LEFT JOIN projects p
        ON d.project_id = p.project_id
        LEFT JOIN milestones m
        ON d.milestone_id = m.milestone_id
        LEFT JOIN users u
        ON d.uploaded_by = u.user_id
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
            documents: results
        });

    });

};



// DELETE DOCUMENT
exports.deleteDocument = (req, res) => {

    const { id } = req.params;

    const query =
        "DELETE FROM documents WHERE document_id = ?";

    db.query(query, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Document Deleted Successfully"
        });

    });

};
