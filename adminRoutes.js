const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");


const authorizeRoles =
    require("../middleware/roleMiddleware");



const {
    getAllUsers,
    deleteUser,
    approveProject,
    rejectProject,
    requestProjectRevision,
    assignGuideToProject
} = require("../controllers/adminController");


// GET ALL USERS
router.get(
    "/users",
    verifyToken,
    authorizeRoles("admin"),
    getAllUsers
);


// DELETE USER
router.delete(
    "/users/:id",
    verifyToken,
    authorizeRoles("admin"),
    deleteUser
);


// APPROVE PROJECT
router.put(
    "/projects/approve/:id",
    verifyToken,
    authorizeRoles("admin"),
    approveProject
);


// REJECT PROJECT
router.put(
    "/projects/reject/:id",
    verifyToken,
    authorizeRoles("admin"),
    rejectProject
);


// REQUEST PROJECT REVISION
router.put(
    "/projects/revision/:id",
    verifyToken,
    authorizeRoles("admin", "faculty"),
    requestProjectRevision
);

// ASSIGN FACULTY GUIDE TO PROJECT
router.put(
    "/projects/assign-guide/:id",
    verifyToken,
    authorizeRoles("admin"),
    assignGuideToProject
);

module.exports = router;
