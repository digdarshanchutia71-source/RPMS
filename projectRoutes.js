const express = require("express");

const router = express.Router();

const authorizeRoles = require("../middleware/roleMiddleware");

// IMPORT CONTROLLER FUNCTIONS
const {
    createProject,
    getAllProjects,
    getSingleProject,
    updateProject,
    deleteProject
} = require("../controllers/projectController");


// IMPORT JWT MIDDLEWARE
const verifyToken = require("../middleware/verifyToken");


// ==============================
// PROJECT ROUTES
// ==============================


// CREATE PROJECT - student/admin only
router.post(
    "/create",
    verifyToken,
    authorizeRoles("student", "admin"),
    createProject
);


// GET ALL PROJECTS - logged-in users only
router.get(
    "/",
    verifyToken,
    getAllProjects
);


// GET SINGLE PROJECT - logged-in users only
router.get(
    "/:id",
    verifyToken,
    getSingleProject
);


// UPDATE PROJECT - admin/faculty only
router.put(
    "/:id",
    verifyToken,
    authorizeRoles("admin", "faculty"),
    updateProject
);


// DELETE PROJECT - admin only
router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("admin"),
    deleteProject
);


module.exports = router;