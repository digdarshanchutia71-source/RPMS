const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getDashboardStats,
    getStudentDashboard,
    getFacultyDashboard,
    getAdminDashboard
} = require("../controllers/dashboardController");


// GET DASHBOARD DATA BASED ON LOGGED-IN ROLE
router.get(
    "/",
    verifyToken,
    getDashboardStats
);


// STUDENT DASHBOARD
router.get(
    "/student",
    verifyToken,
    authorizeRoles("student"),
    getStudentDashboard
);


// FACULTY DASHBOARD
router.get(
    "/faculty",
    verifyToken,
    authorizeRoles("faculty"),
    getFacultyDashboard
);


// ADMIN DASHBOARD
router.get(
    "/admin",
    verifyToken,
    authorizeRoles("admin"),
    getAdminDashboard
);


module.exports = router;
