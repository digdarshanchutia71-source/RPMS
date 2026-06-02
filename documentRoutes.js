const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const verifyToken = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    uploadDocument,
    getAllDocuments,
    deleteDocument
} = require("../controllers/documentController");


// UPLOAD DOCUMENT - student only
router.post(
    "/upload",
    verifyToken,
    authorizeRoles("student"),
    upload.single("file"),
    uploadDocument
);


// GET ALL DOCUMENTS - logged-in users only
router.get(
    "/",
    verifyToken,
    getAllDocuments
);


// DELETE DOCUMENT - admin/faculty only
router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("admin", "faculty"),
    deleteDocument
);


module.exports = router;